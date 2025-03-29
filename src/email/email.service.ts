import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { LoggerService } from '../common/services/logger.service';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor(private readonly logger: LoggerService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify your email',
        html: `Please verify your email by clicking this link: 
               ${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
      });
      this.logger.debug('Verification email sent', 'EmailService', { email });
    } catch (error) {
      this.logger.error('Failed to send verification email', error.stack, 'EmailService', { email });
      throw error;
    }
  }

  async sendBookingPendingConfirmation(email: string, bookingDetails: any): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Booking Pending Confirmation',
        html: `Your booking is pending confirmation. We'll notify you when it's confirmed.
               You can check the status of your booking at: ${process.env.FRONTEND_URL}/booking/${bookingDetails.id}`,
      });
      this.logger.debug('Booking pending confirmation email sent', 'EmailService', { email });
    } catch (error) {
      this.logger.error('Failed to send booking pending confirmation', error.stack, 'EmailService', { email });
      throw error;
    }
  }

  async sendBookingConfirmation(email: string, bookingDetails: any): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Booking Confirmation',
        html: `Your booking has been confirmed!
               Details: ${JSON.stringify(bookingDetails, null, 2)}`,
      });
      this.logger.debug('Booking confirmation email sent', 'EmailService', { email });
    } catch (error) {
      this.logger.error('Failed to send booking confirmation', error.stack, 'EmailService', { email });
      throw error;
    }
  }

  async sendBookingRejected(email: string, bookingDetails: any): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Booking Rejected',
        html: `Your booking has been rejected.
               Details: ${JSON.stringify(bookingDetails, null, 2)}`,
      });
      this.logger.debug('Booking rejected email sent', 'EmailService', { email });
    } catch (error) {
      this.logger.error('Failed to send booking rejected', error.stack, 'EmailService', { email });
      throw error;
    }
  }

  async sendBookingCancelled(email: string, bookingDetails: any): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Booking Cancelled',
        html: `Your booking has been cancelled.
               Details: ${JSON.stringify(bookingDetails, null, 2)}`,
      });
      this.logger.debug('Booking cancelled email sent', 'EmailService', { email });
    } catch (error) {
      this.logger.error('Failed to send booking cancelled', error.stack, 'EmailService', { email });
      throw error;
    }
  }
}