const ONBOARDING_PATH = "/onboarding";
const ADD_FRIEND_REQUIRED_PATH = "/add-friend-required";
const ADD_PROPERTY_PATH = "/owner/properties/add";

const ALLOWED_DEEP_LINK_PATHS = new Set([
  "/",
  ONBOARDING_PATH,
  ADD_FRIEND_REQUIRED_PATH,
  ADD_PROPERTY_PATH,
  /** Owner “ทรัพย์ของฉัน” list (LINE นิชาเมนู / LIFF ?path=) */
  "/owner/properties",
  "/owner/properties/bind",
  "/owners",
  "/agents",
  "/tenants",
]);

/**
 * Resolves deep-link target from URL search params (path, redirect, or path inside liff.state).
 */
export function getDeepLinkTargetFromSearchParams(
  params: Pick<URLSearchParams, "get">
): string | null {
  let path = params.get("path") ?? params.get("redirect");
  if (!path) {
    const liffState = params.get("liff.state");
    if (liffState) {
      try {
        const decoded = decodeURIComponent(liffState);
        const stateParams = new URLSearchParams(
          decoded.startsWith("?") ? decoded.slice(1) : decoded
        );
        path = stateParams.get("path") ?? stateParams.get("redirect") ?? null;
      } catch {
        path = null;
      }
    }
  }

  if (!path || !path.startsWith("/")) return null;
  const normalized = path.split("?")[0];
  return ALLOWED_DEEP_LINK_PATHS.has(normalized) ? normalized : null;
}

/** Build URLSearchParams from Next.js `searchParams` page prop (string or string[]). */
export function searchParamsPropToURLSearchParams(
  record: Record<string, string | string[] | undefined>
): URLSearchParams {
  const u = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) u.append(key, v);
    } else {
      u.set(key, value);
    }
  }
  return u;
}
