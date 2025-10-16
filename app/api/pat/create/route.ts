import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = `pat_${randomBytes(24).toString("hex")}`;

  const { error } = await supabase.from("api_keys").insert({
    user_id: user.id,
    status: "active",
    plaintext_key: key,
  });
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  // PAT 只在创建时返回明文，后续仅显示部分掩码
  return NextResponse.json({ key });
}