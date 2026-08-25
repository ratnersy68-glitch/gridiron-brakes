import type { SupabaseClient } from "@supabase/supabase-js";
import { checkMathEquivalence } from "@/lib/math/equivalence";

/**
 * Runs when a student submits an assignment. For every question, checks the
 * student's answer against the answer key using the math-equivalence engine
 * (never plain string matching) and writes a starting grade — full credit,
 * zero, or flagged `needs_review` when it can't be safely auto-graded.
 * The teacher can freely override every one of these in the grading UI.
 */
export async function autoGradeSubmission(supabase: SupabaseClient, submissionId: string) {
  const { data: submission } = await supabase.from("submissions").select("id, assignment_id").eq("id", submissionId).single();
  if (!submission) return;

  const [{ data: questions }, { data: answers }, { data: existingGrades }] = await Promise.all([
    supabase.from("questions").select("id, point_value, correct_answer, answer_type").eq("assignment_id", submission.assignment_id),
    supabase.from("student_answers").select("question_id, answer_text").eq("submission_id", submissionId),
    supabase.from("grades").select("question_id").eq("submission_id", submissionId)
  ]);

  const answerByQuestion = new Map((answers ?? []).map((a) => [a.question_id, a.answer_text]));
  const alreadyGraded = new Set((existingGrades ?? []).map((g) => g.question_id));

  const rows = (questions ?? [])
    .filter((q) => !alreadyGraded.has(q.id))
    .map((q) => {
      const studentAnswer = answerByQuestion.get(q.id) ?? "";
      const pointValue = Number(q.point_value);

      if (q.answer_type === "manual" || !q.correct_answer) {
        return {
          submission_id: submissionId,
          question_id: q.id,
          points_earned: 0,
          points_possible: pointValue,
          is_correct: null,
          needs_review: true,
          auto_graded: false,
          is_override: false
        };
      }

      const result = checkMathEquivalence(studentAnswer, q.correct_answer);
      if (result.status === "correct") {
        return {
          submission_id: submissionId,
          question_id: q.id,
          points_earned: pointValue,
          points_possible: pointValue,
          is_correct: true,
          needs_review: false,
          auto_graded: true,
          is_override: false
        };
      }
      if (result.status === "incorrect") {
        return {
          submission_id: submissionId,
          question_id: q.id,
          points_earned: 0,
          points_possible: pointValue,
          is_correct: false,
          needs_review: false,
          auto_graded: true,
          is_override: false
        };
      }
      return {
        submission_id: submissionId,
        question_id: q.id,
        points_earned: 0,
        points_possible: pointValue,
        is_correct: null,
        needs_review: true,
        auto_graded: false,
        is_override: false
      };
    });

  if (rows.length > 0) {
    await supabase.from("grades").insert(rows);
  }
}
