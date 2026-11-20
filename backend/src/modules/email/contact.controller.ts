import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EmailService } from './email.service';
import { ContactDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly emailService: EmailService) {}

  /** POST /contact — answers 503 when the message could not be delivered. */
  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async handleContactSubmission(
    @Body() dto: ContactDto,
  ): Promise<{ message: string }> {
    await this.emailService.sendContactEmail(dto);
    return { message: 'Support message sent successfully' };
  }
}
