import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { QuestionsService } from './questions.service';
import {
  BulkCreateQuestionDto,
  CheckAnswerDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  UploadQuestionImageDto,
} from './dto';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  RolesGuard,
} from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../auth/interfaces';
import { Role } from '@prisma/client';
import { MAX_IMAGE_SIZE_BYTES } from '../../common/constants';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  /** POST /questions */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  create(
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionsService.create(dto, user);
  }

  /** POST /questions/bulk */
  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  createBulk(
    @Body() dto: BulkCreateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionsService.createBulk(dto, user);
  }

  /** POST /questions/upload-image (multipart: image, courseId, answers, hint?, content?) */
  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE_BYTES }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadQuestionImageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionsService.createWithImage(file, dto, user);
  }

  /** GET /questions/course/:courseId — answer keys only for the course's managers. */
  @Get('course/:courseId')
  @UseGuards(OptionalJwtAuthGuard)
  findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.questionsService.findByCourse(courseId, user);
  }

  /** GET /questions/course/:courseId/public — share-link data, never with answer keys. */
  @Get('course/:courseId/public')
  @UseGuards(OptionalJwtAuthGuard)
  findByCoursePublic(
    @Param('courseId') courseId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.questionsService.findByCoursePublic(courseId, user);
  }

  /** GET /questions/pending — unapproved questions in the caller's courses. */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  getPendingApproval(@CurrentUser() user: AuthenticatedUser) {
    return this.questionsService.getPendingApproval(user);
  }

  /** POST /questions/:id/check — grade one answer for guests, without saving it. */
  @Post(':id/check')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  check(
    @Param('id') id: string,
    @Body() dto: CheckAnswerDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.questionsService.check(id, dto.selectedAnswerIds, user);
  }

  /** GET /questions/:id */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.questionsService.findOne(id, user);
  }

  /** PUT /questions/:id */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionsService.update(id, dto, user);
  }

  /** POST /questions/:id/approve */
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.questionsService.approve(id, user);
  }

  /** DELETE /questions/:id */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.questionsService.remove(id, user);
  }
}
