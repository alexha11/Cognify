import { AiService } from './ai.service';
import { GenerateQuestionsDto } from './dto';
import type { AuthenticatedUser } from '../auth/interfaces';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    generateQuestions(dto: GenerateQuestionsDto, user: AuthenticatedUser): Promise<{
        message: string;
        questionsCreated: number;
    }>;
}
