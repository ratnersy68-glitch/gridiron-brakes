"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireTeacher() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, teacherId: user.id };
}

export async function setRowMissing(assignmentId: string, studentId: string, missing: boolean) {
  const { supabase } = await requireTeacher();

  const { data: existing } = await supabase.from("submissions").select("id, status").eq("assignment_id", assignmentId).eq("student_id", studentId).maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("submissions")
      .update({ status: missing ? "missing" : "not_started" })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else if (missing) {
    const { error } = await supabase.from("submissions").insert({ assignment_id: assignmentId, student_id: studentId, status: "missing" });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/gradebook");
  revalidatePath("/dashboard");
}
