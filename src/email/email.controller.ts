import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailService } from './email.service';
import { LoggerService } from '../common/services/logger.service';
import { User as UserEntity } from '../user/entities/user.entity';
import { Property as PropertyEntity } from 'property/entities/property.entity';
@Controller()
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly logger: LoggerService,
  ) {}

  @EventPattern('organization.invitation')
  async handleOrganizationInvitation(@Payload() data: { email: string; userName: string; verificationCode: string; verificationUrl: string }) {
    this.logger.debug('Received organization invitation event', 'EmailController', data);
    await this.emailService.sendOrganizationInvitation(data.email, {
      userName: data.userName,
      verificationCode: data.verificationCode,
      verificationUrl: data.verificationUrl
    });
  }

  @EventPattern('user.registered')
  async handleUserRegistration(@Payload() data: { email: string; userName: string; verificationCode: string; verificationUrl: string }) {
    this.logger.debug('Received user registration event', 'EmailController', data);
    await this.emailService.sendVerificationEmail(data.email, {
      userName: data.userName,
      verificationCode: data.verificationCode,
      verificationUrl: data.verificationUrl
    });
  }

  @EventPattern('booking.created')
  async handleBookingCreated(@Payload() data: { user: UserEntity; bookingDetails: any, property: PropertyEntity }) {
    this.logger.debug('Received booking creation event', 'EmailController', data);
    await this.emailService.sendBookingPendingConfirmation(data.user, data.bookingDetails, data.property);
  }

  @EventPattern('booking.confirm')
  async handleBookingConfirmed(@Payload() data: { user: {email: string, name: string}; bookingDetails: any }) {
    this.logger.debug('Received booking confirmation event', 'EmailController', data);
    await this.emailService.sendBookingConfirmation(data.user, data.bookingDetails);
  }

  @EventPattern('booking.reject')
  async handleBookingRejected(@Payload() data: { user: {email: string, name: string}; bookingDetails: any, reason: string }) {
    this.logger.debug('Received booking rejection event', 'EmailController', data);
    await this.emailService.sendBookingRejected(data.user, data.bookingDetails, data.reason);
  }

  @EventPattern('booking.cancel')
  async handleBookingCancelled(@Payload() data: { user: {email: string, name: string}; bookingDetails: any }) {
    this.logger.debug('Received booking cancellation event', 'EmailController', data);
    await this.emailService.sendBookingCancelled(data.user, data.bookingDetails);
  }
} 