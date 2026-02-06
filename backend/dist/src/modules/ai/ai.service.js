"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const questions_1 = require("../questions");
const organizations_1 = require("../organizations");
let AiService = AiService_1 = class AiService {
    configService;
    questionsService;
    organizationsService;
    logger = new common_1.Logger(AiService_1.name);
    apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    constructor(configService, questionsService, organizationsService) {
        this.configService = configService;
        this.questionsService = questionsService;
        this.organizationsService = organizationsService;
    }
    async generateQuestions(courseId, topic, count, userId, organizationId) {
        const apiKey = this.configService.get('app.openRouterApiKey', { infer: true });
        const model = this.configService.get('app.openRouterModel', { infer: true });
        if (!apiKey) {
            throw new common_1.BadRequestException('OpenRouter API key not configured');
        }
        const canCreate = await this.organizationsService.checkPlanLimit(organizationId, 'questions');
        if (!canCreate) {
            throw new common_1.BadRequestException('Question limit reached for your plan. Please upgrade.');
        }
        const prompt = this.buildPrompt(topic, count);
        try {
            const response = await axios_1.default.post(this.apiUrl, {
                model: model || 'google/gemini-2.0-flash',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert exam question generator. Generate high-quality multiple choice questions for educational purposes. Each question should have exactly 4 options with one correct answer.`,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 4000,
            }, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://examai.app',
                    'X-Title': 'ExamAI Platform',
                },
            });
            const content = response.data.choices[0]?.message?.content;
            if (!content) {
                throw new common_1.BadRequestException('No response from AI');
            }
            const questions = this.parseAiResponse(content);
            let created = 0;
            for (const q of questions) {
                try {
                    await this.questionsService.createAiQuestion(q.content, q.hint, q.answers, courseId, userId);
                    created++;
                }
                catch (err) {
                    this.logger.warn(`Failed to create question: ${err}`);
                }
            }
            return {
                message: `Successfully generated ${created} questions. They are pending approval.`,
                questionsCreated: created,
            };
        }
        catch (error) {
            this.logger.error('AI generation failed', error);
            if (axios_1.default.isAxiosError(error)) {
                throw new common_1.BadRequestException(`AI generation failed: ${error.response?.data?.error?.message || error.message}`);
            }
            throw new common_1.BadRequestException('AI generation failed');
        }
    }
    buildPrompt(topic, count) {
        return `Generate ${count} multiple choice exam questions about: "${topic}"

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
- Include practical, real-world scenarios when relevant`;
    }
    parseAiResponse(content) {
        const questions = [];
        const questionBlocks = content.split('---QUESTION---').filter((b) => b.trim());
        for (const block of questionBlocks) {
            try {
                const question = this.parseQuestionBlock(block);
                if (question) {
                    questions.push(question);
                }
            }
            catch (err) {
                this.logger.warn(`Failed to parse question block: ${err}`);
            }
        }
        return questions;
    }
    parseQuestionBlock(block) {
        const questionMatch = block.match(/^([\s\S]*?)---OPTIONS---/);
        if (!questionMatch)
            return null;
        const questionContent = questionMatch[1].trim();
        const optionsMatch = block.match(/---OPTIONS---([\s\S]*?)---CORRECT---/);
        if (!optionsMatch)
            return null;
        const optionsText = optionsMatch[1].trim();
        const optionRegex = /([A-D])\.\s*(.+?)(?=\n[A-D]\.|$)/gs;
        const options = [];
        let match;
        while ((match = optionRegex.exec(optionsText + '\n')) !== null) {
            options.push({
                letter: match[1],
                content: match[2].trim(),
            });
        }
        if (options.length < 2)
            return null;
        const correctMatch = block.match(/---CORRECT---\s*([A-D])/i);
        if (!correctMatch)
            return null;
        const correctLetter = correctMatch[1].toUpperCase();
        const hintMatch = block.match(/---HINT---\s*([\s\S]*?)(?:---END---|$)/);
        const hint = hintMatch ? hintMatch[1].trim() : 'Review the course material for this topic.';
        const answers = options.map((opt) => ({
            content: opt.content,
            isCorrect: opt.letter === correctLetter,
        }));
        const correctCount = answers.filter((a) => a.isCorrect).length;
        if (correctCount !== 1)
            return null;
        return {
            content: questionContent,
            hint,
            answers,
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        questions_1.QuestionsService,
        organizations_1.OrganizationsService])
], AiService);
//# sourceMappingURL=ai.service.js.map