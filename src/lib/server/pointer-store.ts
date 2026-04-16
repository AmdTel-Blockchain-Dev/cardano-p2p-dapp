/**
 * In-memory pointer store for profiles
 * Maps namespace -> { cid, timestamp, address }
 *
 * TODO: Replace with Redis/KV store for production.
 * This is sufficient for MVP on single server instance.
 */

interface PointerRecord {
  cid: string;
  timestamp: number;
  address: string;
}

const pointerStore = new Map<string, PointerRecord>();

export function setPointer(namespace: string, record: PointerRecord): void {
  pointerStore.set(namespace, record);
}

export function getPointer(namespace: string): PointerRecord | undefined {
  return pointerStore.get(namespace);
}

export function deletePointer(namespace: string): boolean {
  return pointerStore.delete(namespace);
}
