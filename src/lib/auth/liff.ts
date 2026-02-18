/**
 * Verify LIFF access token and return LINE user ID.
 * Uses LINE Profile API - valid token returns user profile including userId.
 */
export async function verifyLiffToken(
  accessToken: string | null
): Promise<string | null> {
  if (!accessToken?.trim()) return null;

  try {
    const res = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { userId?: string };
    return data.userId ?? null;
  } catch {
    return null;
  }
}

export function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim() || null;
}
