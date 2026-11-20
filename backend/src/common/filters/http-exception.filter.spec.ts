import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { resolveError } from './http-exception.filter';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('boom', {
    code,
    clientVersion: 'test',
  });

describe('resolveError', () => {
  it('passes HTTP exceptions through with their message', () => {
    expect(
      resolveError(new NotFoundException('Course not found')),
    ).toMatchObject({ status: 404, message: 'Course not found' });
  });

  it('joins validation messages into one sentence', () => {
    const error = new UnprocessableEntityException({
      message: ['name should not be empty', 'isPublic must be a boolean value'],
    });
    expect(resolveError(error).message).toBe(
      'name should not be empty. isPublic must be a boolean value',
    );
  });

  it.each([
    ['P2025', 404],
    ['P2002', 409],
    ['P2003', 400],
  ])('maps Prisma %s to %i instead of 500', (code, status) => {
    expect(resolveError(prismaError(code)).status).toBe(status);
  });

  it('hides unknown errors behind a generic 500', () => {
    expect(resolveError(new Error('secret detail'))).toEqual({
      status: 500,
      message: 'Internal server error',
      details: null,
    });
    expect(resolveError(prismaError('P1001')).status).toBe(500);
  });

  it('keeps the response body as details for client errors', () => {
    expect(resolveError(new BadRequestException('Nope')).details).toMatchObject(
      { message: 'Nope', statusCode: 400 },
    );
  });
});
