import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleCloudStorageService,
  TGoogleCloudStorageConfiguration
} from 'ampersand-common-module';

@Injectable()
export class GoogleCloudStorageConfigService {
  constructor() {}

  async configureGoogleCloudStorage(maxFileSize?: number, allowedMimeTypes?: any[]) {
    const storageService = new GoogleCloudStorageService();

    const bucketName = process.env.BUCKET_NAME;
    const folderName = process.env.FOLDER_NAME;

    const GoogleCloudStorageConfiguration: any = {
      projectId: process.env.PROJECT_ID,
      credentials: {
        type: process.env.TYPE,
        project_id: process.env.PROJECT_ID,
        private_key_id: process.env.PRIVATE_KEY_ID,
        private_key: process.env.PRIVATE_KEY.split(String.raw`\n`).join('\n'),
        client_email: process.env.CLIENT_EMAIL,
        client_id: process.env.GCS_CLIENT_ID,
        auth_uri: process.env.AUTH_URI,
        token_uri: process.env.TOKEN_URI,
        auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
        universe_domain: process.env.UNIVERSAL_DOMAIN
      },
      bucketName: bucketName,
      folderName: folderName
      // maxFileSize: maxFileSize,
      // allowedMimeTypes:allowedMimeTypes
    };

    storageService.setConfigurations(GoogleCloudStorageConfiguration);

    return storageService;
  }
}
