import type { APIRoute } from "astro";
import {
  validateAndSanitizeProfile,
  deriveProfileNamespace,
  buildPointerRecord,
  isValidIpfsCid,
} from "../../../lib/profile";
import { verifySessionCookie } from "../../../lib/server/auth";
import { setPointer } from "../../../lib/server/pointer-store";

/**
 * POST /api/profile/save
 * Authenticated endpoint to save profile pointer to IPFS.
 * Client sends profile data + CID, server validates and stores pointer.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Get session from cookies
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionData = verifySessionCookie(cookieHeader);

    if (!sessionData) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { address, stakeAddress } = sessionData;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const bodyObj = body as Record<string, unknown>;
    const cid = bodyObj.cid;
    const profileData = bodyObj.profile;

    // Validate inputs
    if (typeof cid !== "string" || !isValidIpfsCid(cid)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid CID format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate profile data
    const validation = validateAndSanitizeProfile(profileData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Derive namespace and store pointer
    const namespace = deriveProfileNamespace(address, stakeAddress);
    const pointer = buildPointerRecord(cid, address, stakeAddress);

    setPointer(namespace, {
      cid: pointer.latestProfileCid,
      timestamp: pointer.updatedAt,
      address,
    });

    console.log(`[Profile] Saved pointer for ${namespace}: ${cid}`);

    return new Response(
      JSON.stringify({
        success: true,
        cid,
        namespace,
        timestamp: pointer.updatedAt,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[Profile Save] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
