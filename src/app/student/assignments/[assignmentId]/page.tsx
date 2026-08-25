import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AssignmentTaker } from "@/components/student/assignment-taker";
import { AssignmentReview } from "@/components/student/assignment-review";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Assignment, ClassRow, StudentQuestion, SubmissionStatus } from "@/types/database";

export const dynamic = "force-dynamic";

interface GradedReviewRow {
  question_id: string;
  order_index: number;
  question_text: string;
  point_value: number;
  correct_answer: string | null;
  explanation: string | null;
  student_answer: string | null;
  points_earned: number | null;
  points_possible: number | null;
  comment: string | null;
}

export default async function TakeAssignmentPage({ params }: { params: { assignmentId: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: assignment } = await supabase.from("assignments").select("*").eq("id", params.assignmentId).eq("status", "published").returns<Assignment[]>().maybeSingle();
  if (!assignment) notFound();

  const { data: klass } = await supabase.from("classes").select("*").eq("id", assignment.class_id).returns<ClassRow[]>().maybeSingle();

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, status, submitted_at, is_late")
    .eq("assignment_id", assignment.id)
    .eq("student_id", user.id)
    .maybeSingle();

  const status: SubmissionStatus = submission?.status ?? "not_started";
  const isGraded = status === "graded";

  if (isGraded && submission) {
    const { data: reviewData } = await supabase.rpc("get_graded_submission_review", { _submission_id: submission.id });
    const review = (reviewData ?? []) as GradedReviewRow[];
    const { data: feedback } = await supabase.from("feedback").select("comment").eq("submission_id", submission.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <BackLink />
        <AssignmentReview
          assignmentName={assignment.name}
          className={klass?.name ?? ""}
          totalPoints={assignment.total_points}
          isLate={submission.is_late}
          submittedAt={submission.submitted_at}
          feedback={feedback?.comment ?? ""}
          rows={review.map((r) => ({
            questionText: r.question_text,
            pointValue: Number(r.point_value),
            correctAnswer: r.correct_answer,
            explanation: r.explanation,
            studentAnswer: r.student_answer,
            pointsEarned: r.points_earned !== null ? Number(r.points_earned) : null,
            pointsPossible: r.points_possible !== null ? Number(r.points_possible) : Number(r.point_value),
            comment: r.comment
          }))}
        />
      </div>
    );
  }

  if (status === "submitted") {
    const { data: answers } = await supabase.from("student_answers").select("question_id, answer_text").eq("submission_id", submission!.id);
    const { data: questionsData } = await supabase.rpc("get_assignment_questions", { _assignment_id: assignment.id });
    const questions = (questionsData ?? []) as StudentQuestion[];
    const answerByQuestion = new Map((answers ?? []).map((a) => [a.question_id, a.answer_text]));

    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <BackLink />
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">{assignment.name}</h2>
          <p className="text-sm text-slate-500">Submitted — waiting for your teacher to grade it.</p>
        </Card>
        <Card className="divide-y divide-slate-100">
          {questions.map((q, i) => (
            <div key={q.id} className="p-4">
              <p className="text-sm text-slate-800">
                <span className="font-medium text-slate-500">{i + 1}.</span> {q.question_text}
              </p>
              <p className="mt-1 rounded-md bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600">{answerByQuestion.get(q.id) || "(blank)"}</p>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  const { data: questionsData } = await supabase.rpc("get_assignment_questions", { _assignment_id: assignment.id });
  const questions = (questionsData ?? []) as StudentQuestion[];
  const { data: existingAnswers } = submission
    ? await supabase.from("student_answers").select("question_id, answer_text").eq("submission_id", submission.id)
    : { data: [] as { question_id: string; answer_text: string | null }[] };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink />
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">{assignment.name}</h2>
        <p className="text-sm text-slate-500">
          {klass?.name} · {assignment.total_points} points · Due {formatDate(assignment.due_date)}
        </p>
        {assignment.instructions && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{assignment.instructions}</p>}
      </Card>
      <AssignmentTaker
        assignmentId={assignment.id}
        questions={questions}
        initialAnswers={Object.fromEntries((existingAnswers ?? []).map((a) => [a.question_id, a.answer_text ?? ""]))}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/student/assignments" className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
      <ArrowLeft className="h-3.5 w-3.5" /> All assignments
    </Link>
  );
}
