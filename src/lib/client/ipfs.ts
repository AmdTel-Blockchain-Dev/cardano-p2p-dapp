import { createHelia } from "helia";
import { unixfs } from "@helia/unixfs";
import { CID } from "multiformats/cid";
import { IDBBlockstore } from "blockstore-idb";
import { IDBDatastore } from "datastore-idb";

type BlockstoreGetAllEntry = {
  cid: CID;
  bytes?: AsyncIterable<Uint8Array>;
  block?: Uint8Array;
};

class HeliaCompatibleIDBBlockstore {
  constructor(private readonly store: IDBBlockstore) {}

  async open(): Promise<void> {
    await this.store.open();
  }

  async close(): Promise<void> {
    await this.store.close();
  }

  async put(
    cid: CID,
    bytes: Uint8Array,
    options?: { signal?: AbortSignal },
  ): Promise<CID> {
    return await this.store.put(cid, bytes, options);
  }

  async get(cid: CID, options?: { signal?: AbortSignal }): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    for await (const chunk of this.store.get(cid, options)) {
      chunks.push(chunk);
      totalLength += chunk.byteLength;
    }

    const data = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return data;
  }

  async has(cid: CID, options?: { signal?: AbortSignal }): Promise<boolean> {
    return await this.store.has(cid, options);
  }

  async delete(cid: CID, options?: { signal?: AbortSignal }): Promise<void> {
    await this.store.delete(cid, options);
  }

  async *putMany(
    source: AsyncIterable<{ cid: CID; block: Uint8Array }>,
    options?: { signal?: AbortSignal },
  ): AsyncIterable<CID> {
    for await (const { cid, block } of source) {
      await this.put(cid, block, options);
      yield cid;
    }
  }

  async *getMany(
    source: AsyncIterable<CID>,
    options?: { signal?: AbortSignal },
  ): AsyncIterable<{ cid: CID; block: Uint8Array }> {
    for await (const cid of source) {
      yield { cid, block: await this.get(cid, options) };
    }
  }

  async *deleteMany(
    source: AsyncIterable<CID>,
    options?: { signal?: AbortSignal },
  ): AsyncIterable<CID> {
    for await (const cid of source) {
      await this.delete(cid, options);
      yield cid;
    }
  }

  async *getAll(options?: {
    signal?: AbortSignal;
  }): AsyncIterable<{ cid: CID; block: Uint8Array }> {
    for await (const entry of this.store.getAll(
      options,
    ) as AsyncIterable<BlockstoreGetAllEntry>) {
      if (entry.block) {
        yield { cid: entry.cid, block: entry.block };
        continue;
      }

      const block = entry.bytes
        ? await this.collect(entry.bytes)
        : await this.get(entry.cid, options);
      yield { cid: entry.cid, block };
    }
  }

  private async collect(
    source: AsyncIterable<Uint8Array>,
  ): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    for await (const chunk of source) {
      chunks.push(chunk);
      totalLength += chunk.byteLength;
    }

    const data = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return data;
  }
}

let heliaInstance: any = null;
let initPromise: Promise<any> | null = null;
let storageMode: "indexeddb" | "memory" = "memory";
let lastInitError: string | null = null;
let blockstore: IDBBlockstore | null = null;
let datastore: IDBDatastore | null = null;
let compatibleBlockstore: HeliaCompatibleIDBBlockstore | null = null;

async function createBrowserHelia() {
  if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
    try {
      datastore = new IDBDatastore("cardano-p2p-dapp-ipfs-datastore");
      blockstore = new IDBBlockstore("cardano-p2p-dapp-ipfs-blockstore");
      compatibleBlockstore = new HeliaCompatibleIDBBlockstore(blockstore);

      await datastore.open();
      await compatibleBlockstore.open();

      storageMode = "indexeddb";
      lastInitError = null;

      // Cast to keep runtime compatibility while package interfaces are version-skewed.
      return await createHelia({
        datastore: datastore as any,
        blockstore: compatibleBlockstore as any,
      } as any);
    } catch (error) {
      lastInitError = error instanceof Error ? error.message : String(error);
      storageMode = "memory";
      console.warn("[IPFS] Falling back to in-memory storage:", error);
    }
  }

  return await createHelia();
}

/**
 * Get or initialize singleton Helia instance for browser P2P IPFS.
 * Handles initialization atomicity to prevent multiple concurrent inits.
 */
export async function getHelia() {
  if (heliaInstance) {
    return heliaInstance;
  }

  if (initPromise) {
    // Already initializing, wait for it
    heliaInstance = await initPromise;
    return heliaInstance;
  }

  // Start initialization
  initPromise = createBrowserHelia().then((instance) => {
    heliaInstance = instance;
    return instance;
  });

  return initPromise;
}

/**
 * Add a JSON object to IPFS and return its CID string.
 * @param json - The object to store
 * @returns CID string (base58, CIDv0 format)
 */
export async function addJsonToIPFS(json: unknown): Promise<string> {
  const helia = await getHelia();
  const fs = unixfs(helia);

  const data = new TextEncoder().encode(JSON.stringify(json));
  const cid = await fs.addBytes(data);

  // Return as string in readable format
  return cid.toString();
}

/**
 * Retrieve a JSON object from IPFS by CID.
 * @param cid - The IPFS CID string (v0 or v1)
 * @returns Parsed JSON object, or null if not found
 */
export async function getJsonFromIPFS(
  cidStr: string,
  timeoutMs: number = 15000,
  offline: boolean = false,
): Promise<unknown> {
  try {
    const helia = await getHelia();
    const fs = unixfs(helia);
    const cid = CID.parse(cidStr);

    // Read all chunks and concatenate, with overall timeout
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    const readChunks = async () => {
      for await (const chunk of fs.cat(cid, { offline })) {
        chunks.push(chunk);
        totalLength += chunk.byteLength;
      }
    };

    await Promise.race([
      readChunks(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`IPFS fetch timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);

    const data = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const text = new TextDecoder().decode(data);
    return JSON.parse(text);
  } catch (error) {
    // CID not found or parse error
    console.error(`[IPFS] Failed to retrieve CID ${cidStr}:`, error);
    return null;
  }
}

export function getIPFSStatus() {
  return {
    storageMode,
    lastInitError,
    connectionCount: heliaInstance?.libp2p.getConnections().length ?? 0,
    peerId: heliaInstance?.libp2p.peerId.toString() ?? null,
  };
}

/**
 * Clean up Helia instance (call on app unload if desired).
 * Note: For browser usage, this is optional; Helia stops when tab closes.
 */
export async function shutdownHelia() {
  if (heliaInstance) {
    await heliaInstance.stop();
    heliaInstance = null;
    initPromise = null;
  }

  if (blockstore) {
    await blockstore.close();
    blockstore = null;
  }

  compatibleBlockstore = null;

  if (datastore) {
    await datastore.close();
    datastore = null;
  }
}
