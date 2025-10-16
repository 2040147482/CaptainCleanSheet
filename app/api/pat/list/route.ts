import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

function maskKey(key: string) {
  if (!key) return "";
  const prefix = key.slice(0, 7); // e.g., pat_abc
  const suffix = key.slice(-6);
  return `${prefix}••••••••••${suffix}`;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("api_keys")
    .select("id,status,created_at,last_used_at,plaintext_key")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  type APIKeyRow = {
    id: string;
    status: string;
    created_at: string;
    last_used_at: string | null;
    plaintext_key: string | null;
  };
  const rows: APIKeyRow[] = (data ?? []) as APIKeyRow[];
  const items = rows.map((k) => ({
    id: k.id,
    status: k.status,
    created_at: k.created_at,
    last_used_at: k.last_used_at,
    masked_key: maskKey(k.plaintext_key || ""),
  }));

  return NextResponse.json({ items });
}