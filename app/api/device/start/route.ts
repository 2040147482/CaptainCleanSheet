import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const code = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("device_codes").insert({
    code,
    status: "pending",
    expires_at: expiresAt,
  });
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  const verificationUri = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/device/confirm?code=${code}`;

  return NextResponse.json({ device_code: code, verification_uri: verificationUri, expires_at: expiresAt });
}