"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Create a server-side supabase client for auth actions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type AuthState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function signIn(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Basic validation
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Redirect to profile page on success
      redirect("/profile");
    }

    return { error: "Authentication failed" };
  } catch {
    return { error: "An unexpected error occurred" };
  }
}

export async function signUp(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Basic validation
  if (!firstName || !lastName || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
      email_confirm: true, // Auto-confirm for development
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      return {
        success: true,
        message: "Account created successfully! You can now sign in.",
      };
    }

    return { error: "Failed to create account" };
  } catch {
    return { error: "Failed to create account. Please try again." };
  }
}
