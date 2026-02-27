import { Blockfrost, Lucid } from 'lucid-cardano';
import type { APIRoute } from 'astro';

export const prerender = false;

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  });
}

async function readAddress(request: Request): Promise<string | null> {
  // Parse query params without relying on request headers (works for absolute and path-only URLs)
  const url = new URL(request.url, 'http://localhost');
  const fromQuery = url.searchParams.get('address');
  if (fromQuery) return fromQuery;

  try {
    const body = await request.json();
    return typeof body?.address === 'string' ? body.address : null;
  } catch {
    return null;
  }
}

async function handle(request: Request): Promise<Response> {
  const address = await readAddress(request);
  if (!address) {
    return json({ error: 'address is required' }, { status: 400 });
  }

  const key = import.meta.env.BLOCKFROST_KEY;
  if (!key) {
    return json({ error: 'BLOCKFROST_KEY not configured on server' }, { status: 500 });
  }

  const api = new Blockfrost('https://cardano-mainnet.blockfrost.io/api/v0', key);
  const lucid = await Lucid.new(api, 'Mainnet');

  try {
    const utxos = await lucid.utxosAt(address);
    let lovelace = 0n;
    for (const u of utxos) {
      lovelace += BigInt(u.assets.lovelace ?? 0);
    }

    return json({ lovelace: lovelace.toString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: `error fetching balance: ${message}` }, { status: 500 });
  }
}

export const GET: APIRoute = async ({ request }) => handle(request);
export const POST: APIRoute = async ({ request }) => handle(request);
