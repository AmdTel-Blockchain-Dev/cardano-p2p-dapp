import crypto from 'node:crypto';
import verifyDataSignature from '@cardano-foundation/cardano-verify-datasignature';

// In-memory nonce store (dev only). In production replace with Redis/DB.
const nonceStore = new Map<string, { expiry: number; payload: string }>();

export const AUTH_COOKIE_NAME = 'cardano_session';
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24h
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Convert string to hex for CIP-30 signing
 */
export function stringToHex(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a simple, clean nonce message
 * Server-side only - no window.location access
 */
export function generateNonce(): string {
  const randomPart = crypto.randomBytes(24).toString('hex');
  const timestamp = Date.now();
  const nonceMessage = `Cardano P2P dApp Authorization\nNonce: ${randomPart}\nTimestamp: ${timestamp}`;
  
  // Store with expiry and the hex payload for verification
  const expiryTime = timestamp + NONCE_TTL_MS;
  const hexPayload = stringToHex(nonceMessage);
  nonceStore.set(randomPart, { expiry: expiryTime, payload: hexPayload });
  
  return nonceMessage;
}

/**
 * Validate nonce hasn't expired and exists
 */
export function isNonceValid(nonceMessage: string): boolean {
  const randomMatch = nonceMessage.match(/Nonce: ([a-f0-9]+)/);
  if (!randomMatch) return false;
  
  const randomPart = randomMatch[1];
  const entry = nonceStore.get(randomPart);
  
  if (!entry || Date.now() > entry.expiry) {
    nonceStore.delete(randomPart);
    return false;
  }
  
  return true;
}

/**
 * Get the hex payload that was signed for this nonce
 */
export function getNonceHexPayload(nonceMessage: string): string | null {
  const randomMatch = nonceMessage.match(/Nonce: ([a-f0-9]+)/);
  if (!randomMatch) return null;
  
  const randomPart = randomMatch[1];
  const entry = nonceStore.get(randomPart);
  return entry?.payload || null;
}

/**
 * Mark nonce as used (prevent replay attacks)
 */
export function consumeNonce(nonceMessage: string): void {
  const randomMatch = nonceMessage.match(/Nonce: ([a-f0-9]+)/);
  if (randomMatch) {
    nonceStore.delete(randomMatch[1]);
  }
}

/**
 * Create a session token with HMAC signature
 */
export function createSessionToken(address: string): string {
  // Try multiple ways to access the secret
  const secret = process.env.AUTH_SECRET;

  // TEMPORARY: Use a fallback secret for development
  const fallbackSecret = 'dev-secret-change-in-production-123456789012345678901234567890';

  const finalSecret = secret || fallbackSecret;

  if (!secret) {
    console.warn('⚠️ Using fallback auth secret for development. Set AUTH_SECRET in production!');
  }

  const payload = JSON.stringify({
    address,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_MS,
  });

  const signature = crypto
    .createHmac('sha256', finalSecret)
    .update(payload)
    .digest('hex');

  const token = `${payload}.${signature}`;
  return Buffer.from(token).toString('base64url');
}

/**
 * Set HTTP-only auth cookie on response
 */
export function setAuthCookie(response: Response, address: string): void {
  const token = createSessionToken(address);
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  
  response.headers.append(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`
  );
}