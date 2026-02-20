import { NextRequest, NextResponse } from "next/server";
import { getAdminLineUserId } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  const adminId = await getAdminLineUserId(request);
  return NextResponse.json({ isAdmin: !!adminId });
}
