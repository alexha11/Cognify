import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { QuestionsService } from '../questions';
import { OrganizationsService } from '../organizations';
import { RagService } from './rag.service';
import { Config } from '../../config';

interface GeneratedQuestion {
  content: string;
  hint: string;
  answers: { content: string; isCorrect: boolean }[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly questionsService: QuestionsService,
    private readonly organizationsService: OrganizationsService,
    private readonly ragService: RagService,
  ) {}

  /**
   * Generate AI questions using OpenRouter API
   */
  async generateQuestions(
    courseId: string,
    topic: string,
    count: number,
    userId: string,
    organizationId: string,
    materialId?: string,
  ): Promise<{ message: string; questionsCreated: number }> {
    const apiKey = this.configService.get('app.openRouterApiKey', {
      infer: true,
    });
    const model = this.configService.get('app.openRouterModel', {
      infer: true,
    });

    if (!apiKey) {
      throw new BadRequestException('OpenRouter API key not configured');
    }

    // Check plan limits before generating
    const canCreate = await this.organizationsService.checkPlanLimit(
      organizationId,
      'questions',
    );

    if (!canCreate) {
      throw new BadRequestException(
        'Question limit reached for your plan. Please upgrade.',
      );
    }

    // Retrieve RAG context if materialId is provided
    let context: string | undefined;
    if (materialId) {
      const chunks = await this.ragService.similaritySearch(
        topic,
        materialId,
        5,
      );
      if (chunks.length > 0) {
        context = chunks.join('\n\n');
        this.logger.log(
          `RAG: Using ${chunks.length} context chunks for generation`,
        );
      }
    }

    const prompt = this.buildPrompt(topic, count, context);

    try {
      const systemMessage = context
        ? `You are an expert exam question generator. Generate high-quality multiple choice questions based on the provided course material. Each question should have exactly 4 options with one correct answer. Base your questions strictly on the material provided — do not fabricate information beyond the source text.`
        : `You are an expert exam question generator. Generate high-quality multiple choice questions for educational purposes. Each question should have exactly 4 options with one correct answer.`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: model || 'google/gemini-2.0-flash',
          messages: [
            {
              role: 'system',
              content: systemMessage,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://examai.app',
            'X-Title': 'ExamAI Platform',
          },
        },
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new BadRequestException('No response from AI');
      }

      const questions = this.parseAiResponse(content);

      // Save questions to database
      let created = 0;
      for (const q of questions) {
        try {
          await this.questionsService.createAiQuestion(
            q.content,
            q.hint,
            q.answers,
            courseId,
            userId,
          );
          created++;
        } catch (err) {
          this.logger.warn(`Failed to create question: ${err}`);
        }
      }

      return {
        message: `Successfully generated ${created} questions. They are pending approval.`,
        questionsCreated: created,
      };
    } catch (error) {
      this.logger.error('AI generation failed', error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `AI generation failed: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw new BadRequestException('AI generation failed');
    }
  }

  /**
   * Build prompt for question generation, optionally with RAG context
   */
  private buildPrompt(topic: string, count: number, context?: string): string {
    let contextBlock = '';
    if (context) {
      contextBlock = `--- COURSE MATERIAL ---
${context}
--- END COURSE MATERIAL ---

Using the course material above as your primary source, generate`;
    } else {
      contextBlock = `Generate`;
    }

    return `${contextBlock} ${count} multiple choice exam questions about: "${topic}"

For each question, use this exact format:

---QUESTION---
[Write the question text here]

---OPTIONS---
A. [First option]
B. [Second option]
C. [Third option]
D. [Fourth option]

---CORRECT---
[Letter of correct answer: A, B, C, or D]

---HINT---
[A helpful hint for students who answer incorrectly]

---END---

Important:
- Generate exactly ${count} questions
- Each question must have exactly 4 options
- Only one correct answer per question
- Make questions challenging but fair
- Include practical, real-world scenarios when relevant${context ? '\n- Base all questions on the provided course material' : ''}`;
  }

  /**
   * Parse AI response into structured questions
   */
  private parseAiResponse(content: string): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];
    const questionBlocks = content
      .split('---QUESTION---')
      .filter((b) => b.trim());

    for (const block of questionBlocks) {
      try {
        const question = this.parseQuestionBlock(block);
        if (question) {
          questions.push(question);
        }
      } catch (err) {
        this.logger.warn(`Failed to parse question block: ${err}`);
      }
    }

    return questions;
  }

  /**
   * Parse individual question block
   */
  private parseQuestionBlock(block: string): GeneratedQuestion | null {
    // Extract question content
    const questionMatch = block.match(/^([\s\S]*?)---OPTIONS---/);
    if (!questionMatch) return null;
    const questionContent = questionMatch[1].trim();

    // Extract options
    const optionsMatch = block.match(/---OPTIONS---([\s\S]*?)---CORRECT---/);
    if (!optionsMatch) return null;
    const optionsText = optionsMatch[1].trim();

    // Parse options
    const optionRegex = /([A-D])\.\s*(.+?)(?=\n[A-D]\.|$)/gs;
    const options: { letter: string; content: string }[] = [];
    let match;
    while ((match = optionRegex.exec(optionsText + '\n')) !== null) {
      options.push({
        letter: match[1],
        content: match[2].trim(),
      });
    }

    if (options.length < 2) return null;

    // Extract correct answer
    const correctMatch = block.match(/---CORRECT---\s*([A-D])/i);
    if (!correctMatch) return null;
    const correctLetter = correctMatch[1].toUpperCase();

    // Extract hint
    const hintMatch = block.match(/---HINT---\s*([\s\S]*?)(?:---END---|$)/);
    const hint = hintMatch
      ? hintMatch[1].trim()
      : 'Review the course material for this topic.';

    // Build answers array
    const answers = options.map((opt) => ({
      content: opt.content,
      isCorrect: opt.letter === correctLetter,
    }));

    // Ensure exactly one correct answer
    const correctCount = answers.filter((a) => a.isCorrect).length;
    if (correctCount !== 1) return null;

    return {
      content: questionContent,
      hint,
      answers,
    };
  }
}
