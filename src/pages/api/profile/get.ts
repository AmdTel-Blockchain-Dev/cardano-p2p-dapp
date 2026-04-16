import type { APIRoute } from "astro";
import { deriveProfileNamespace } from "../../../lib/profile";
import { verifySessionCookie } from "../../../lib/server/auth";
import { getPointer } from "../../../lib/server/pointer-store";

/**
 * GET /api/profile/get
 * Authenticated endpoint to retrieve profile pointer from server.
 * Client then uses the CID to fetch actual profile from IPFS.
 */
export const GET: APIRoute = async ({ request }) => {
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

    // Derive namespace and look up pointer
    const namespace = deriveProfileNamespace(address, stakeAddress);
    const pointer = getPointer(namespace);

    if (!pointer) {
      // Profile not found is not an error, just return empty state
      return new Response(
        JSON.stringify({
          success: true,
          found: false,
          cid: null,
          message: "No profile saved yet",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log(`[Profile] Retrieved pointer for ${namespace}: ${pointer.cid}`);

    return new Response(
      JSON.stringify({
        success: true,
        found: true,
        cid: pointer.cid,
        timestamp: pointer.timestamp,
        namespace,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[Profile Get] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
