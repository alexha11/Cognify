import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateMaterialDto } from './dto';
import { SupabaseStorageService } from './supabase-storage.service';
import { EmbeddingService } from '../embedding';
import { chunkText } from '../embedding';
import { Role } from '@prisma/client';
import { MIN_PDF_TEXT_LENGTH } from '../../common/constants';

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Create new study material
   */
  async create(dto: CreateMaterialDto, userId: string): Promise<any> {
    const course = await this.prisma.course.findFirst({
      where: { id: dto.courseId },
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
   * Upload a PDF, extract text, chunk, embed, and store with vectors
   */
  async uploadAndProcess(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    fileSize: number,
    courseId: string,
    userId: string,
  ): Promise<any> {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // 1. Upload to Supabase storage
    const fileUrl = await this.supabaseStorage.uploadFile(
      buffer,
      fileName,
      contentType,
      courseId,
    );
    this.logger.log(`File uploaded: ${fileName}`);

    // 2. Extract text from PDF
    const { PDFParse } = await import('pdf-parse');
    const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
    const pdf = await pdfParser.getText();
    const text = pdf.text;
    this.logger.log(`Extracted ${text.length} chars from PDF`);

    // 3. Check if we actually extracted meaningful text
    const cleanText = text.replace(/-- \d+ of \d+ --/g, '').trim();
    if (cleanText.length < MIN_PDF_TEXT_LENGTH) {
      throw new BadRequestException(
        'The uploaded PDF appears to be empty or a scanned image. Please upload a PDF with selectable text.',
      );
    }

    // 4. Chunk the text
    const chunks = chunkText(text);
    this.logger.log(`Created ${chunks.length} chunks`);

    // 4. Embed all chunks
    const embeddings = await this.embeddingService.embedTexts(chunks);
    this.logger.log(`Generated ${embeddings.length} embeddings`);

    // 5. Store everything in a transaction
    const material = await this.prisma.$transaction(async (tx) => {
      // Create the material record
      const mat = await tx.material.create({
        data: {
          fileName,
          fileUrl,
          fileType: contentType,
          fileSize,
          courseId,
          uploadedById: userId,
        },
      });

      // Insert chunks with embeddings via raw SQL (Prisma can't handle vector type natively)
      for (let i = 0; i < chunks.length; i++) {
        const embeddingStr = `[${embeddings[i].join(',')}]`;
        await tx.$executeRawUnsafe(
          `INSERT INTO "MaterialChunk" ("id", "content", "chunkIndex", "embedding", "materialId", "createdAt")
           VALUES (gen_random_uuid(), $1, $2, $3::vector, $4, NOW())`,
          chunks[i],
          i,
          embeddingStr,
          mat.id,
        );
      }

      return mat;
    });

    this.logger.log(
      `Material ${material.id} created with ${chunks.length} chunks`,
    );

    return material;
  }

  /**
   * Get materials for a course
   */
  async findByCourse(courseId: string): Promise<any[]> {
    return this.prisma.material.findMany({
      where: {
        courseId,
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
  async remove(
    id: string,
    userId?: string,
    userRole?: Role,
  ): Promise<{ message: string }> {
    const material = await this.prisma.material.findFirst({
      where: { id },
      include: { course: true },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    if (
      userRole !== Role.ADMIN &&
      userId &&
      material.uploadedById !== userId &&
      material.course.createdById !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this material',
      );
    }

    // Delete file from storage
    try {
      await this.supabaseStorage.deleteFile(material.fileUrl);
    } catch (e) {
      this.logger.warn(`Failed to delete file from storage: ${e}`);
    }

    // Delete MaterialChunk vector records if any
    try {
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM "MaterialChunk" WHERE "materialId" = $1`,
        id,
      );
    } catch (err: any) {
      this.logger.warn(`MaterialChunk cleanup warning: ${err.message}`);
    }

    await this.prisma.material.delete({
      where: { id },
    });

    return { message: 'Material deleted successfully' };
  }
}
