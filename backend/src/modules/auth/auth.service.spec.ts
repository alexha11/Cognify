import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import {
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '../../common/constants';
import {
  asPrisma,
  createPrismaMock,
  PrismaMock,
} from '../../testing/prisma.mock';

const PASSWORD = 'correct-horse-battery';
// Low cost keeps the suite fast; bcrypt.compare works with any cost.
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);

const baseUser = {
  id: 'user-1',
  email: 'ada@example.com',
  passwordHash: PASSWORD_HASH,
  googleId: null as string | null,
  firstName: 'Ada',
  lastName: 'Lovelace',
  role: Role.STUDENT as Role,
  isActive: true,
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  plan: 'FREE',
  stripeCustomerId: null,
};

const googleProfile = {
  googleId: 'google-123',
  email: 'ada@example.com',
  emailVerified: true,
  firstName: 'Ada',
  lastName: 'King',
};

describe('AuthService', () => {
  let prisma: PrismaMock;
  let email: { sendVerificationEmail: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = createPrismaMock();
    email = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) };
    const jwt = { sign: jest.fn().mockReturnValue('signed-token') };
    service = new AuthService(
      asPrisma(prisma),
      jwt as unknown as JwtService,
      email as unknown as EmailService,
    );
  });

  describe('validateGoogleUser (account linking)', () => {
    it('keeps the password of an existing verified account', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // by googleId
        .mockResolvedValueOnce(baseUser); // by email
      prisma.user.update.mockImplementation(({ data }) => ({
        ...baseUser,
        ...data,
      }));

      await service.validateGoogleUser(googleProfile);

      const { data } = prisma.user.update.mock.calls[0][0];
      expect(data).toEqual({ googleId: 'google-123', isEmailVerified: true });
    });

    it('discards the password, name and role an unverified registrant chose (takeover fix)', async () => {
      const squatted = {
        ...baseUser,
        isEmailVerified: false,
        firstName: 'Attacker',
        lastName: 'Chosen',
        role: Role.INSTRUCTOR,
      };
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(squatted);
      prisma.user.update.mockImplementation(({ data }) => ({
        ...squatted,
        ...data,
      }));

      const result = await service.validateGoogleUser(googleProfile);

      const { data } = prisma.user.update.mock.calls[0][0];
      expect(data).toMatchObject({
        googleId: 'google-123',
        isEmailVerified: true,
        passwordHash: null,
        firstName: 'Ada',
        lastName: 'King',
        role: Role.STUDENT,
      });
      expect(prisma.emailVerification.deleteMany).toHaveBeenCalledWith({
        where: { userId: squatted.id },
      });
      expect(result.user.hasPassword).toBe(false);
    });

    it('refuses Google profiles whose email Google has not verified', async () => {
      await expect(
        service.validateGoogleUser({ ...googleProfile, emailVerified: false }),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('creates a verified student when no account exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => ({
        ...baseUser,
        ...data,
        passwordHash: null,
      }));

      const result = await service.validateGoogleUser(googleProfile);

      expect(prisma.user.create.mock.calls[0][0].data).toMatchObject({
        isEmailVerified: true,
        role: Role.STUDENT,
        googleId: 'google-123',
      });
      expect(result.accessToken).toBe('signed-token');
    });

    it('blocks deactivated users', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...baseUser,
        googleId: 'google-123',
        isActive: false,
      });
      await expect(service.validateGoogleUser(googleProfile)).rejects.toThrow(
        'Account is deactivated',
      );
    });
  });

  describe('verifyEmail', () => {
    const pending = (overrides = {}) => ({
      ...baseUser,
      isEmailVerified: false,
      emailVerification: {
        id: 'ev-1',
        userId: 'user-1',
        code: '123456',
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60_000),
        createdAt: new Date(),
        ...overrides,
      },
    });

    it('verifies the account and issues a session for the right code', async () => {
      prisma.user.findUnique.mockResolvedValue(pending());
      prisma.emailVerification.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        isEmailVerified: true,
      });

      const result = await service.verifyEmail('ada@example.com', '123456');

      expect(result.accessToken).toBe('signed-token');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isEmailVerified: true },
      });
    });

    it('spends an attempt atomically before comparing', async () => {
      prisma.user.findUnique.mockResolvedValue(pending());
      prisma.emailVerification.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.verifyEmail('ada@example.com', '000000'),
      ).rejects.toThrow('Invalid verification code');

      expect(prisma.emailVerification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', attempts: { lt: OTP_MAX_ATTEMPTS } },
        data: { attempts: { increment: 1 } },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects even the right code once the attempt budget is spent', async () => {
      // A concurrent burst used up the budget between our read and our update.
      prisma.user.findUnique.mockResolvedValue(pending());
      prisma.emailVerification.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.verifyEmail('ada@example.com', '123456'),
      ).rejects.toThrow('Too many incorrect attempts');
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.emailVerification.deleteMany).toHaveBeenCalled();
    });

    it('rejects expired codes', async () => {
      prisma.user.findUnique.mockResolvedValue(
        pending({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(
        service.verifyEmail('ada@example.com', '123456'),
      ).rejects.toThrow('expired');
    });

    it('rejects already verified accounts', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      await expect(
        service.verifyEmail('ada@example.com', '123456'),
      ).rejects.toThrow('Email already verified');
    });
  });

  describe('resendVerificationCode', () => {
    const unverified = { ...baseUser, isEmailVerified: false };

    it('refuses a new code within the cooldown', async () => {
      prisma.user.findUnique.mockResolvedValue(unverified);
      // Code sent 10 seconds ago.
      prisma.emailVerification.findUnique.mockResolvedValue({
        expiresAt: new Date(Date.now() - 10_000 + OTP_EXPIRY_MINUTES * 60_000),
      });

      const error = await service
        .resendVerificationCode('ada@example.com')
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
      expect(email.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('sends a fresh 6-digit code after the cooldown and resets attempts', async () => {
      prisma.user.findUnique.mockResolvedValue(unverified);
      prisma.emailVerification.findUnique.mockResolvedValue({
        expiresAt: new Date(
          Date.now() -
            (OTP_RESEND_COOLDOWN_SECONDS + 1) * 1000 +
            OTP_EXPIRY_MINUTES * 60_000,
        ),
      });

      await service.resendVerificationCode('ada@example.com');

      const { update } = prisma.emailVerification.upsert.mock.calls[0][0];
      expect(update.attempts).toBe(0);
      expect(update.code).toMatch(/^\d{6}$/);
      expect(email.sendVerificationEmail).toHaveBeenCalledWith(
        'ada@example.com',
        update.code,
      );
    });
  });

  describe('register', () => {
    it('refuses addresses that already belong to a verified account', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      await expect(
        service.register({
          email: baseUser.email,
          password: 'password123',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('refuses to overwrite a Google account', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        isEmailVerified: false,
        googleId: 'google-123',
      });
      await expect(
        service.register({
          email: baseUser.email,
          password: 'password123',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('signs in with the right password and reports hasPassword', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      const result = await service.login({
        email: baseUser.email,
        password: PASSWORD,
      });
      expect(result.user).toMatchObject({ id: 'user-1', hasPassword: true });
    });

    it('answers a generic 401 for a wrong password or unknown email', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(baseUser);
      await expect(
        service.login({ email: baseUser.email, password: 'nope' }),
      ).rejects.toThrow('Invalid credentials');

      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.login({ email: 'ghost@example.com', password: PASSWORD }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('asks unverified users to verify first', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        isEmailVerified: false,
      });
      await expect(
        service.login({ email: baseUser.email, password: PASSWORD }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('changePassword', () => {
    it('refuses Google-only accounts', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        passwordHash: null,
      });
      await expect(
        service.changePassword('user-1', {
          currentPassword: 'x',
          newPassword: 'new-password-1',
        }),
      ).rejects.toThrow('signs in with Google');
    });

    it('answers 400 (not 401) for a wrong current password', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrong',
          newPassword: 'new-password-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('stores a new hash for the right current password', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      await service.changePassword('user-1', {
        currentPassword: PASSWORD,
        newPassword: 'new-password-1',
      });

      const { data } = prisma.user.update.mock.calls[0][0];
      await expect(
        bcrypt.compare('new-password-1', data.passwordHash),
      ).resolves.toBe(true);
    });
  });

  describe('deleteAccount', () => {
    it('requires the password for password accounts', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      await expect(
        service.deleteAccount('user-1', { confirmation: 'DELETE' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('deletes the user once confirmed', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      await service.deleteAccount('user-1', {
        confirmation: 'DELETE',
        password: PASSWORD,
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });
});
