import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestStatus, Role } from '@prisma/client';
import { AccessControlService } from './access-control.service';
import {
  asPrisma,
  createPrismaMock,
  PrismaMock,
} from '../../testing/prisma.mock';

describe('AccessControlService', () => {
  let prisma: PrismaMock;
  let service: AccessControlService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AccessControlService(asPrisma(prisma));
  });

  describe('createRequest', () => {
    it('lets a student with no pending request ask once', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        role: Role.STUDENT,
      });
      prisma.roleRequest.findFirst.mockResolvedValue(null);
      prisma.roleRequest.create.mockResolvedValue({ id: 'r1' });

      await service.createRequest('u1', { reason: 'I teach chemistry' });

      expect(prisma.roleRequest.create).toHaveBeenCalledWith({
        data: { userId: 'u1', reason: 'I teach chemistry' },
      });
    });

    it('refuses instructors, admins and duplicate pending requests', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        role: Role.INSTRUCTOR,
      });
      await expect(
        service.createRequest('u1', { reason: 'x' }),
      ).rejects.toThrow('elevated');

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        role: Role.STUDENT,
      });
      prisma.roleRequest.findFirst.mockResolvedValueOnce({ id: 'pending' });
      await expect(
        service.createRequest('u1', { reason: 'x' }),
      ).rejects.toThrow('pending');
    });
  });

  describe('updateRequestStatus', () => {
    it('approves a pending request and promotes only a student', async () => {
      prisma.roleRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.roleRequest.findUniqueOrThrow.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
        status: RequestStatus.APPROVED,
      });

      await service.updateRequestStatus('r1', { status: 'APPROVED' });

      expect(prisma.roleRequest.updateMany).toHaveBeenCalledWith({
        where: { id: 'r1', status: RequestStatus.PENDING },
        data: { status: 'APPROVED' },
      });
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'u1', role: Role.STUDENT },
        data: { role: Role.INSTRUCTOR },
      });
    });

    it('does not touch the user when a request is rejected', async () => {
      prisma.roleRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.roleRequest.findUniqueOrThrow.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
      });

      await service.updateRequestStatus('r1', { status: 'REJECTED' });

      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('answers 400 for processed requests and 404 for missing ones', async () => {
      prisma.roleRequest.updateMany.mockResolvedValue({ count: 0 });

      prisma.roleRequest.findUnique.mockResolvedValueOnce({ id: 'r1' });
      await expect(
        service.updateRequestStatus('r1', { status: 'APPROVED' }),
      ).rejects.toThrow(BadRequestException);

      prisma.roleRequest.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.updateRequestStatus('nope', { status: 'APPROVED' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
