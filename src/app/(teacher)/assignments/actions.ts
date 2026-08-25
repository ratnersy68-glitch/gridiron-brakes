"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AssignmentStatus, DifficultyLevel } from "@/types/database";

export interface QuestionInput {
  id?: string;
  question_text: string;
  point_value: number;
  correct_answer: string;
  explanation: string;
  topic_id: string | null;
  difficulty: DifficultyLevel;
  answer_type: "auto" | "manual";
}

export interface AssignmentInput {
  classId: string;
  name: string;
  dateAssigned: string;
  dueDate: string;
  instructions: string;
  topicId: string | null;
  difficulty: DifficultyLevel;
  status: AssignmentStatus;
  questions: QuestionInput[];
}

async function requireTeacher() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, teacherId: user.id };
}

export async function createAssignment(input: AssignmentInput) {
  const { supabase } = await requireTeacher();
  if (!input.name.trim()) throw new Error("Assignment name is required");
  if (!input.classId) throw new Error("Please select a class");

  const totalPoints = input.questions.reduce((sum, q) => sum + (Number(q.point_value) || 0), 0);

  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      class_id: input.classId,
      name: input.name.trim(),
      date_assigned: input.dateAssigned || new Date().toISOString().slice(0, 10),
      due_date: input.dueDate || null,
      total_points: totalPoints,
      instructions: input.instructions || null,
      topic_id: input.topicId,
      difficulty: input.difficulty,
      status: input.status,
      has_answer_key: input.questions.every((q) => q.correct_answer.trim().length > 0)
    })
    .select("id")
    .single();

  if (error || !assignment) throw new Error(error?.message ?? "Failed to create assignment");

  if (input.questions.length > 0) {
    const { error: qError } = await supabase.from("questions").insert(
      input.questions.map((q, i) => ({
        assignment_id: assignment.id,
        order_index: i,
        question_text: q.question_text,
        point_value: q.point_value,
        correct_answer: q.correct_answer || null,
        explanation: q.explanation || null,
        topic_id: q.topic_id,
        difficulty: q.difficulty,
        answer_type: q.answer_type
      }))
    );
    if (qError) throw new Error(qError.message);
  }

  revalidatePath("/assignments");
  revalidatePath("/dashboard");
  redirect(`/assignments/${assignment.id}`);
}

export async function updateAssignment(assignmentId: string, input: AssignmentInput) {
  const { supabase } = await requireTeacher();
  if (!input.name.trim()) throw new Error("Assignment name is required");

  const totalPoints = input.questions.reduce((sum, q) => sum + (Number(q.point_value) || 0), 0);

  const { error } = await supabase
    .from("assignments")
    .update({
      name: input.name.trim(),
      date_assigned: input.dateAssigned || new Date().toISOString().slice(0, 10),
      due_date: input.dueDate || null,
      total_points: totalPoints,
      instructions: input.instructions || null,
      topic_id: input.topicId,
      difficulty: input.difficulty,
      status: input.status,
      has_answer_key: input.questions.every((q) => q.correct_answer.trim().length > 0)
    })
    .eq("id", assignmentId);
  if (error) throw new Error(error.message);

  // Simplest consistent strategy: replace the question set. Existing grades
  // cascade-delete with their questions, which is acceptable pre-publish;
  // once an assignment has submissions, teachers are steered toward
  // duplication instead of restructuring it (enforced in the UI).
  const { error: delError } = await supabase.from("questions").delete().eq("assignment_id", assignmentId);
  if (delError) throw new Error(delError.message);

  if (input.questions.length > 0) {
    const { error: qError } = await supabase.from("questions").insert(
      input.questions.map((q, i) => ({
        assignment_id: assignmentId,
        order_index: i,
        question_text: q.question_text,
        point_value: q.point_value,
        correct_answer: q.correct_answer || null,
        explanation: q.explanation || null,
        topic_id: q.topic_id,
        difficulty: q.difficulty,
        answer_type: q.answer_type
      }))
    );
    if (qError) throw new Error(qError.message);
  }

  revalidatePath("/assignments");
  revalidatePath(`/assignments/${assignmentId}`);
  redirect(`/assignments/${assignmentId}`);
}

export async function setAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("assignments").update({ status }).eq("id", assignmentId);
  if (error) throw new Error(error.message);
  revalidatePath("/assignments");
  revalidatePath(`/assignments/${assignmentId}`);
}

export async function deleteAssignment(assignmentId: string) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);
  if (error) throw new Error(error.message);
  revalidatePath("/assignments");
}

export async function duplicateAssignment(assignmentId: string) {
  const { supabase } = await requireTeacher();

  const { data: original } = await supabase.from("assignments").select("*").eq("id", assignmentId).single();
  if (!original) throw new Error("Assignment not found");

  const { data: questions } = await supabase.from("questions").select("*").eq("assignment_id", assignmentId).order("order_index");

  const { data: copy, error } = await supabase
    .from("assignments")
    .insert({
      class_id: original.class_id,
      name: `${original.name} (Copy)`,
      date_assigned: new Date().toISOString().slice(0, 10),
      due_date: original.due_date,
      total_points: original.total_points,
      instructions: original.instructions,
      topic_id: original.topic_id,
      difficulty: original.difficulty,
      status: "draft",
      has_answer_key: original.has_answer_key
    })
    .select("id")
    .single();
  if (error || !copy) throw new Error(error?.message ?? "Failed to duplicate assignment");

  if (questions && questions.length > 0) {
    const { error: qError } = await supabase.from("questions").insert(
      questions.map((q) => ({
        assignment_id: copy.id,
        order_index: q.order_index,
        question_text: q.question_text,
        point_value: q.point_value,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        topic_id: q.topic_id,
        difficulty: q.difficulty,
        answer_type: q.answer_type
      }))
    );
    if (qError) throw new Error(qError.message);
  }

  revalidatePath("/assignments");
  return copy.id as string;
}
