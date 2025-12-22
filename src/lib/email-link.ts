const DEFAULT_BASE_URL = 'http://localhost:3000';

let emailBaseUrl = new URL(process.env.NEXTAUTH_URL ?? DEFAULT_BASE_URL);
let emailBasePath = emailBaseUrl.pathname === '/' ? '' : emailBaseUrl.pathname.replace(/\/$/, '');

function updateBaseUrl(url: string) {
  const parsed = new URL(url);
  emailBaseUrl = parsed;
  emailBasePath = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');
}

function stripBasePath(path: string) {
  if (!emailBasePath) {
    return path;
  }
  if (path === emailBasePath) {
    return '/';
  }
  if (path.startsWith(`${emailBasePath}/`)) {
    return path.slice(emailBasePath.length);
  }
  return path;
}

function ensureValidRelativePath(target: string) {
  if (!target) {
    throw new Error('Action target path is required.');
  }
  const candidate = new URL(target, emailBaseUrl.origin);
  if (candidate.origin !== emailBaseUrl.origin) {
    throw new Error('Action links must stay within the Shelfy domain.');
  }
  const normalized = candidate.pathname + candidate.search + candidate.hash;
  if (!normalized.startsWith('/')) {
    throw new Error('Action paths must be absolute.');
  }
  return stripBasePath(normalized) || '/';
}

function buildFullPath(target: string) {
  const relativePath = ensureValidRelativePath(target);
  return `${emailBasePath}${relativePath}`;
}

export function buildActionLink(target: string) {
  const fullPath = buildFullPath(target);
  return `${emailBaseUrl.origin}${fullPath}`;
}

export function buildLoginLink(target: string) {
  const fullPath = buildFullPath(target);
  const loginPath = `${emailBasePath}/auth/login`;
  const loginUrl = new URL(loginPath, emailBaseUrl.origin);
  loginUrl.searchParams.set('next', fullPath);
  return loginUrl.toString();
}

export function setEmailLinkBaseUrl(url: string) {
  updateBaseUrl(url);
}

export function getEmailLinkBaseUrl() {
  return `${emailBaseUrl.origin}${emailBasePath}`;
}

export function getEmailLinkDestination(target: string) {
  return buildFullPath(target);
}
