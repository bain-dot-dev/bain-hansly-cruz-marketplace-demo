import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Check if email verification is enabled
const emailVerificationEnabled =
  process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION !== "false";

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Disable email confirmation if configured
    ...(emailVerificationEnabled
      ? {}
      : {
          flowType: "pkce",
        }),
  },
});
