import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FeedbackQrCode } from './entities/feedback-qr-code.entity';
import { CustomerFeedback } from './entities/customer-feedback.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeedbackQrCode, CustomerFeedback])],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
