import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/response.interface';

const SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;

interface ResolvedError {
  status: number;
  message: string;
  details: unknown;
}

/**
 * Database errors that describe the request rather than a server fault. They
 * used to surface as 500s (for example when two requests raced to delete the
 * same row).
 */
const PRISMA_ERRORS: Record<string, { status: number; message: string }> = {
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Record not found' },
  P2002: {
    status: HttpStatus.CONFLICT,
    message: 'A record with these details already exists',
  },
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    message: 'A related record does not exist',
  },
};

export function resolveError(exception: unknown): ResolvedError {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    return {
      status: exception.getStatus(),
      message: messageOf(response) ?? exception.message,
      details: typeof response === 'object' ? response : null,
    };
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    const known = PRISMA_ERRORS[exception.code];
    if (known) {
      return { ...known, details: null };
    }
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    details: null,
  };
}

/** Validation errors carry a list of messages; join them into one sentence. */
function messageOf(response: string | object): string | undefined {
  if (typeof response === 'string') return response;
  const message = (response as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.map(String).join('. ');
  return undefined;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { status, message, details } = resolveError(exception);

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: status.toString(),
        message,
        details,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    };

    if (status >= SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
