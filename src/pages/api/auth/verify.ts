import type { APIRoute } from 'astro';
import verifyDataSignature from '@cardano-foundation/cardano-verify-datasignature';
import { isNonceValid, consumeNonce, setAuthCookie } from '../../../lib/server/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { address, signature, key, nonce } = await request.json();

    if (!address || !signature || !key || !nonce) {
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), { status: 400 });
    }

    if (!isNonceValid(nonce)) {
      return new Response(JSON.stringify({ success: false, error: 'Nonce expired or invalid' }), { status: 401 });
    }

    // Verify CIP-30 signature (official foundation lib)
    const isValidSig = verifyDataSignature(signature, key, nonce, address);

    if (!isValidSig) {
      consumeNonce(nonce);
      return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), { status: 401 });
    }

    consumeNonce(nonce);

    // Success → issue secure HTTP-only cookie
    const response = new Response(JSON.stringify({ success: true, address }), { status: 200 });
    setAuthCookie(response, address);
    return response;
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), { status: 500 });
  }
};