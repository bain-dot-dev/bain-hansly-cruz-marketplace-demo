"use server";

import { createClient } from "@supabase/supabase-js";

// Create a server-side supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type ProfileState = {
  error?: string;
  success?: boolean;
};

export async function updateUserProfile(
  userId: string,
  profileData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender: string;
    birthday: string;
  }
): Promise<ProfileState> {
  try {
    // Update user metadata in Supabase
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        full_name: `${profileData.firstName} ${profileData.lastName}`,
        phone_number: profileData.phoneNumber,
        gender: profileData.gender,
        birthday: profileData.birthday,
      },
    });

    if (error) {
      console.error("Supabase error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}
