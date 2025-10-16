import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getEntitlementsForUser } from "@/lib/entitlements";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const entitlements = await getEntitlementsForUser(user.id);
  return NextResponse.json({ user_id: user.id, entitlements });
}