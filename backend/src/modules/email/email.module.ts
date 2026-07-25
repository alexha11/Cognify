import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { ContactController } from './contact.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [ContactController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
