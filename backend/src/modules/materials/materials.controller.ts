import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UploadMaterialDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  /**
   * Create new study material
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async create(
    @Body() dto: CreateMaterialDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.materialsService.create(
      dto,
      user.userId,
      user.organizationId || '',
    );
  }

  /**
   * Upload a PDF file, extract text, chunk, embed, and store
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadMaterialDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.materialsService.uploadAndProcess(
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
      dto.courseId,
      user.userId,
      user.organizationId || '',
    );
  }

  /**
   * Get materials for a course
   */
  @Get('course/:courseId')
  async findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<any[]> {
    return this.materialsService.findByCourse(courseId, user?.organizationId);
  }

  /**
   * Delete material
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.materialsService.remove(id, user.organizationId || '');
  }
}
