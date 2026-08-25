"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateClassCode } from "@/lib/utils";

async function requireTeacher() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, teacherId: user.id };
}

export async function createClass(formData: FormData) {
  const { supabase, teacherId } = await requireTeacher();
  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "Math").trim() || "Math";
  if (!name) throw new Error("Class name is required");

  let code = generateClassCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase.from("classes").select("id").eq("class_code", code).maybeSingle();
    if (!existing) break;
    code = generateClassCode();
  }

  const { error } = await supabase.from("classes").insert({ teacher_id: teacherId, name, subject, class_code: code });
  if (error) throw new Error(error.message);

  revalidatePath("/classes");
  revalidatePath("/dashboard");
}

export async function updateClass(classId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  if (!name) throw new Error("Class name is required");

  const { error } = await supabase.from("classes").update({ name, subject }).eq("id", classId);
  if (error) throw new Error(error.message);

  revalidatePath("/classes");
  revalidatePath(`/classes/${classId}`);
}

export async function setClassArchived(classId: string, archived: boolean) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("classes").update({ archived }).eq("id", classId);
  if (error) throw new Error(error.message);

  revalidatePath("/classes");
  revalidatePath("/dashboard");
}

export async function regenerateClassCode(classId: string) {
  const { supabase } = await requireTeacher();
  let code = generateClassCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase.from("classes").select("id").eq("class_code", code).maybeSingle();
    if (!existing) break;
    code = generateClassCode();
  }
  const { error } = await supabase.from("classes").update({ class_code: code }).eq("id", classId);
  if (error) throw new Error(error.message);

  revalidatePath(`/classes/${classId}`);
}

export async function addStudentByEmail(classId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) throw new Error("Email is required");

  const { data: profile } = await supabase.from("profiles").select("id, role").eq("email", email).maybeSingle();
  if (!profile) throw new Error("No student account found with that email yet. Ask them to sign up first.");
  if (profile.role !== "student") throw new Error("That email belongs to a non-student account.");

  const { error } = await supabase.from("class_members").insert({ class_id: classId, student_id: profile.id });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);

  revalidatePath(`/classes/${classId}`);
}

export async function removeStudentFromClass(classId: string, studentId: string) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("class_members").delete().eq("class_id", classId).eq("student_id", studentId);
  if (error) throw new Error(error.message);

  revalidatePath(`/classes/${classId}`);
}
