import { Injectable, OnModuleInit } from '@nestjs/common';
import admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { AuditLogRepository, HTTP_METHODS } from 'ampersand-common-module';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(
    private auditLogRepository: AuditLogRepository,
    private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    // Initialize Firebase Admin SDK
    const firebaseConfig = {
      type: process.env.PUSH_TYPE,
      projectId: process.env.PUSH_PROJECT_ID,
      privateKeyId: process.env.PUSH_PRIVATE_KEY_ID,
      privateKey: process.env.PUSH_PRIVATE_KEY,
      clientEmail: process.env.PUSH_CLIENT_EMAIL,
      clientId: process.env.PUSH_GCS_CLIENT_ID,
      authUri: process.env.AUTH_URI,
      tokenUri: process.env.TOKEN_URI,
      auth_providerX509CertUrl: process.env.AUTH_PROVIDER_X509_CERT_URL,
      clientX509CertUrl: process.env.PUSH_CLIENT_X509_CERT_URL,
      universeDomain: process.env.UNIVERSAL_DOMAIN
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig)
      });
    }
  }

  async sendPushNotification(
    requestData: { [key: string]: any },
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    // Preparing data.
    const message = {
      notification: { title, body },
      data: data || {},
      token
    };
    let response = null;

    try {
      // Sending Message
      const op = await admin.messaging().send(message);
      console.log(`PUSH_RESPONSE: ${op} \n`);
      response = op;
    } catch (error) {
      console.log('PUSH_ERROR', error);
      response = error;
      // throw new Error(`Failed to send push notification: ${error.message}`);
    }

    await this.auditLogRepository.create({
      table_name: 'push_send_service',
      request_body: { requestData },
      response_body: `${JSON.stringify(requestData ?? {})}`,
      operation_name: 'sendPushNotification',
      created_by: 1,
      url: `/notification/send`,
      ip_address: 'NA',
      method: HTTP_METHODS.POST,
      source_service: this.configService.get<string>('SERVICE'),
      record_id: token,
      meta: {
        notification: { title, body },
        data: data || {},
        token,
        response: response
      }
    });
  }
}
