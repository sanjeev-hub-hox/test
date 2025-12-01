import { RequestMethod } from '@nestjs/common';

export const auditLogAuthorizedRoutes = [
  {
    path: '/auditLog/create',
    method: RequestMethod.POST,
    permissions: '*',
    authenticate: true,
    authorize: false
  },
  {
    path: '/auditLog/list',
    method: RequestMethod.GET,
    permissions: '*',
    authenticate: true,
    authorize: false
  }
];
