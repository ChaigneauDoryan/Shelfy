const AUTH_PREFIX = '/auth';
const PUBLIC_ROUTES_WITHOUT_TABS = ['/', '/mentions-legales', '/politique-confidentialite'];

export const isAuthRoute = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return pathname.startsWith(AUTH_PREFIX);
};

export const shouldHideTabs = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return isAuthRoute(pathname) || PUBLIC_ROUTES_WITHOUT_TABS.includes(pathname);
};
