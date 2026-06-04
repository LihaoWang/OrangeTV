import { getAuthInfoFromCookie } from '@/lib/auth';

import type { AppRequest } from './web';

export function getRouteUsername(request: AppRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo) return null;

  return (
    authInfo.username ||
    process.env.USERNAME ||
    process.env.ADMIN_USERNAME ||
    'admin'
  );
}
