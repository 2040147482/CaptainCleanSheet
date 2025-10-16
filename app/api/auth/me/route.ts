import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getEntitlementsForUser } from "@/lib/entitlements";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ authenticated: false }, { status: 200 });

  const entitlements = await getEntitlementsForUser(user.id);
  return NextResponse.json({ authenticated: true, user: { id: user.id, email: user.email }, entitlements });
}