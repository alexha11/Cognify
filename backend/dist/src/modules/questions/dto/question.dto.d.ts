export declare class CreateAnswerDto {
    content: string;
    isCorrect: boolean;
}
export declare class CreateQuestionDto {
    content: string;
    hint?: string;
    courseId: string;
    answers: CreateAnswerDto[];
}
export declare class UpdateQuestionDto {
    content?: string;
    hint?: string;
    approved?: boolean;
}
export declare class GenerateQuestionsDto {
    courseId: string;
    topic?: string;
    count?: number;
}
