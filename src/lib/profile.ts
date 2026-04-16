import { createHash } from "node:crypto";
import { CID } from "multiformats/cid";

/** MVP profile schema */
export interface UserProfile {
  displayName: string;
  about: string;
  contact: string;
  website: string;
  avatarCid: string;
  updatedAt: number;
  version: 1;
}

/** Pointer record stored at deterministic namespace */
export interface ProfilePointer {
  latestProfileCid: string;
  updatedAt: number;
  identityHash: string;
  version: 1;
}

/** Field constraints for MVP */
export const PROFILE_CONSTRAINTS = {
  displayName: { maxLength: 100, required: true },
  about: { maxLength: 500, required: false },
  contact: { maxLength: 100, required: false },
  website: { maxLength: 200, required: false },
  avatarCid: { maxLength: 100, required: false },
} as const;

/** Max payload size for profile JSON (bytes) */
export const MAX_PROFILE_PAYLOAD = 10_000;

/**
 * Validate an IPFS CID string using multiformats parsing.
 */
export function isValidIpfsCid(value: string): boolean {
  try {
    CID.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Derive a deterministic IPFS namespace from wallet address.
 * Prefers stake identity when available (unique per account),
 * falls back to selected payment address for compatibility.
 */
export function deriveProfileNamespace(
  address: string,
  stakeAddress?: string,
): string {
  // Use stake address if available (more stable identity),
  // otherwise fall back to payment address
  const identity = stakeAddress || address;

  // Create deterministic hash for namespace
  const scopedSeed = `cardano-p2p-dapp:profile:v1:${identity}`;
  const hash = createHash("sha256")
    .update(scopedSeed)
    .digest("hex")
    .slice(0, 32);

  // Return readable namespace key
  return `profile-${hash}`;
}

/**
 * Validate and sanitize profile fields before storage.
 * Strips unknown fields, enforces length limits, normalizes URLs.
 */
export function validateAndSanitizeProfile(
  raw: unknown,
):
  | { valid: true; profile: Partial<UserProfile> }
  | { valid: false; error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { valid: false, error: "Profile must be an object" };
  }

  const data = raw as Record<string, unknown>;
  const result: Partial<UserProfile> = {};

  // Validate displayName (required for minimal profile)
  if (
    typeof data.displayName !== "string" ||
    data.displayName.trim().length === 0
  ) {
    return {
      valid: false,
      error: "displayName is required and must be non-empty",
    };
  }

  result.displayName = data.displayName
    .slice(0, PROFILE_CONSTRAINTS.displayName.maxLength)
    .trim();

  // Optional fields with sanitization
  if (data.about !== undefined) {
    if (typeof data.about === "string") {
      result.about = data.about
        .slice(0, PROFILE_CONSTRAINTS.about.maxLength)
        .trim();
    } else {
      return { valid: false, error: "about must be a string" };
    }
  }

  if (data.contact !== undefined) {
    if (typeof data.contact === "string") {
      result.contact = data.contact
        .slice(0, PROFILE_CONSTRAINTS.contact.maxLength)
        .trim();
    } else {
      return { valid: false, error: "contact must be a string" };
    }
  }

  if (data.website !== undefined) {
    if (typeof data.website === "string") {
      let website = data.website
        .slice(0, PROFILE_CONSTRAINTS.website.maxLength)
        .trim();
      // Normalize URLs
      if (website && !website.startsWith("http")) {
        website = `https://${website}`;
      }
      result.website = website;
    } else {
      return { valid: false, error: "website must be a string" };
    }
  }

  if (data.avatarCid !== undefined) {
    if (typeof data.avatarCid === "string") {
      const cid = data.avatarCid.trim();
      if (cid && !isValidIpfsCid(cid)) {
        return {
          valid: false,
          error: "avatarCid must be a valid IPFS CID format",
        };
      }
      result.avatarCid = cid;
    } else {
      return { valid: false, error: "avatarCid must be a string" };
    }
  }

  // Add metadata
  result.updatedAt = Date.now();
  result.version = 1;

  // Check total payload size
  const payloadSize = new TextEncoder().encode(JSON.stringify(result)).length;
  if (payloadSize > MAX_PROFILE_PAYLOAD) {
    return {
      valid: false,
      error: `Profile payload exceeds ${MAX_PROFILE_PAYLOAD} bytes`,
    };
  }

  return { valid: true, profile: result as UserProfile };
}

/**
 * Build the pointer record for deterministic retrieval.
 */
export function buildPointerRecord(
  latestProfileCid: string,
  address: string,
  stakeAddress?: string,
): ProfilePointer {
  const namespace = deriveProfileNamespace(address, stakeAddress);
  const identityHash = createHash("sha256")
    .update(stakeAddress || address)
    .digest("hex")
    .slice(0, 16);

  return {
    latestProfileCid,
    updatedAt: Date.now(),
    identityHash,
    version: 1,
  };
}
