import type { APIRoute } from 'astro';
import { generateNonce } from '../../lib/server/auth';

export const GET: APIRoute = async () => {
  const nonce = generateNonce();
  return new Response(JSON.stringify({ nonce }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};