import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const idParam = url.searchParams.get("id");
  const digestParam = url.searchParams.get("digest");
  if (!idParam && !digestParam) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const admin = createAdminClient();
  let query = admin.from("webhooks_log").select("id,event_id,type,status,received_at,error,digest,payload").limit(1);
  if (idParam) query = query.eq("id", Number(idParam));
  if (digestParam) query = query.eq("digest", digestParam);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ item: data });
}