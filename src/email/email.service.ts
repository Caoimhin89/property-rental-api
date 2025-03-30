import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import juice from 'juice';
import { LoggerService } from '../common/services/logger.service';
import { User as UserEntity } from '../user/entities/user.entity';
@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();
  private baseCSS: string;
  
  constructor(private readonly logger: LoggerService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: (process.env.EMAIL_PORT === '465') ? true : false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async onModuleInit() {
    await this.loadTemplates();
    await this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service is ready', 'EmailService');
    } catch (error) {
      this.logger.error(
        'Failed to initialize email service', 
        error.stack, 
        'EmailService',
        { error: error.message }
      );
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      // Determine the base path based on whether we're running from dist or src
      const basePath = __dirname.includes('dist') ? 
        path.join(__dirname, 'emailTemplates') : 
        path.join(__dirname, '..', 'src', 'email', 'emailTemplates');

      // Load base CSS
      this.baseCSS = await fs.readFile(
        path.join(basePath, 'base.css'),
        'utf-8'
      );

      // Define template files to load
      const templateFiles = [
        'emailVerification',
        'bookingPending',
        'bookingConfirmed',
        'bookingCancelled',
        'bookingRejected',
      ];

      // Load each template
      for (const templateName of templateFiles) {
        const templateContent = await fs.readFile(
          path.join(basePath, `${templateName}.html`),
          'utf-8'
        );
        
        // Replace link to base.css with actual CSS content
        const fullTemplate = templateContent.replace(
          '<link rel="stylesheet" href="base.css">',
          `<style>${this.baseCSS}</style>`
        );
        
        // Compile template
        const template = Handlebars.compile(fullTemplate);
        this.templates.set(templateName, template);
      }

      this.logger.debug('Email templates loaded successfully', 'EmailService');
    } catch (error) {
      this.logger.error('Failed to load email templates', error.stack, 'EmailService', {
        dirname: __dirname,
        error: error.message
      });
      throw error;
    }
  }

  private async renderTemplate(templateName: string, data: any): Promise<string> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    // Add common variables
    const templateData = {
      ...data,
      currentYear: new Date().getFullYear(),
      logoUrl: process.env.LOGO_URL || 'https://example.com/logo.png',
      siteUrl: process.env.SITE_URL || 'https://example.com',
      privacyUrl: `${process.env.SITE_URL}/privacy`,
      unsubscribeUrl: `${process.env.SITE_URL}/unsubscribe`,
    };

    // Render template and inline CSS
    const rendered = template(templateData);
    return juice(rendered);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        to,
        subject,
        html,
      });

      this.logger.debug('Email sent successfully', 'EmailService', { 
        to, 
        subject,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      });
    } catch (error) {
      this.logger.error(
        'Failed to send email', 
        error.stack, 
        'EmailService',
        { to, subject, error: error.message }
      );
      throw error;
    }
  }

  async sendVerificationEmail(email: string, verificationData: {
    userName: string;
    verificationCode: string;
    verificationUrl: string;
  }): Promise<void> {
    const html = await this.renderTemplate('emailVerification', {
      recipientEmail: email,
      ...verificationData
    });
    await this.sendEmail(email, 'Verify Your Email', html);
  }

  async sendBookingPendingConfirmation(user: UserEntity, bookingDetails: any): Promise<void> {
    const html = await this.renderTemplate('bookingPending', {
      recipientEmail: user.email,
      guestName: user.name,
      propertyName: bookingDetails.property.name,
      propertyAddress: bookingDetails.property.address,
      propertyImage: bookingDetails.property.imageUrl,
      checkInDate: bookingDetails.startDate,
      checkOutDate: bookingDetails.endDate,
      numberOfGuests: bookingDetails.numberOfGuests,
      confirmationCode: bookingDetails.confirmationCode,
      totalAmount: bookingDetails.totalPrice,
      bookingUrl: `${process.env.SITE_URL}/bookings/${bookingDetails.id}`,
    });
    await this.sendEmail(user.email, 'Booking Received - Pending Confirmation', html);
  }

  async sendBookingConfirmation(email: string, bookingDetails: any): Promise<void> {
    const html = await this.renderTemplate('bookingConfirmed', {
      recipientEmail: email,
      guestName: bookingDetails.user.name,
      propertyName: bookingDetails.property.name,
      propertyAddress: bookingDetails.property.address,
      propertyImage: bookingDetails.property.imageUrl,
      checkInDate: bookingDetails.startDate,
      checkOutDate: bookingDetails.endDate,
      numberOfGuests: bookingDetails.numberOfGuests,
      confirmationCode: bookingDetails.confirmationCode,
      totalAmount: bookingDetails.totalPrice,
      bookingUrl: `${process.env.SITE_URL}/bookings/${bookingDetails.id}`,
    });
    await this.sendEmail(email, 'Booking Confirmed!', html);
  }

  async sendBookingRejected(email: string, bookingDetails: any): Promise<void> {
    const html = await this.renderTemplate('bookingRejected', {
      recipientEmail: email,
      guestName: bookingDetails.user.name,
      propertyName: bookingDetails.property.name,
      propertyAddress: bookingDetails.property.address,
      propertyImage: bookingDetails.property.imageUrl,
      checkInDate: bookingDetails.startDate,
      checkOutDate: bookingDetails.endDate,
      numberOfGuests: bookingDetails.numberOfGuests,
      confirmationCode: bookingDetails.confirmationCode,
      rejectionReason: bookingDetails.rejectionReason,
      alternativeProperties: bookingDetails.alternativeProperties || [],
      searchUrl: `${process.env.SITE_URL}/search`,
    });
    await this.sendEmail(email, 'Booking Request Not Approved', html);
  }

  async sendBookingCancelled(email: string, bookingDetails: any): Promise<void> {
    const html = await this.renderTemplate('bookingCancelled', {
      recipientEmail: email,
      guestName: bookingDetails.user.name,
      propertyName: bookingDetails.property.name,
      propertyAddress: bookingDetails.property.address,
      propertyImage: bookingDetails.property.imageUrl,
      checkInDate: bookingDetails.startDate,
      checkOutDate: bookingDetails.endDate,
      numberOfGuests: bookingDetails.numberOfGuests,
      confirmationCode: bookingDetails.confirmationCode,
      refundAmount: bookingDetails.refundAmount,
      searchUrl: `${process.env.SITE_URL}/search`,
    });
    await this.sendEmail(email, 'Booking Cancelled', html);
  }
}