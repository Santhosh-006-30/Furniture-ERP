import nodemailer from 'nodemailer';
import { db } from './db';
import { logger } from './pino';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  userId?: string | null;
  notificationTitle?: string;
  notificationMessage?: string;
  referenceId?: string;
  referenceType?: string;
}

export class EmailService {
  private static getTransporter() {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 587);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (!host || !user || !pass) {
      logger.warn('SMTP email credentials are not fully configured. Email service will run in fallback/mock mode.');
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  static async send({
    to,
    subject,
    html,
    userId,
    notificationTitle,
    notificationMessage,
    referenceId,
    referenceType,
  }: EmailOptions) {
    logger.info({ to, subject }, 'Initiating email transmission...');

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Shiv Furniture Works" <${process.env.EMAIL_USER}>`,
          to,
          subject,
          html,
        });
        logger.info({ to, subject }, 'Email sent successfully.');
      } catch (error) {
        logger.error({ error, to, subject }, 'Nodemailer failed to transmit email.');
      }
    } else {
      logger.info({ to, subject }, '[MOCK EMAIL SENT] (SMTP not configured)');
    }

    if (userId && notificationTitle && notificationMessage) {
      try {
        await db.notification.create({
          data: {
            userId,
            title: notificationTitle,
            message: notificationMessage,
            type: referenceType || 'SYSTEM',
            referenceId,
            referenceType,
          },
        });
        logger.info({ userId, title: notificationTitle }, 'In-app notification created.');
      } catch (error) {
        logger.error({ error, userId }, 'Failed to create in-app notification.');
      }
    }
  }

  static getWelcomeTemplate(name: string) {
    return this.baseTemplate(
      'Welcome to Shiv Furniture Works!',
      `Dear ${name},`,
      `<p>Thank you for creating an account with us. We are thrilled to welcome you to the Shiv Furniture Works family.</p>
       <p>You can now browse our premium catalog of hand-crafted Sheesham, Teak, and customized luxury furniture. Log in to start creating your wishlist, comparing models, and placing orders.</p>`,
      '<a href="/customer/products" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Browse Catalog</a>'
    );
  }

  static getOrderConfirmationTemplate(orderNumber: string, grandTotal: number) {
    return this.baseTemplate(
      'Order Confirmation',
      `Order Received: ${orderNumber}`,
      `<p>Your request for order <strong>${orderNumber}</strong> has been received and added to our review queue.</p>
       <p>Our operational team will verify item availability, logistics constraints, and update the status shortly.</p>
       <p><strong>Total Amount:</strong> ₹${grandTotal.toLocaleString()}</p>`,
      `<a href="/customer/orders" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">View Orders</a>`
    );
  }

  static getOrderConfirmedTemplate(orderNumber: string) {
    return this.baseTemplate(
      'Order Confirmed',
      `Order Confirmed: ${orderNumber}`,
      `<p>Great news! Your sales order <strong>${orderNumber}</strong> has been confirmed by our operations team.</p>
       <p>The required resources are being reserved and the manufacturing schedule is being updated.</p>`,
      `<a href="/customer/orders" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Track Order</a>`
    );
  }

  static getMfgStartedTemplate(orderNumber: string) {
    return this.baseTemplate(
      'Manufacturing Started',
      `Production Started: ${orderNumber}`,
      `<p>Production has officially commenced for order <strong>${orderNumber}</strong>.</p>
       <p>Our skilled craftsmen are fabricating your products using premium graded woods and materials.</p>`
    );
  }

  static getMfgCompletedTemplate(orderNumber: string) {
    return this.baseTemplate(
      'Manufacturing Completed',
      `Production Complete: ${orderNumber}`,
      `<p>Good news! Fabrications have finished for order <strong>${orderNumber}</strong>.</p>
       <p>Your furniture items have passed initial quality controls and are being prepared for dispatch checks.</p>`
    );
  }

  static getReadyForDispatchTemplate(orderNumber: string) {
    return this.baseTemplate(
      'Ready for Dispatch',
      `Ready for Dispatch: ${orderNumber}`,
      `<p>Your order <strong>${orderNumber}</strong> is packaged and ready to be picked up from our dispatch warehouse.</p>
       <p>You will receive courier details and shipment tracking information as soon as it is picked up by the logistics carrier.</p>`
    );
  }

  static getOrderShippedTemplate(orderNumber: string, courierName: string, trackingNumber: string, trackingUrl?: string | null) {
    const trackingLinkHtml = trackingUrl 
      ? `<p><a href="${trackingUrl}" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Track Package</a></p>`
      : '';
    return this.baseTemplate(
      'Order Dispatched',
      `Shipment Dispatched: ${orderNumber}`,
      `<p>Your order <strong>${orderNumber}</strong> has been handed over to <strong>${courierName}</strong>.</p>
       <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
       ${trackingLinkHtml}`
    );
  }

  static getDeliveredTemplate(orderNumber: string) {
    return this.baseTemplate(
      'Order Delivered',
      `Delivered: ${orderNumber}`,
      `<p>Your package for order <strong>${orderNumber}</strong> has been successfully delivered.</p>
       <p>We hope you love your new furniture! Feel free to visit the catalog and write a review about your purchase quality.</p>`,
      `<a href="/customer/orders" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Write Review</a>`
    );
  }

  static getInvoiceGeneratedTemplate(invoiceNumber: string, orderNumber: string, amount: number) {
    return this.baseTemplate(
      'Invoice Generated',
      `Invoice Issued: ${invoiceNumber}`,
      `<p>An official invoice <strong>${invoiceNumber}</strong> has been generated for order <strong>${orderNumber}</strong>.</p>
       <p><strong>Total Amount Due:</strong> ₹${amount.toLocaleString()}</p>`,
      `<a href="/customer/invoices" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Download Invoice</a>`
    );
  }

  static getPaymentSuccessfulTemplate(orderNumber: string, amount: number, paymentId: string) {
    return this.baseTemplate(
      'Payment Successful',
      'Transaction Completed',
      `<p>Thank you! Your payment of <strong>₹${amount.toLocaleString()}</strong> for order <strong>${orderNumber}</strong> has been processed successfully.</p>
       <p><strong>Payment ID:</strong> ${paymentId}</p>`,
      `<a href="/customer/orders" style="display: inline-block; padding: 12px 24px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">View Orders</a>`
    );
  }

  private static baseTemplate(title: string, header: string, bodyHtml: string, ctaHtml = '') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #060913; color: #cbd5e1; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
          .container { max-width: 600px; margin: 40px auto; background-color: #090e1a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 30px rgba(0,0,0,0.4); }
          .header { background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
          .content { padding: 40px 30px; line-height: 1.6; font-size: 15px; }
          .content h2 { color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 20px; font-weight: 700; }
          .content p { margin: 0 0 20px; color: #94a3b8; }
          .cta-container { text-align: center; margin: 30px 0 10px; }
          .footer { background-color: #030712; padding: 20px 30px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
          .footer p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <h2>${header}</h2>
            ${bodyHtml}
            ${ctaHtml ? `<div class="cta-container">${ctaHtml}</div>` : ''}
          </div>
          <div class="footer">
            <p><strong>Shiv Furniture Works</strong></p>
            <p>Quality Timber, Expert Fabrications, Custom Home Designs.</p>
            <p>&copy; 2026 Shiv Furniture Works. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
