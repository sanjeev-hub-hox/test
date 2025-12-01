import { RequestMethod } from '@nestjs/common';

export const communicationLogAuthorizedRoutes = [
  {
    path: '/communication-log',
    method: RequestMethod.POST,
    permissions: '*',
    authenticate: true,
    authorize: true
  }
];
