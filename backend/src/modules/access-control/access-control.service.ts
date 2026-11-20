import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { RequestStatus, Role } from '@prisma/client';
import {
  CreateRoleRequestDto,
  UpdateRoleRequestStatusDto,
} from './dto/role-request.dto';

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  /** A student asks to become an instructor. One pending request at a time. */
  async createRequest(userId: string, dto: CreateRoleRequestDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.STUDENT) {
      throw new BadRequestException('User already has elevated permissions');
    }

    const existing = await this.prisma.roleRequest.findFirst({
      where: { userId, status: RequestStatus.PENDING },
    });
    if (existing) {
      throw new BadRequestException('You already have a pending request');
    }

    return this.prisma.roleRequest.create({
      data: { userId, reason: dto.reason },
    });
  }

  async findAllRequests() {
    return this.prisma.roleRequest.findMany({
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approve or reject a pending request. The status change is conditional on
   * the request still being pending, so two admins cannot both process it,
   * and approval only promotes students (it never demotes an admin).
   */
  async updateRequestStatus(
    requestId: string,
    dto: UpdateRoleRequestStatusDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.roleRequest.updateMany({
        where: { id: requestId, status: RequestStatus.PENDING },
        data: { status: dto.status },
      });

      if (count === 0) {
        const exists = await tx.roleRequest.findUnique({
          where: { id: requestId },
          select: { id: true },
        });
        throw exists
          ? new BadRequestException('Request already processed')
          : new NotFoundException('Request not found');
      }

      const request = await tx.roleRequest.findUniqueOrThrow({
        where: { id: requestId },
      });

      if (dto.status === RequestStatus.APPROVED) {
        await tx.user.updateMany({
          where: { id: request.userId, role: Role.STUDENT },
          data: { role: Role.INSTRUCTOR },
        });
      }

      return request;
    });
  }

  /** The caller's most recent request, or null. */
  async getMyRequest(userId: string) {
    return this.prisma.roleRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
