import type { APIRoute } from 'astro';
import { generateNonce } from '../../../lib/server/auth';

// Prevent static pre-rendering of this dynamic endpoint
export const prerender = false;

export const GET: APIRoute = async () => {
  const nonce = generateNonce();
  return new Response(JSON.stringify({ nonce }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};