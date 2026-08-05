import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { QuestionsService } from '../questions';
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
    materialId?: string,
    difficulty?: string,
  ): Promise<{ message: string; questions: any[] }> {
    const apiKey = this.configService.get('app.openRouterApiKey', {
      infer: true,
    });
    const model = this.configService.get('app.openRouterModel', {
      infer: true,
    });

    if (!apiKey) {
      throw new BadRequestException('OpenRouter API key not configured');
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

    const prompt = this.buildPrompt(topic, count, context, difficulty);

    try {
      const systemMessage = context
        ? `You are an expert exam question generator. Generate high-quality multiple choice questions based on the provided course material. Each question should have exactly 4 options with one correct answer. Base your questions strictly on the material provided — do not fabricate information beyond the source text.`
        : `You are an expert exam question generator. Generate high-quality multiple choice questions for educational purposes. Each question should have exactly 4 options with one correct answer.`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: model || 'google/gemini-3.5-flash',
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
      this.logger.log(`Parsed ${questions.length} questions from response.`);
      if (questions.length === 0) {
        this.logger.log(`Failed to parse questions. Raw content: ${content}`);
      }

      return {
        message: `Successfully generated ${questions.length} questions. Please review them before saving.`,
        questions,
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
  private buildPrompt(
    topic: string,
    count: number,
    context?: string,
    difficulty?: string,
  ): string {
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
${difficulty ? `\nThe difficulty level of the questions must be strictly: ${difficulty.toUpperCase()}. Ensure the questions, distractors, and concepts align with this difficulty level.` : ''}

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
    const questionRegex =
      /(?:\*{0,2}#*\s*)?---QUESTION---(?:\*{0,2}\s*)([\s\S]*?)(?:\*{0,2}#*\s*)?---OPTIONS---(?:\*{0,2}\s*)([\s\S]*?)(?:\*{0,2}#*\s*)?---CORRECT---(?:\*{0,2}\s*)([\s\S]*?)(?:\*{0,2}#*\s*)?---HINT---(?:\*{0,2}\s*)([\s\S]*?)(?:(?:\*{0,2}#*\s*)?---END---|$)/gi;

    let match;
    while ((match = questionRegex.exec(content)) !== null) {
      try {
        const questionContent = match[1].trim();
        const optionsText = match[2].trim();
        const correctText = match[3].trim();
        const hintText = match[4].trim();

        const optionRegex = /([A-D])[.)]\s*(.+?)(?=\n[A-D][.)]|$)/gs;
        const options: { letter: string; content: string }[] = [];
        let optMatch;
        const optionsTextNormalized = optionsText + '\n';
        while ((optMatch = optionRegex.exec(optionsTextNormalized)) !== null) {
          options.push({
            letter: optMatch[1].toUpperCase(),
            content: optMatch[2].trim(),
          });
        }

        if (options.length < 2) continue;

        const correctLetterMatch = correctText.match(/([A-D])/i);
        if (!correctLetterMatch) continue;
        const correctLetter = correctLetterMatch[1].toUpperCase();

        const answers = options.map((opt) => ({
          content: opt.content,
          isCorrect: opt.letter === correctLetter,
        }));

        const correctCount = answers.filter((a) => a.isCorrect).length;
        if (correctCount !== 1) continue;

        questions.push({
          content: questionContent,
          hint: hintText || 'Review the course material for this topic.',
          answers,
        });
      } catch (err) {
        this.logger.warn(`Failed to parse question block: ${err}`);
      }
    }

    return questions;
  }
}
