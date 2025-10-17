import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ lang: string }> }) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const { lang: locale } = await context.params;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // If next is a relative path, prefix locale; else redirect as-is
      if (next.startsWith("/")) {
        redirect(`/${locale}${next}`);
      }
      redirect(next);
    } else {
      redirect(`/${locale}/auth/error?error=${encodeURIComponent(error?.message ?? "Unknown error")}`);
    }
  }

  redirect(`/${locale}/auth/error?error=${encodeURIComponent("No token hash or type")}`);
}