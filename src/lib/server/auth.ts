import crypto from 'node:crypto';
import verifyDataSignature from '@cardano-foundation/cardano-verify-datasignature';

// In-memory nonce store (dev only). In production replace with Redis/DB.
const nonceStore = new Map<string, number>(); // nonceMessage → expiry timestamp

export const AUTH_COOKIE_NAME = 'cardano_session';
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24h

export function generateNonce(): string {
  const randomPart = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const nonceMessage = `Sign in to Cardano P2P DAP\nNonce: ${randomPart}\nTime: ${new Date(timestamp).toISOString()}\nDomain: ${typeof window !== 'undefined' ? window.location.hostname : 'yourdomain.com'}`;
  const expiry = timestamp + 5 * 60 * 1000; // 5 min
  nonceStore.set(nonceMessage, expiry);
  return nonceMessage;
}

export function isNonceValid(nonceMessage: string): boolean {
  const expiry = nonceStore.get(nonceMessage);
  if (!expiry || Date.now() > expiry) {
    nonceStore.delete(nonceMessage);
    return false;
  }
  return true;
}

export function consumeNonce(nonceMessage: string): void {
  nonceStore.delete(nonceMessage);
}

export function createSessionToken(address: string): string {
  const payload = JSON.stringify({
    address,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_MS,
  });
  const signature = crypto
    .createHmac('sha256', process.env.AUTH_SECRET!)
    .update(payload)
    .digest('hex');
  const token = `${payload}.${signature}`;
  return Buffer.from(token).toString('base64url');
}

export function setAuthCookie(response: Response, address: string): void {
  const token = createSessionToken(address);
  response.headers.append(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION_MS / 1000}`
  );
}