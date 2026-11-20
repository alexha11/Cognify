import {
  Injectable,
  Logger,
  BadGatewayException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RagService } from './rag.service';
import { Config } from '../../config';
import { PrismaService } from '../../prisma';
import { CourseAccessService } from '../../common/access';
import { AI_MAX_TOKENS, AI_TEMPERATURE } from '../../common/constants';
import type { AuthenticatedUser } from '../auth/interfaces';
import { GenerateQuestionsDto } from './dto';
import { GeneratedQuestion, parseGeneratedQuestions } from './question-parser';

/** Long enough for a full response, short enough not to hold a request forever. */
const CHAT_TIMEOUT_MS = 90_000;

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly ragService: RagService,
    private readonly prisma: PrismaService,
    private readonly access: CourseAccessService,
  ) {}

  /**
   * Draft questions for a course the caller manages, optionally grounded in
   * one of that course's materials. Nothing is saved: the instructor reviews
   * the drafts and saves them through POST /questions/bulk.
   */
  async generateQuestions(
    dto: GenerateQuestionsDto,
    user: AuthenticatedUser,
  ): Promise<{ message: string; questions: GeneratedQuestion[] }> {
    const apiKey = this.configService.get('app.openRouterApiKey', {
      infer: true,
    });
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI generation is not configured (OPENROUTER_API_KEY is missing).',
      );
    }

    await this.access.assertCanManage(dto.courseId, user);

    let context: string | undefined;
    if (dto.materialId) {
      const material = await this.prisma.material.findUnique({
        where: { id: dto.materialId },
        select: { courseId: true },
      });
      if (!material || material.courseId !== dto.courseId) {
        throw new NotFoundException('Material not found in this course');
      }

      const chunks = await this.ragService.similaritySearch(
        dto.topic,
        dto.materialId,
        5,
      );
      if (chunks.length > 0) {
        context = chunks.join('\n\n');
      }
    }

    const count = dto.count ?? 5;
    const content = await this.complete(
      this.buildSystemMessage(!!context),
      this.buildPrompt(dto.topic, count, context, dto.difficulty),
      apiKey,
    );

    const questions = parseGeneratedQuestions(content).slice(0, count);
    if (questions.length === 0) {
      this.logger.warn(`No questions parsed from AI response: ${content}`);
    }

    return {
      message: `Successfully generated ${questions.length} questions. Please review them before saving.`,
      questions,
    };
  }

  private async complete(
    system: string,
    prompt: string,
    apiKey: string,
  ): Promise<string> {
    const model = this.configService.get('app.openRouterModel', {
      infer: true,
    });
    const frontendUrl = this.configService.get('app.frontendUrl', {
      infer: true,
    });

    try {
      const response = await axios.post<ChatCompletionResponse>(
        this.apiUrl,
        {
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
          temperature: AI_TEMPERATURE,
          max_tokens: AI_MAX_TOKENS,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            // OpenRouter attribution headers.
            ...(frontendUrl && { 'HTTP-Referer': frontendUrl }),
            'X-Title': 'Cognify',
          },
          timeout: CHAT_TIMEOUT_MS,
        },
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new BadGatewayException('The AI service returned no content');
      }
      return content;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      const reason = axios.isAxiosError<{ error?: { message?: string } }>(error)
        ? (error.response?.data?.error?.message ?? error.message)
        : String(error);
      this.logger.error(`AI generation failed: ${reason}`);
      throw new BadGatewayException(`AI generation failed: ${reason}`);
    }
  }

  private buildSystemMessage(hasContext: boolean): string {
    return hasContext
      ? 'You are an expert exam question generator. Generate high-quality multiple choice questions based on the provided course material. Each question should have exactly 4 options with one correct answer. Base your questions strictly on the material provided — do not fabricate information beyond the source text.'
      : 'You are an expert exam question generator. Generate high-quality multiple choice questions for educational purposes. Each question should have exactly 4 options with one correct answer.';
  }

  private buildPrompt(
    topic: string,
    count: number,
    context?: string,
    difficulty?: string,
  ): string {
    const contextBlock = context
      ? `--- COURSE MATERIAL ---
${context}
--- END COURSE MATERIAL ---

Using the course material above as your primary source, generate`
      : 'Generate';

    return `${contextBlock} ${count} multiple choice exam questions about: "${topic}"
${difficulty ? `\nThe difficulty level of the questions must be strictly: ${difficulty}. Ensure the questions, distractors, and concepts align with this difficulty level.` : ''}

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
}
