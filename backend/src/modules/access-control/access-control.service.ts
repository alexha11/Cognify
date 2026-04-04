import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Role } from '@prisma/client';
import {
  CreateRoleRequestDto,
  UpdateRoleRequestStatusDto,
} from './dto/role-request.dto';

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit a request for instructor role
   */
  async createRequest(userId: string, dto: CreateRoleRequestDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === Role.INSTRUCTOR || user.role === Role.ADMIN) {
      throw new BadRequestException('User already has elevated permissions');
    }

    // Check for existing pending request
    const existing = await (this.prisma as any).roleRequest.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (existing) {
      throw new BadRequestException('You already have a pending request');
    }

    return (this.prisma as any).roleRequest.create({
      data: {
        userId,
        reason: dto.reason,
      },
    });
  }

  /**
   * Get all requests (Admin only)
   */
  async findAllRequests() {
    return (this.prisma as any).roleRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update request status (Admin only)
   */
  async updateRequestStatus(
    requestId: string,
    dto: UpdateRoleRequestStatusDto,
  ) {
    const request = await (this.prisma as any).roleRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Request not found');

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request already processed');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedRequest = await (tx as any).roleRequest.update({
        where: { id: requestId },
        data: { status: dto.status },
      });

      if (dto.status === 'APPROVED') {
        await tx.user.update({
          where: { id: request.userId },
          data: { role: Role.INSTRUCTOR },
        });
      }

      return updatedRequest;
    });
  }

  /**
   * Get request status for current user
   */
  async getMyRequest(userId: string) {
    return (this.prisma as any).roleRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
