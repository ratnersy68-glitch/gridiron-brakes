"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computePercentage } from "@/lib/math/grading";

async function requireTeacher() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, teacherId: user.id };
}

export interface GradeUpdate {
  assignmentId: string;
  submissionId: string;
  questionId: string;
  pointsEarned: number;
  pointsPossible: number;
  comment: string;
}

export async function upsertGrade(update: GradeUpdate) {
  const { supabase, teacherId } = await requireTeacher();

  const isCorrect = update.pointsEarned >= update.pointsPossible ? true : update.pointsEarned <= 0 ? false : null;

  const { data: existing } = await supabase
    .from("grades")
    .select("id")
    .eq("submission_id", update.submissionId)
    .eq("question_id", update.questionId)
    .maybeSingle();

  const { data: saved, error } = await supabase
    .from("grades")
    .upsert(
      {
        submission_id: update.submissionId,
        question_id: update.questionId,
        points_earned: update.pointsEarned,
        points_possible: update.pointsPossible,
        is_correct: isCorrect,
        needs_review: false,
        is_override: true,
        comment: update.comment || null,
        graded_by: teacherId,
        graded_at: new Date().toISOString()
      },
      { onConflict: "submission_id,question_id" }
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(`/assignments/${update.assignmentId}/grade`);
  revalidatePath("/gradebook");
  revalidatePath("/students");

  return {
    gradeId: saved.id as string,
    // Grade history (and therefore undo) only exists once an existing row has
    // been updated at least once — a fresh insert has nothing to undo yet.
    canUndo: Boolean(existing),
    percentage: computePercentage(update.pointsEarned, update.pointsPossible)
  };
}

export async function undoLastGradeChange(gradeId: string) {
  const { supabase } = await requireTeacher();

  const { data: history } = await supabase
    .from("grade_history")
    .select("*")
    .eq("grade_id", gradeId)
    .order("changed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!history) throw new Error("Nothing to undo");

  const { error } = await supabase
    .from("grades")
    .update({
      points_earned: history.points_earned,
      points_possible: history.points_possible,
      is_correct: history.is_correct,
      comment: history.comment
    })
    .eq("id", gradeId);
  if (error) throw new Error(error.message);

  await supabase.from("grade_history").delete().eq("id", history.id);

  revalidatePath("/gradebook");

  return {
    pointsEarned: Number(history.points_earned ?? 0),
    pointsPossible: Number(history.points_possible ?? 0),
    comment: history.comment as string | null
  };
}

export async function setSubmissionFeedback(submissionId: string, comment: string) {
  const { supabase, teacherId } = await requireTeacher();

  const { data: existing } = await supabase.from("feedback").select("id").eq("submission_id", submissionId).order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (existing) {
    const { error } = await supabase.from("feedback").update({ comment }).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("feedback").insert({ submission_id: submissionId, comment, created_by: teacherId });
    if (error) throw new Error(error.message);
  }
}

export async function markSubmissionMissing(submissionId: string) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("submissions").update({ status: "missing" }).eq("id", submissionId);
  if (error) throw new Error(error.message);
  revalidatePath("/gradebook");
}
