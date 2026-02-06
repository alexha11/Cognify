import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateMaterialDto } from './dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new study material
   */
  async create(dto: CreateMaterialDto, userId: string, organizationId: string): Promise<any> {
    // Verify course belongs to organization
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId, organizationId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.material.create({
      data: {
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        fileSize: dto.fileSize,
        courseId: dto.courseId,
        uploadedById: userId,
      },
    });
  }

  /**
   * Get materials for a course
   */
  async findByCourse(courseId: string, organizationId?: string): Promise<any[]> {
    return this.prisma.material.findMany({
      where: {
        courseId,
        ...(organizationId && { organizationId }),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete material
   */
  async remove(id: string, organizationId: string): Promise<{ message: string }> {
    const material = await this.prisma.material.findFirst({
      where: {
        id,
        course: { organizationId },
      },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    await this.prisma.material.delete({
      where: { id },
    });

    return { message: 'Material deleted successfully' };
  }
}
