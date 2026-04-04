# Detailed Implementation Plan: Retrieval-Augmented Generation (RAG) for Cognify

This document outlines the architecture, data flow, component changes, and recommended technologies for implementing the RAG-based AI Generation feature in the Cognify platform.

## 1. RAG Architecture Overview

The RAG architecture enables the Generative AI (like Gemini, Claude, or GPT) to answer questions or generate content based _strictly_ on specific course materials uploaded by users. It works by converting text into numerical representations (embeddings) and performing mathematical similarity searches to find the most relevant information to feed the AI.

### Infrastructure Components

- **Database**: PostgreSQL
- **Vector Extension**: `pgvector` (Provides fast similarity search capabilities within PostgreSQL).
- **Embedding Model**: Converts text chunks into fixed-length arrays of floating-point numbers. (e.g., OpenAI `text-embedding-3-small` or an open-source alternative like `BaaI/bge-small-en-v1.5` if you decide to self-host or use an OpenRouter embedded API).
- **Generative Model**: LLM responsible for taking the prompt + the retrieved text chunks and generating the final output (e.g., `google/gemini-2.0-flash` currently used in `ai.service.ts`).

---

## 2. The Ingestion Pipeline (When a Material is Uploaded)

This phase happens asynchronously right after a user uploads a new document (e.g., a PDF) for a course.

1.  **File Upload**: The user uploads the file via `MaterialsController`.
2.  **Text Extraction**: A background service extracts raw textual content from the file (using libraries like `pdf-parse` or `@textract/textract`).
3.  **Chunking**: The extracted text is split into small, logical pieces (e.g., 500–1000 characters) to ensure the embedding model focuses on specific semantic concepts. It's best practice to include a slight overlap (e.g., 100 characters) between consecutive chunks so context isn't lost at the boundaries. The `@langchain/textsplitters` library (`RecursiveCharacterTextSplitter`) is excellent for this.
4.  **Embedding Generation**: Each chunk is sent to the Embedding API, which returns a dense vector representation.
5.  **Storage**: The plain text chunk, its corresponding vector, and its parent `Material` ID are saved into a new database table called `MaterialChunk`.

---

## 3. The Retrieval & Generation Pipeline (When a User Requests AI Generation)

This phase happens when a user clicks "Generate Quiz" or "Summarize" based on specific course materials.

1.  **Request Formulation**: The user (or the system on their behalf) provides a query, such as: _"Generate 5 multiple-choice questions about [Topic] based on [Material ID]."_
2.  **Query Embedding**: That query string is sent to the _same_ Embedding API used during ingestion to get a vector representation of the user's request.
3.  **Vector Search**: Using raw SQL or Prisma + `pgvector`, the system performs a cosine similarity search comparing the request vector against all chunk vectors linked to the provided `Material ID`. The system retrieves the top $K$ most similar chunks (e.g., the top 5 most relevant paragraphs).
4.  **Prompt Assembly**: The retrieved text chunks are assembled into a strict system prompt.

    ```text
    You are an expert educational AI. Based strictly on the following context, generate 5 multiple choice questions...

    --- CONTEXT ---
    [Retrieved Chunk 1 Text]
    [Retrieved Chunk 2 Text]
    ...
    ```

5.  **LLM Call**: Send the assembled prompt (which now includes both the user's instruction and the actual source material) to your Generative Model (OpenRouter API).
6.  **Response Handling**: The generated JSON or text is parsed, formatted into standard database entities (e.g., Questions, Answers), and saved.

---

## 4. Required Tech Stack Changes (NestJS Backend)

### 4.1. Database Updates (`schema.prisma` / TypeORM entities)

You will need to ensure PostgreSQL has the `pgvector` extension installed.

- Enable extension in Prisma:

  ```prisma
  generator client {
    provider        = "prisma-client-js"
    previewFeatures = ["postgresqlExtensions"]
  }

  datasource db {
    provider   = "postgresql"
    url        = env("DATABASE_URL")
    extensions = [vector]
  }
  ```

- Add the `MaterialChunk` model:
  ```prisma
  model MaterialChunk {
    id         String   @id @default(uuid())
    materialId String
    material   Material @relation(fields: [materialId], references: [id], onDelete: Cascade)
    content    String   // The actual raw text chunk
    vector     Unsupported("vector(1536)") // Type depends on the embedding model (e.g., 1536 for OpenAI)

    @@index([vector]) // Create a vector index for fast similarity search
  }
  ```

### 4.2. Backend Library Additions

Install the following essential libraries for the backend:

- `npm install @langchain/core @langchain/textsplitters` (for easy, intelligent text chunking).
- `npm install pdf-parse` (if handling PDFs natively).

### 4.3. Module Updates

- **`ai.service.ts`**:
  - Implement an `embedText(text: string): Promise<number[]>` method.
  - Implement a `similaritySearch(queryVector: number[], materialId: string): Promise<string[]>` method to execute the raw SQL query against `pgvector`.
  - Update `generateQuestions` to weave in the retrieved context if a material ID is provided in the DTO.
- **`materials.service.ts`**:
  - Implement an asynchronous or queued job (e.g., BullMQ) that runs right after a material is successfully uploaded. This job will extract text, call the chunking logic, call the `ai.service` for embeddings, and write to the database in bulk.

---

## 5. Required Tech Stack Changes (Next.js Frontend)

### 5.1. UI Components

- **AI Generation Modal**: Update the existing UI to allow users to select _specific_ materials as the source context for generation instead of open-ended topics.
- **Loading Indicators**: RAG introduces slightly more latency due to vector search and larger prompt sizes. Add multi-stage loading states (e.g., "Analyzing materials...", "Generating questions...").

### 5.2. API Integration (`src/lib/api.ts`)

- Add endpoint wrappers (e.g., `generateQuestionsFromMaterial(courseId, materialId)`).

---

## 6. Development Phasing

- **Phase 1**: Database migrations (`pgvector` + schema) and basic Embedding Service implementation.
- **Phase 2**: Implement the Upload -> Extract -> Chunk -> Embed -> Store ingestion pipeline.
- **Phase 3**: Update the `AiService.generateQuestions` endpoint to accept context and execute the semantic search.
- **Phase 4**: Frontend UI updates and integration testing.
