import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  return NextResponse.next();
}
