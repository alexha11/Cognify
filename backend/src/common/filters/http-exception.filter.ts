import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: status.toString(),
        message:
          typeof message === 'string'
            ? message
            : (message as any).message || 'Error',
        details: typeof message === 'object' ? message : null,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack,
        'HttpExceptionFilter',
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${errorResponse.error.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
