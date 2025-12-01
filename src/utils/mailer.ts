import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import { AuditLogRepository, HTTP_METHODS } from 'ampersand-common-module';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private auditLogRepository: AuditLogRepository,
    private readonly configService: ConfigService
  ) {}

  async sendDynamicEmail(
    requestData: { [key: string]: any },
    to: string,
    subject: string,
    htmlContent: string,
    // contextData?: any,
    attachment: null | { [key: string]: string } = null
  ) {
    let response = null;
    try {
      htmlContent = `<body style="margin: 0px;">
        <div style="background-color: #eee; height: 100%;">
        <div class="body" style="width: 80%; margin-left: 10%; background-color: #fff; height: 100%;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
        <tbody>
        <tr>
        <td>
        <div style="white-space: pre-wrap; padding: 15px;">${htmlContent.replace(/\n/g, '<br>')}</div>
        </td>
        </tr>
        </tbody>
        </table>
        </div>
        </div>
        </body>`;

      let data = {
        to,
        subject,
        bcc: process.env.MAIL_BCC_USER,
        html: htmlContent
        // template: './your-template',
        // context: contextData, // Pass dynamic variables here if using templates
      };

      let filePath = null;
      if (attachment && attachment.content && attachment.filename) {
        const buffer = Buffer.from(attachment.content, 'base64');
        filePath = `./${attachment.filename}`;
        await fs.promises.writeFile(filePath, buffer);
        data['attachments'] = [{ path: filePath }];
      }

      let op = await this.mailerService.sendMail(data);
      console.log(`MAIL_RESPONSE: ${JSON.stringify(op)} \n`);

      if (filePath) {
        await fs.promises.unlink(filePath);
      }
      response = op;
    } catch (error) {
      console.error('MAIL_ERROR', error);
      response = error;
    }

    await this.auditLogRepository.create({
      table_name: 'mail_send_service',
      request_body: { requestData },
      response_body: `${JSON.stringify(requestData ?? {})}`,
      operation_name: 'sendDynamicEmail',
      created_by: 1,
      url: `/notification/send`,
      ip_address: 'NA',
      method: HTTP_METHODS.POST,
      source_service: this.configService.get<string>('SERVICE'),
      record_id: to,
      meta: {
        to,
        subject,
        bcc: process.env.MAIL_BCC_USER,
        html: htmlContent,
        response: response
      }
    });
  }

  async sendDynamicNotificationEmail(
    to: string,
    subject: string,
    htmlContent: string,
    // contextData?: any,
    attachment: null | { [key: string]: string } = null
  ) {
    try {
      // Define local image paths
      const logoPath = './public/VIBGYOR_group.png';
      const signaturePath = './public/signature.png';

      htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with logo -->
        <div style="padding: 20px; border-bottom: 1px solid #eeeeee; text-align: right;">
          <img src="cid:logo"
               alt="Vibgyor School Logo" 
               style="max-height: 60px; height: auto;"
               width="150">
        </div>
        
        <!-- Main content -->
        <div style="padding: 30px;">
          ${htmlContent.replace(/\n/g, '<br>')}
        </div>
        
        <!-- Signature section -->
        <div style="padding: 20px 30px; border-top: 1px solid #eeeeee; background-color: #f9f9f9;">
          <div style="padding: 20px; border-bottom: 1px solid #eeeeee; text-align: left;">
            <img src="cid:signature"
                 alt="Email Signature" 
                 style="max-width: 100%; height: auto; max-height: 120px;">
          </div>
        </div>
      </div>
    </body>
    </html>`;

      let data = {
        to,
        subject,
        bcc: process.env.MAIL_BCC_USER,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo'
          },
          {
            filename: 'signature.png',
            path: signaturePath,
            cid: 'signature'
          }
        ]
        // template: './your-template',
        // context: contextData, // Pass dynamic variables here if using templates
      };

      let filePath = null;
      if (attachment && attachment.content && attachment.filename) {
        const buffer = Buffer.from(attachment.content, 'base64');
        filePath = `./${attachment.filename}`;
        await fs.promises.writeFile(filePath, buffer);
        data.attachments.push({
          filename: attachment.filename,
          path: filePath,
          cid: `attachment_${Date.now()}` // Unique CID for additional attachment
        });
      }

      let op = await this.mailerService.sendMail(data);
      console.log(`MAIL_RESPONSE: ${JSON.stringify(op)} \n`);

      if (filePath) {
        await fs.promises.unlink(filePath);
      }

      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('U_M_MS_SDM_001', error);
      return { success: false, message: 'Failed to send email', error };
    }
  }
}
