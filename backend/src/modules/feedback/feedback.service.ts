import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackQrCode } from './entities/feedback-qr-code.entity';
import { CustomerFeedback } from './entities/customer-feedback.entity';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(FeedbackQrCode)
    private qrCodeRepository: Repository<FeedbackQrCode>,
    @InjectRepository(CustomerFeedback)
    private feedbackRepository: Repository<CustomerFeedback>,
  ) {}

  async generateQrCode(
    tenantId: string,
    workerId?: string,
    label?: string,
  ): Promise<FeedbackQrCode> {
    const code = uuidv4().substring(0, 8);
    const feedbackUrl = `${process.env.API_URL}/feedback/${code}`;

    // Generate QR code image as data URL
    const qrImageUrl = await QRCode.toDataURL(feedbackUrl);

    const qrCode = this.qrCodeRepository.create({
      tenantId,
      workerId,
      qrCode: code,
      qrImageUrl,
      label,
    });

    return this.qrCodeRepository.save(qrCode);
  }

  async submitFeedback(
    qrCode: string,
    rating: string,
    tags?: string[],
    comment?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CustomerFeedback> {
    const qr = await this.qrCodeRepository.findOne({
      where: { qrCode, isActive: true },
    });

    if (!qr) {
      throw new Error('QR code not found or inactive');
    }

    const feedback = this.feedbackRepository.create({
      tenantId: qr.tenantId,
      qrCodeId: qr.id,
      workerId: qr.workerId,
      rating: rating as any,
      tags,
      comment,
      ipAddress,
      userAgent,
    });

    return this.feedbackRepository.save(feedback);
  }

  async getWorkerFeedback(workerId: string): Promise<CustomerFeedback[]> {
    return this.feedbackRepository.find({
      where: { workerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTenantFeedback(tenantId: string): Promise<CustomerFeedback[]> {
    return this.feedbackRepository.find({
      where: { tenantId },
      relations: ['worker'],
      order: { createdAt: 'DESC' },
    });
  }
}
