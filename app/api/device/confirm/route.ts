import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json().catch(() => ({ code: undefined }));
  if (!code) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { data: dc, error: selErr } = await supabase
    .from("device_codes")
    .select("code,status,expires_at")
    .eq("code", code)
    .maybeSingle();
  if (selErr || !dc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dc.status !== "pending") return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  if (new Date(dc.expires_at).getTime() < Date.now()) return NextResponse.json({ error: "Expired" }, { status: 400 });

  const { error: updErr } = await supabase
    .from("device_codes")
    .update({ status: "approved", user_id: user.id, approved_at: new Date().toISOString() })
    .eq("code", code);
  if (updErr) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  // Optional convenience: allow GET confirm using query param if user is authenticated
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase
    .from("device_codes")
    .update({ status: "approved", user_id: user.id, approved_at: new Date().toISOString() })
    .eq("code", code);
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}