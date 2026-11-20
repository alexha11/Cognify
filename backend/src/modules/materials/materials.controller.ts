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
import { Throttle } from '@nestjs/throttler';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UploadMaterialDto } from './dto';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  RolesGuard,
} from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';
import { MAX_PDF_SIZE_BYTES } from '../../common/constants';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  /** POST /materials — record a material hosted elsewhere. */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  create(
    @Body() dto: CreateMaterialDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialsService.create(dto, user);
  }

  /** POST /materials/upload — PDF upload; extracts, chunks and embeds the text. */
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  // Each upload calls the paid embeddings API.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PDF_SIZE_BYTES }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadMaterialDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialsService.uploadAndProcess(file, dto.courseId, user);
  }

  /** GET /materials/course/:courseId — private courses answer 404 to outsiders. */
  @Get('course/:courseId')
  @UseGuards(OptionalJwtAuthGuard)
  findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.materialsService.findByCourse(courseId, user);
  }

  /** DELETE /materials/:id */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.materialsService.remove(id, user);
  }
}
