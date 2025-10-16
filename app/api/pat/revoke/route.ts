import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key_id } = await req.json().catch(() => ({ key_id: undefined }));
  if (!key_id) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { error } = await supabase
    .from("api_keys")
    .update({ status: "revoked" })
    .eq("id", key_id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}