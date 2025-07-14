"use client";

import { supabaseClient } from "@/lib/supabase-client";

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: { first_name: string; last_name: string }
) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: metadata.first_name,
        last_name: metadata.last_name,
        full_name: `${metadata.first_name} ${metadata.last_name}`,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOut() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}
