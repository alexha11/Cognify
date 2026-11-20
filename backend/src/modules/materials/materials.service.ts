import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateMaterialDto } from './dto';
import { SupabaseStorageService } from '../storage';
import { EmbeddingService, chunkText } from '../embedding';
import { MIN_PDF_TEXT_LENGTH } from '../../common/constants';
import { CourseAccessService, type Viewer } from '../../common/access';
import type { AuthenticatedUser } from '../auth/interfaces';

/** Writing every chunk of a large PDF to a remote database can take a while. */
const UPLOAD_TRANSACTION_TIMEOUT_MS = 60_000;

export interface UploadedPdf {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CourseAccessService,
    private readonly storage: SupabaseStorageService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /** Record a material that already lives at a web URL. */
  async create(dto: CreateMaterialDto, user: AuthenticatedUser) {
    await this.access.assertCanManage(dto.courseId, user);

    return this.prisma.material.create({
      data: {
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        fileSize: dto.fileSize,
        courseId: dto.courseId,
        uploadedById: user.userId,
      },
    });
  }

  /**
   * PDF → text → chunks → embeddings → storage → rows.
   *
   * Text extraction and embedding run before the file is stored, so a scanned
   * PDF or an embedding failure leaves nothing behind. If the database write
   * fails after the upload, the stored file is removed again.
   */
  async uploadAndProcess(
    file: UploadedPdf,
    courseId: string,
    user: AuthenticatedUser,
  ) {
    await this.access.assertCanManage(courseId, user);

    const text = await this.extractText(file.buffer);
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      throw new BadRequestException(
        'The uploaded PDF does not contain enough text to use.',
      );
    }

    const embeddings = await this.embeddingService.embedTexts(chunks);
    if (embeddings.length !== chunks.length) {
      throw new Error(
        `Embedding count mismatch: ${embeddings.length} for ${chunks.length} chunks`,
      );
    }

    const fileUrl = await this.storage.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      courseId,
    );

    try {
      const material = await this.prisma.$transaction(
        async (tx) => {
          const created = await tx.material.create({
            data: {
              fileName: file.originalname,
              fileUrl,
              fileType: file.mimetype,
              fileSize: file.size,
              chunkCount: chunks.length,
              courseId,
              uploadedById: user.userId,
            },
          });

          // One statement for all chunks. Prisma cannot write the vector
          // column, so it is cast from its text form ('[0.1,0.2,...]').
          const indexes = chunks.map((_, i) => i);
          const vectors = embeddings.map((e) => `[${e.join(',')}]`);
          await tx.$executeRaw`
            INSERT INTO "MaterialChunk" ("id", "content", "chunkIndex", "embedding", "materialId", "createdAt")
            SELECT gen_random_uuid(), c.content, c.idx, c.embedding::vector, ${created.id}, NOW()
            FROM unnest(${chunks}::text[], ${indexes}::int[], ${vectors}::text[])
              AS c(content, idx, embedding)`;

          return created;
        },
        { timeout: UPLOAD_TRANSACTION_TIMEOUT_MS },
      );

      this.logger.log(
        `Material ${material.id} created with ${chunks.length} chunks`,
      );
      return material;
    } catch (error) {
      await this.storage.deleteFile(fileUrl);
      throw error;
    }
  }

  async findByCourse(courseId: string, user?: Viewer) {
    await this.access.assertCanView(courseId, user);

    return this.prisma.material.findMany({
      where: { courseId },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** The uploader, the course owner and admins may delete a material. */
  async remove(id: string, user: Viewer): Promise<{ message: string }> {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { course: { select: { createdById: true } } },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const isUploader = !!user && material.uploadedById === user.userId;
    if (!isUploader && !this.access.canManage(material.course, user)) {
      throw new ForbiddenException(
        'You do not have permission to delete this material',
      );
    }

    // Chunks go with the row (ON DELETE CASCADE); the stored file does not.
    await this.prisma.material.delete({ where: { id } });
    await this.storage.deleteFile(material.fileUrl);

    return { message: 'Material deleted successfully' };
  }

  private async extractText(buffer: Buffer): Promise<string> {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    let text: string;
    try {
      ({ text } = await parser.getText());
    } catch (error) {
      this.logger.warn(`PDF text extraction failed: ${String(error)}`);
      throw new BadRequestException(
        'This file could not be read as a PDF. Please upload a valid PDF.',
      );
    } finally {
      await parser.destroy().catch(() => undefined);
    }

    // pdf-parse marks page breaks as "-- 1 of 3 --"; they are noise for retrieval.
    const clean = text.replace(/-- \d+ of \d+ --/g, '').trim();
    if (clean.length < MIN_PDF_TEXT_LENGTH) {
      throw new BadRequestException(
        'The uploaded PDF appears to be empty or a scanned image. Please upload a PDF with selectable text.',
      );
    }
    return clean;
  }
}
