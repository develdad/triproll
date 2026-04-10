import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "email"
    | "recovery"
    | "invite"
    | "email_change"
    | null;
  const redirect = searchParams.get("redirect_to") || "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Verification failed; redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
