import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuditLog,
  AuditLogRepository,
  AuditLogModel,
  HTTP_METHODS,
  AuditLogSchema
} from 'ampersand-common-module';
import { model } from 'mongoose';

@Injectable()
export class MessageService {
  constructor(
    private auditLogRepository: AuditLogRepository,
    private readonly configService: ConfigService
  ) {}

  async whatsappSendSMS(requestData: { [key: string]: any }, phone: number, message: string) {
    const options = this.gatewayOptions();
    let response = null;
    try {
      const res = await axios.get(
        `${options.url}?format=${options.format}&userid=${options.userId}&send_to=${phone}&v=${options.v}&msg=${message}&method=${options.method}&password=${options.password}`
      );

      console.log(`WHATSAPP_RESPONSE: ${JSON.stringify(res.data)} \n`);
      response = res.data;
    } catch (err: any) {
      console.error('WHATSAPP_ERROR: ', err);
      response = err;
    }

    await this.auditLogRepository.create({
      table_name: 'whatsapp_send_service',
      request_body: { requestData },
      response_body: `${JSON.stringify(requestData ?? {})}`,
      operation_name: 'SendTextMessage',
      created_by: 1,
      url: `/notification/send`,
      ip_address: 'NA',
      method: HTTP_METHODS.POST,
      source_service: this.configService.get<string>('SERVICE'),
      record_id: String(phone),
      meta: {
        format: options.format,
        userid: options.userId,
        send_to: phone,
        v: options.v,
        msg: message,
        method: options.method,
        password: options.password,
        response: response
      }
    });
  }

  gatewayOptions() {
    if (!process.env.GUPSHUP_WHATSAPP_URL) throw Error('Env var missing: GUPSHUP_WHATSAPP_URL');
    if (!process.env.GUPSHUP_WHATSAPP_METHOD)
      throw Error('Env var missing: GUPSHUP_WHATSAPP_METHOD');
    if (!process.env.GUPSHUP_WHATSAPP_FORMAT)
      throw Error('Env var missing: GUPSHUP_WHATSAPP_FORMAT');
    if (!process.env.GUPSHUP_WHATSAPP_USERID)
      throw Error('Env var missing: GUPSHUP_WHATSAPP_USERID');
    if (!process.env.GUPSHUP_WHATSAPP_PASSWORD)
      throw Error('Env var missing: GUPSHUP_WHATSAPP_PASSWORD');
    if (!process.env.GUPSHUP_WHATSAPP_V) throw Error('Env var missing: GUPSHUP_WHATSAPP_V');

    return {
      url: process.env.GUPSHUP_WHATSAPP_URL,
      method: process.env.GUPSHUP_WHATSAPP_METHOD,
      format: process.env.GUPSHUP_WHATSAPP_FORMAT,
      userId: process.env.GUPSHUP_WHATSAPP_USERID,
      password: process.env.GUPSHUP_WHATSAPP_PASSWORD,
      v: process.env.GUPSHUP_WHATSAPP_V,
      authScheme: process.env.GUPSHUP_WHATSAPP_AUTH_SCHEME,
      channel: process.env.GUPSHUP_WHATSAPP_CHANNEL
    };
  }

  async optIn(phone: number) {
    const options = this.gatewayOptions();

    try {
      const res = await axios.get(
        `${options.url}?method=OPT_IN&format=${options.format}&userid=${options.userId}&phone_number=${phone}&v=${options.v}&auth_scheme=${options.authScheme}&channel=${options.channel}&password=${options.password}`
      );

      console.log('WHATSAPP_RESPONSE: ', res);

      return res.data.response;
    } catch (err: any) {
      return {
        status: 'error',
        details: err.message,
        id: '500'
      };
    }
  }

 smsGatewayOptions() {
  return {
    url: process.env.SMS_URL,
    key: process.env.SMS_API_KEY
  }
}
  async SendTextMessage(requestData: { [key: string]: any }, phone: number, message: string) {
  const options = this.smsGatewayOptions();
  let response = null;
  try {
  // const res = await axios.get(
    //   `${options.url}?method=${options.method}&format=${options.format}&userid=${options.userId}&password=${options.password}&auth_scheme=${options.authScheme}&v=${options.v}&msg_type=${options.type}&send_to=91${phone}&msg=${message}`
    // );
    const res = await axios.get(
      `${options.url}?APIKey=${options.key}&senderid=VIBSMS&channel=2&DCS=0&flashsms=0&number=${phone}&text=${message}&route=49`,
    );
      console.log('SMS_RESPONSE: ', res.data);
      response = res.data;
    } catch (err: any) {
      console.error('SMS_ERROR: ', err);
      response = err;
    }

    await this.auditLogRepository.create({
      table_name: 'sms_send_service',
      request_body: { requestData },
      response_body: `${JSON.stringify(requestData ?? {})}`,
      operation_name: 'SendTextMessage',
      created_by: 1,
      url: `/notification/send`,
      ip_address: 'NA',
      method: HTTP_METHODS.POST,
      source_service: this.configService.get<string>('SERVICE'),
      record_id: String(phone),
      meta: {
        url: options.url,
        key: options.key,
        // method: options.method,
        // format: options.format,
        // userid: options.userId,
        // password: options.password,
        // auth_scheme: options.authScheme,
        // v: options.v,
        // msg_type: options.type,
        send_to: '91' + phone,
        msg: message,
        response: response
      }
    });
  }
}
