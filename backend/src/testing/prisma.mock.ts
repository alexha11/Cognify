import { Role } from '@prisma/client';
import type { PrismaService } from '../prisma';
import type { AuthenticatedUser } from '../modules/auth/interfaces';

const MODELS = [
  'user',
  'emailVerification',
  'course',
  'material',
  'question',
  'answer',
  'attempt',
  'quizProgress',
  'leaderboardEntry',
  'roleRequest',
  'coursePrerequisite',
] as const;

const METHODS = [
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findMany',
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
  'count',
] as const;

type ModelMock = Record<(typeof METHODS)[number], jest.Mock>;

export type PrismaMock = Record<(typeof MODELS)[number], ModelMock> & {
  $transaction: jest.Mock;
  $queryRaw: jest.Mock;
  $executeRaw: jest.Mock;
};

/**
 * A PrismaService stand-in whose model methods are all jest.fn(). Interactive
 * transactions run their callback against the same mock; array transactions
 * resolve each element.
 */
export function createPrismaMock(): PrismaMock {
  const mock = {} as PrismaMock;
  for (const model of MODELS) {
    mock[model] = Object.fromEntries(
      METHODS.map((method) => [method, jest.fn()]),
    ) as ModelMock;
  }
  mock.$queryRaw = jest.fn();
  mock.$executeRaw = jest.fn();
  mock.$transaction = jest.fn((arg: unknown) =>
    typeof arg === 'function'
      ? (arg as (tx: PrismaMock) => unknown)(mock)
      : Promise.all(arg as Promise<unknown>[]),
  );
  return mock;
}

export const asPrisma = (mock: PrismaMock) => mock as unknown as PrismaService;

export const admin: AuthenticatedUser = {
  userId: 'user-admin',
  email: 'admin@example.com',
  role: Role.ADMIN,
};
export const owner: AuthenticatedUser = {
  userId: 'user-owner',
  email: 'owner@example.com',
  role: Role.INSTRUCTOR,
};
export const otherInstructor: AuthenticatedUser = {
  userId: 'user-other',
  email: 'other@example.com',
  role: Role.INSTRUCTOR,
};
export const student: AuthenticatedUser = {
  userId: 'user-student',
  email: 'student@example.com',
  role: Role.STUDENT,
};

export const publicCourse = {
  id: 'course-public',
  name: 'Public course',
  description: null,
  isPublic: true,
  createdById: owner.userId,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};
export const privateCourse = {
  ...publicCourse,
  id: 'course-private',
  name: 'Private course',
  isPublic: false,
};
