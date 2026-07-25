import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailService } from './email.service';
import { ContactDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleContactSubmission(
    @Body() dto: ContactDto,
  ): Promise<{ message: string }> {
    await this.emailService.sendContactEmail(dto);
    return { message: 'Support message sent successfully' };
  }
}
