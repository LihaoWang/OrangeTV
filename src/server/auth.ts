import type { FastifyRequest } from 'fastify';

type AuthInfo = {
  password?: string;
  username?: string;
  signature?: string;
  timestamp?: number;
  role?: 'owner' | 'admin' | 'user';
};

const PUBLIC_PREFIXES = [
  '/api/login',
  '/api/logout',
  '/api/cron',
  '/api/server-config',
  '/api/health',
  '/runtime-config.js',
  '/assets/',
  '/icons/',
  '/favicon.ico',
  '/robots.txt',
  '/manifest.json',
  '/logo.png',
  '/screenshot.png',
  '/sw.js',
  '/workbox-',
  '/login',
  '/warning',
];

export function shouldSkipAuth(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function getAuthCookie(request: FastifyRequest): AuthInfo | null {
  const authCookie = request.cookies?.auth;
  if (!authCookie) return null;

  try {
    return JSON.parse(decodeURIComponent(authCookie));
  } catch {
    return null;
  }
}

export async function isAuthenticated(request: FastifyRequest) {
  if (!process.env.PASSWORD) return false;

  const authInfo = getAuthCookie(request);
  if (!authInfo) return false;

  const storageType = process.env.VITE_STORAGE_TYPE || 'localstorage';
  if (storageType === 'localstorage') {
    return authInfo.password === process.env.PASSWORD;
  }

  if (!authInfo.username || !authInfo.signature) return false;
  return verifySignature(
    authInfo.username,
    authInfo.signature,
    process.env.PASSWORD
  );
}

async function verifySignature(data: string, signature: string, secret: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signatureBuffer = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    return crypto.subtle.verify('HMAC', key, signatureBuffer, messageData);
  } catch {
    return false;
  }
}
