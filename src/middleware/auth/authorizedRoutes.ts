import { communicationAuthorizedRoutes } from '../../feature/communication/authorizedRoutes';
import { communicationLogAuthorizedRoutes } from '../../feature/communication-log/authorizedRoutes';

export const routes = [...communicationAuthorizedRoutes, ...communicationLogAuthorizedRoutes];
