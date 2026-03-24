import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDeepLinkTargetFromSearchParams } from "@/lib/deep-link";

const canonicalHost = "assethub.in.th";

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/|favicon|icon|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg)$).*)"],
};

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Redirect asset-ace.vercel.app to canonical domain so post-login lands on assethub.in.th
  if (host.includes("asset-ace.vercel.app")) {
    const target = new URL(request.url);
    target.host = canonicalHost;
    target.protocol = "https:";
    return NextResponse.redirect(target, 308); // Permanent redirect
  }

  // LIFF deep links open endpoint `/` with ?path=...; redirect before HTML so home page never flashes.
  const url = request.nextUrl.clone();
  if (url.pathname === "/" || url.pathname === "") {
    const deep = getDeepLinkTargetFromSearchParams(url.searchParams);
    if (deep && deep !== "/") {
      const next = new URL(request.url);
      next.pathname = deep;
      next.searchParams.delete("path");
      next.searchParams.delete("redirect");
      return NextResponse.redirect(next, 307);
    }
  }

  return NextResponse.next();
}
