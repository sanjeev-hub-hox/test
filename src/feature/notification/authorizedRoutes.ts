import { RequestMethod } from '@nestjs/common';

export const notificationAuthorizedRoutes = [
  {
    path: '/notification-to-user/by-user',
    method: RequestMethod.POST,
    permissions: '*',
    authenticate: true,
    authorize: true
  }
];
