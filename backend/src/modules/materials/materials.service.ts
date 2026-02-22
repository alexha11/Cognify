import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateMaterialDto } from './dto';
import { SupabaseStorageService } from './supabase-storage.service';
import { EmbeddingService } from '../embedding';
import { chunkText } from '../embedding';

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
  async create(
    dto: CreateMaterialDto,
    userId: string,
    organizationId: string,
  ): Promise<any> {
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
   * Upload a PDF, extract text, chunk, embed, and store with vectors
   */
  async uploadAndProcess(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    fileSize: number,
    courseId: string,
    userId: string,
    organizationId: string,
  ): Promise<any> {
    // Verify course belongs to organization
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, organizationId },
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

    // 3. Chunk the text
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
          chunkCount: chunks.length,
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
  async findByCourse(
    courseId: string,
    organizationId?: string,
  ): Promise<any[]> {
    return this.prisma.material.findMany({
      where: {
        courseId,
        ...(organizationId && { course: { organizationId } }),
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
    organizationId: string,
  ): Promise<{ message: string }> {
    const material = await this.prisma.material.findFirst({
      where: {
        id,
        course: { organizationId },
      },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Delete file from storage
    await this.supabaseStorage.deleteFile(material.fileUrl);

    await this.prisma.material.delete({
      where: { id },
    });

    return { message: 'Material deleted successfully' };
  }
}
