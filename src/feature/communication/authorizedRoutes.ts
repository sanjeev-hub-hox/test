import { RequestMethod } from '@nestjs/common';

export const communicationAuthorizedRoutes = [
  {
    path: '/communication',
    method: RequestMethod.POST,
    permissions: '*',
    authenticate: true,
    authorize: true
  }
];
