export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
export interface ApiErrorResponse {
    success: boolean;
    error: {
        code: string;
        message: string;
        details?: any;
        path: string;
        timestamp: string;
    };
}
