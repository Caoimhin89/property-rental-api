import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailService } from './email.service';
import { LoggerService } from '../common/services/logger.service';

@Controller()
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly logger: LoggerService,
  ) {}

  @EventPattern('user.registered')
  async handleUserRegistration(@Payload() data: { email: string; verificationToken: string }) {
    this.logger.debug('Received user registration event', 'EmailController', data);
    await this.emailService.sendVerificationEmail(data.email, data.verificationToken);
  }

  @EventPattern('booking.created')
  async handleBookingCreated(@Payload() data: { email: string; bookingDetails: any }) {
    this.logger.debug('Received booking creation event', 'EmailController', data);
    await this.emailService.sendBookingConfirmation(data.email, data.bookingDetails);
  }
} 