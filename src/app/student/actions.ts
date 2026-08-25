"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { autoGradeSubmission } from "@/lib/grading/auto-grade";

async function requireStudent() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, studentId: user.id };
}

export interface JoinClassState {
  error?: string;
  success?: string;
}

export async function joinClassByCode(_prev: JoinClassState, formData: FormData): Promise<JoinClassState> {
  const { supabase } = await requireStudent();
  const code = String(formData.get("code") || "").trim();
  if (!code) return { error: "Enter a class code." };

  const { error } = await supabase.rpc("join_class_by_code", { _code: code });
  if (error) return { error: error.message.includes("Invalid") ? "That class code doesn't match any class." : error.message };

  revalidatePath("/student/dashboard");
  revalidatePath("/student/assignments");
  return { success: "You've joined the class!" };
}

async function ensureSubmission(supabase: ReturnType<typeof createClient>, studentId: string, assignmentId: string) {
  const { data: submission } = await supabase.from("submissions").select("id, status").eq("assignment_id", assignmentId).eq("student_id", studentId).maybeSingle();

  if (submission) {
    if (submission.status === "submitted" || submission.status === "graded") {
      throw new Error("This assignment has already been submitted.");
    }
    if (submission.status === "not_started" || submission.status === "missing") {
      await supabase.from("submissions").update({ status: "in_progress" }).eq("id", submission.id);
    }
    return submission.id as string;
  }

  const { data: created, error } = await supabase
    .from("submissions")
    .insert({ assignment_id: assignmentId, student_id: studentId, status: "in_progress" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return created.id as string;
}

export async function saveAnswer(assignmentId: string, questionId: string, answerText: string) {
  const { supabase, studentId } = await requireStudent();
  const submissionId = await ensureSubmission(supabase, studentId, assignmentId);

  const { error } = await supabase
    .from("student_answers")
    .upsert(
      { submission_id: submissionId, question_id: questionId, answer_text: answerText, answered_at: new Date().toISOString() },
      { onConflict: "submission_id,question_id" }
    );
  if (error) throw new Error(error.message);

  return { submissionId };
}

export async function submitAssignment(assignmentId: string) {
  const { supabase, studentId } = await requireStudent();

  const { data: submission } = await supabase.from("submissions").select("id, status").eq("assignment_id", assignmentId).eq("student_id", studentId).maybeSingle();
  if (!submission) throw new Error("Answer at least one question before submitting.");
  if (submission.status === "submitted" || submission.status === "graded") throw new Error("Already submitted.");

  const { error } = await supabase.from("submissions").update({ status: "submitted" }).eq("id", submission.id);
  if (error) throw new Error(error.message);

  // Grade rows are written with the service role: a student's own session must
  // never be able to insert into `grades` directly (that's how a grade could be
  // faked), so this runs only after we've verified server-side, via the
  // student's own RLS-scoped client above, that this submission is theirs and
  // was just legitimately transitioned to "submitted".
  await autoGradeSubmission(createAdminClient(), submission.id);

  revalidatePath(`/student/assignments/${assignmentId}`);
  revalidatePath("/student/assignments");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/grades");
}
