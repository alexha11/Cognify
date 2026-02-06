import { ConfigService } from '@nestjs/config';
import { QuestionsService } from '../questions';
import { OrganizationsService } from '../organizations';
import { Config } from '../../config';
export declare class AiService {
    private readonly configService;
    private readonly questionsService;
    private readonly organizationsService;
    private readonly logger;
    private readonly apiUrl;
    constructor(configService: ConfigService<Config>, questionsService: QuestionsService, organizationsService: OrganizationsService);
    generateQuestions(courseId: string, topic: string, count: number, userId: string, organizationId: string): Promise<{
        message: string;
        questionsCreated: number;
    }>;
    private buildPrompt;
    private parseAiResponse;
    private parseQuestionBlock;
}
