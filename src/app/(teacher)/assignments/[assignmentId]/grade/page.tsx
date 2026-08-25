import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GradingInterface, type GradingStudent } from "@/components/grading/grading-interface";
import type { Assignment, Question, Submission, StudentAnswer, Grade, Feedback } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function GradeAssignmentPage({ params }: { params: { assignmentId: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: assignment } = await supabase.from("assignments").select("*").eq("id", params.assignmentId).returns<Assignment[]>().maybeSingle();
  if (!assignment) notFound();

  const [{ data: members }, { data: questions }, { data: submissions }] = await Promise.all([
    supabase.from("class_members").select("student_id, profile:profiles(id, full_name)").eq("class_id", assignment.class_id),
    supabase.from("questions").select("*").eq("assignment_id", assignment.id).order("order_index").returns<Question[]>(),
    supabase.from("submissions").select("*").eq("assignment_id", assignment.id).returns<Submission[]>()
  ]);

  const submissionIds = (submissions ?? []).map((s) => s.id);

  const [{ data: answers }, { data: grades }, { data: feedback }] = await Promise.all([
    submissionIds.length ? supabase.from("student_answers").select("*").in("submission_id", submissionIds).returns<StudentAnswer[]>() : Promise.resolve({ data: [] as StudentAnswer[] }),
    submissionIds.length ? supabase.from("grades").select("*").in("submission_id", submissionIds).returns<Grade[]>() : Promise.resolve({ data: [] as Grade[] }),
    submissionIds.length ? supabase.from("feedback").select("*").in("submission_id", submissionIds).order("created_at", { ascending: false }).returns<Feedback[]>() : Promise.resolve({ data: [] as Feedback[] })
  ]);

  type MemberRow = { student_id: string; profile: { id: string; full_name: string } | null };
  const roster = (members ?? []) as unknown as MemberRow[];
  const submissionByStudent = new Map((submissions ?? []).map((s) => [s.student_id, s]));
  const answersBySubmission = new Map<string, StudentAnswer[]>();
  (answers ?? []).forEach((a) => {
    if (!answersBySubmission.has(a.submission_id)) answersBySubmission.set(a.submission_id, []);
    answersBySubmission.get(a.submission_id)!.push(a);
  });
  const gradesBySubmission = new Map<string, Grade[]>();
  (grades ?? []).forEach((g) => {
    if (!gradesBySubmission.has(g.submission_id)) gradesBySubmission.set(g.submission_id, []);
    gradesBySubmission.get(g.submission_id)!.push(g);
  });
  const feedbackBySubmission = new Map<string, string>();
  (feedback ?? []).forEach((f) => {
    if (!feedbackBySubmission.has(f.submission_id)) feedbackBySubmission.set(f.submission_id, f.comment);
  });

  const students: GradingStudent[] = roster
    .filter((m) => m.profile)
    .map((m) => {
      const submission = submissionByStudent.get(m.student_id) ?? null;
      const submissionAnswers = submission ? answersBySubmission.get(submission.id) ?? [] : [];
      const submissionGrades = submission ? gradesBySubmission.get(submission.id) ?? [] : [];
      return {
        studentId: m.student_id,
        name: m.profile!.full_name,
        submission: submission
          ? { id: submission.id, status: submission.status, isLate: submission.is_late, submittedAt: submission.submitted_at }
          : null,
        answers: submissionAnswers.map((a) => ({ questionId: a.question_id, answerText: a.answer_text })),
        grades: submissionGrades.map((g) => ({
          id: g.id,
          questionId: g.question_id,
          pointsEarned: Number(g.points_earned),
          pointsPossible: Number(g.points_possible),
          comment: g.comment,
          needsReview: g.needs_review,
          autoGraded: g.auto_graded,
          isOverride: g.is_override
        })),
        feedback: submission ? feedbackBySubmission.get(submission.id) ?? "" : ""
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href={`/assignments/${assignment.id}`} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to assignment
          </Link>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Grading — {assignment.name}</h2>
        </div>
      </div>
      <GradingInterface
        assignmentId={assignment.id}
        totalPoints={assignment.total_points}
        questions={(questions ?? []).map((q) => ({
          id: q.id,
          orderIndex: q.order_index,
          text: q.question_text,
          pointValue: Number(q.point_value),
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          answerType: q.answer_type
        }))}
        students={students}
      />
    </div>
  );
}
