import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { updateAssignment } from "../../actions";
import type { Assignment, Question, Topic } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function EditAssignmentPage({ params }: { params: { assignmentId: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: assignment } = await supabase.from("assignments").select("*").eq("id", params.assignmentId).returns<Assignment[]>().maybeSingle();
  if (!assignment) notFound();

  const [{ data: classes }, { data: topics }, { data: questions }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("teacher_id", user.id).order("name"),
    supabase.from("topics").select("*").order("sort_order").returns<Topic[]>(),
    supabase.from("questions").select("*").eq("assignment_id", assignment.id).order("order_index").returns<Question[]>()
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Edit assignment</h2>
        <p className="text-sm text-slate-500">Changes to questions replace the current question set.</p>
      </div>
      <AssignmentForm
        classes={classes ?? []}
        topics={topics ?? []}
        initial={{
          classId: assignment.class_id,
          name: assignment.name,
          dateAssigned: assignment.date_assigned,
          dueDate: assignment.due_date ?? "",
          instructions: assignment.instructions ?? "",
          topicId: assignment.topic_id,
          difficulty: assignment.difficulty,
          status: assignment.status,
          questions: (questions ?? []).map((q) => ({
            id: q.id,
            question_text: q.question_text,
            point_value: q.point_value,
            correct_answer: q.correct_answer ?? "",
            explanation: q.explanation ?? "",
            topic_id: q.topic_id,
            difficulty: q.difficulty,
            answer_type: q.answer_type
          }))
        }}
        onSubmit={updateAssignment.bind(null, assignment.id)}
        submitLabel="Save changes"
      />
    </div>
  );
}
