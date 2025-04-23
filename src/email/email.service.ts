import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import juice from 'juice';
import { LoggerService } from '../common/services/logger.service';
import { User as UserEntity } from '../user/entities/user.entity';
import { Property as PropertyEntity } from 'property/entities/property.entity';
import { Organization as OrganizationEntity } from 'organization/entities/organization.entity';
import { formatCurrency, formatDate } from 'common/utils';
import { join } from 'path';
import { readFileSync } from 'fs';
@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();
  private baseCSS: string;
  private locale: string = process.env.LOCALE || 'en-US';
  
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

  private getSvgDataUrl(): string {
    try {
      const svgPath = join(process.cwd(), 'dist', 'email', 'emailTemplates', 'logo.svg');
      const svgContent = readFileSync(svgPath, 'utf8');
      const base64 = Buffer.from(svgContent).toString('base64');
      return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
      console.error('Error loading SVG:', error);
      return ''; // Or return a fallback image URL
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

  async sendBookingPendingConfirmation(user: UserEntity, bookingDetails: any, property: PropertyEntity): Promise<void> {
    const html = await this.renderTemplate('bookingPending', {
      logoUrl: this.getSvgDataUrl(),
      recipientEmail: user.email,
      guestName: user.name,
      propertyName: bookingDetails.property.name,
      propertyAddress: bookingDetails.property.address,
      propertyImage: property.images?.[0]?.url,
      checkInDate: formatDate(bookingDetails.startDate, this.locale),
      checkOutDate: formatDate(bookingDetails.endDate, this.locale),
      numberOfGuests: bookingDetails.numberOfGuests,
      confirmationCode: bookingDetails.confirmationCode,
      totalAmount: formatCurrency(bookingDetails.totalPrice, this.locale),
      bookingUrl: `${process.env.SITE_URL}/booking/${bookingDetails.id}`,
    });
    await this.sendEmail(user.email, 'Booking Received - Pending Confirmation', html);
  }

  async sendBookingConfirmation(user: {email: string, name: string}, bookingDetails: any): Promise<void> {
    const html = await this.renderTemplate('bookingConfirmed', {
      recipientEmail: user.email,
      guestName: user.name,
      propertyName: bookingDetails.property.name,
      propertyAddress: bookingDetails.property.address,
      propertyImage: bookingDetails.property.images?.[0]?.url,
      checkInDate: formatDate(bookingDetails.startDate, this.locale),
      checkOutDate: formatDate(bookingDetails.endDate, this.locale),
      numberOfGuests: bookingDetails.numberOfGuests,
      confirmationCode: bookingDetails.confirmationCode,
      totalAmount: formatCurrency(bookingDetails.totalPrice, this.locale),
      bookingUrl: `${process.env.SITE_URL}/booking/${bookingDetails.id}`,
    });
    await this.sendEmail(user.email, 'Booking Confirmed!', html);
  }

  async sendBookingRejected(user: {email: string, name: string}, bookingDetails: any, reason?: string): Promise<void> {
    const html = await this.renderTemplate('bookingRejected', {
      recipientEmail: user.email,
      guestName: user.name,
      propertyName: bookingDetails.property.name,
      propertyAddress: bookingDetails.property.address,
      propertyImage: bookingDetails.property.images?.[0]?.url,
      checkInDate: bookingDetails.startDate,
      checkOutDate: bookingDetails.endDate,
      numberOfGuests: bookingDetails.numberOfGuests,
      confirmationCode: bookingDetails.confirmationCode,
      rejectionReason: reason || 'No reason provided',
      alternativeProperties: bookingDetails.alternativeProperties || [],
      searchUrl: `${process.env.SITE_URL}`,
    });
    await this.sendEmail(user.email, 'Booking Request Rejected', html);
  }

  async sendBookingCancelled(user: {email: string, name: string}, bookingDetails: any): Promise<void> {
    const html = await this.renderTemplate('bookingCancelled', {
      recipientEmail: user.email,
      guestName: user.name,
      propertyName: bookingDetails.property.name,
      propertyAddress: bookingDetails.property.address,
      propertyImage: bookingDetails.property.images?.[0]?.url,
      checkInDate: bookingDetails.startDate,
      checkOutDate: bookingDetails.endDate,
      numberOfGuests: bookingDetails.numberOfGuests,
      confirmationCode: bookingDetails.confirmationCode,
      refundAmount: bookingDetails.refundAmount,
      searchUrl: `${process.env.SITE_URL}`,
    });
    await this.sendEmail(user.email, 'Booking Cancelled', html);
  }

  async sendOrganizationInvitation(email: string, data: {
    organization: OrganizationEntity;
    owner: UserEntity;
    inviter: UserEntity;
    verificationUrl: string;
  }): Promise<void> {
    const html = await this.renderTemplate('organizationInvitation', {
      organizationName: data.organization.name,
      organizationImageUrl: data.organization.imageUrl,
      organizationType: data.organization.organizationType,
      organizationDescription: data.organization.description,
      memberCount: data.organization.members.length,
      propertyCount: data.organization.properties.length,
      foundedDate: data.organization.foundedDate,
      ownerName: data.owner.name,
      ownerEmail: data.owner.email,
      ownerTitle: 'Owner',
      ownerAvatarUrl: data.owner.avatar,
      inviterName: data.inviter.name,
      acceptInviteUrl: data.verificationUrl,
    });
    await this.sendEmail(email, 'Organization Invitation', html);
  }
}