import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { rbacPermissions } from 'src/utils/rbacPermissions';

interface Props {
  children: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes a path for consistent matching.
 * - Ensures leading slash
 * - Strips trailing slash
 */
const normalizePath = (path: string): string => {
  if (!path) return '';
  let p = path.startsWith('/') ? path : `/${path}`;
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  return p;
};

/**
 * Prefixes stripped before comparing permission strings.
 * Add any prefixes your auth service attaches to permission keys.
 */
const PREFIXES_TO_SKIP = ['dashboard_', 'internal_', 'marketing_'];

/**
 * Strips known prefixes from a permission string so that
 * e.g. "marketing_enquiry-post-create" matches "enquiry-post-create".
 * Also normalizes backend underscore keys to frontend route-map hyphen keys.
 */
const normalizePermission = (perm: string): string => {
  let normalized = perm;
  PREFIXES_TO_SKIP.forEach((prefix) => {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.replace(prefix, '');
    }
  });
  return normalized.replace(/_/g, '-');
};

/**
 * Converts Next.js dynamic segment syntax ([param]) to a regex so that
 * a route like /enquiry/[enquiryId] matches the actual path /enquiry/abc123.
 */
const pathToRegex = (routePath: string): RegExp => {
  const escaped = routePath.replace(/\[.*?\]/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
};

/**
 * Builds a flat map of { normalizedPath → required permissions[] }
 * from the rbacPermissions config.
 *
 * Dynamic segments ([param]) are preserved as-is for regex matching later.
 */
const buildPermissionMap = (): Array<{
  pattern: RegExp;
  rawPath: string;
  permissions: string[];
}> => {
  return rbacPermissions.map((item: any) => ({
    pattern: pathToRegex(normalizePath(item.path)),
    rawPath: normalizePath(item.path),
    permissions: item.permissions,
  }));
};

const permissionEntries = buildPermissionMap();

/**
 * Finds required permissions for the given pathname.
 * Supports both exact paths and Next.js dynamic routes ([param]).
 */
const getRequiredPermissions = (pathname: string): string[] | null => {
  const normalized = normalizePath(pathname);

  // 1. Exact match first (fastest)
  const exact = permissionEntries.find((e) => e.rawPath === normalized);
  if (exact) return exact.permissions;

  // 2. Dynamic segment match
  const dynamic = permissionEntries.find((e) => e.pattern.test(normalized));
  if (dynamic) return dynamic.permissions;

  return null; // route not in map → treat as public
};

/**
 * Reads user permissions from localStorage.
 * Adjust the key and shape to match your auth implementation.
 */
const getUserPermissions = (): string[] => {
  try {
    const stored = localStorage.getItem('userInfo');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed?.permissions ?? [];
  } catch {
    // console.error('[PermissionGuard] Failed to parse userInfo from localStorage');
    return [];
  }
};

const getStoredUserInfo = (): any | null => {
  try {
    const stored = localStorage.getItem('userInfo');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const hasAllowedLob = (userInfo: any): boolean => {
  const lobs = userInfo?.lobs ?? userInfo?.userInfo?.lobs;
  const lobCodes = userInfo?.lobCodes ?? userInfo?.userInfo?.lobCodes;

  return (
    (Array.isArray(lobs) && lobs.length > 0) ||
    (Array.isArray(lobCodes) && lobCodes.length > 0)
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PermissionGuard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps page content and redirects to /403 if the current user
 * lacks the required RBAC permissions for the active route.
 *
 * Routes not present in rbacPermissions are treated as public (always allowed).
 *
 * Usage (in _app.tsx):
 *
 *   <PermissionGuard>
 *     {getLayout(<Component {...pageProps} />)}
 *   </PermissionGuard>
 */
const PermissionGuard = ({ children }: Props) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const checkPermission = () => {
      const pathname = normalizePath(router.pathname);
      const userInfo = getStoredUserInfo();

      if (pathname !== '/403' && userInfo && !hasAllowedLob(userInfo)) {
        setIsAuthorized(false);
        router.replace('/403');
        return;
      }

      const requiredPerms = getRequiredPermissions(pathname);

      // Route not in permission map → public, allow through
      if (!requiredPerms || requiredPerms.length === 0) {
        setIsAuthorized(true);
        return;
      }

      const userPerms = getUserPermissions();
      const normalizedUserPerms = userPerms.map(normalizePermission);
      const normalizedRequiredPerms = requiredPerms.map(normalizePermission);

      // User needs at least ONE of the required permissions (OR logic)
      const hasPermission = normalizedRequiredPerms.some((perm) =>
        normalizedUserPerms.includes(perm),
      );

      if (hasPermission) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        router.replace('/403');
      }
    };

    checkPermission();
  }, [router.isReady, router.pathname]);

  // While checking, render nothing to avoid flash of protected content
  if (isAuthorized === null) return null;

  // Redirect already triggered; render nothing while navigating
  if (isAuthorized === false) return null;

  return <>{children}</>;
};

export default PermissionGuard;