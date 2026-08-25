"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SettingsFormState {
  error?: string;
  success?: string;
}

export async function updateProfile(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const fullName = String(formData.get("full_name") || "").trim();
  const school = String(formData.get("school") || "").trim();
  if (!fullName) return { error: "Name is required." };

  const { error: profileError } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  if (profileError) return { error: profileError.message };

  const { error: teacherError } = await supabase.from("teachers").update({ school: school || null }).eq("id", user.id);
  if (teacherError) return { error: teacherError.message };

  await supabase.auth.updateUser({ data: { full_name: fullName } });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: "Profile updated." };
}

export async function changePassword(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm_password") || "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: "Password updated." };
}
