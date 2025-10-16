import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getEntitlementsForUser } from "@/lib/entitlements";

const PLUGIN_JWT_SECRET = new TextEncoder().encode(
  process.env.PLUGIN_JWT_SECRET || "dev-secret",
);

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, PLUGIN_JWT_SECRET, { audience: "plugin" });
    const userId = String(payload.user_id || "");
    const orgId = payload.org_id ? String(payload.org_id) : undefined;
    const entitlements = await getEntitlementsForUser(userId, orgId);
    return NextResponse.json({ entitlements });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}