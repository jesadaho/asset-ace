import type { NextRequest } from "next/server";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";

const ADMIN_IDS_KEY = "ADMIN_LINE_USER_IDS";

/**
 * Returns the LINE user ID if the request is from an admin, otherwise null.
 * Admin list is read from env ADMIN_LINE_USER_IDS (comma-separated).
 */
export async function getAdminLineUserId(
  request: NextRequest
): Promise<string | null> {
  const lineUserId = await getLineUserIdFromRequest(request);
  if (!lineUserId) return null;

  const idsStr = process.env[ADMIN_IDS_KEY];
  if (!idsStr?.trim()) return null;

  const ids = idsStr.split(",").map((id) => id.trim()).filter(Boolean);
  return ids.includes(lineUserId) ? lineUserId : null;
}
