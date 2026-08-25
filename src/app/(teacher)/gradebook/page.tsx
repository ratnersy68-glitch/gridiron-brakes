import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GradebookTable, type GradebookRow } from "@/components/gradebook/gradebook-table";
import type { Assignment, ClassRow, Profile, SubmissionScore } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function GradebookPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: classes } = await supabase.from("classes").select("id, teacher_id, name, subject, class_code, archived, created_at, updated_at").eq("teacher_id", user.id).returns<ClassRow[]>();
  const classIds = (classes ?? []).map((c) => c.id);

  if (classIds.length === 0) {
    return <GradebookTable rows={[]} classes={[]} assignments={[]} />;
  }

  const [{ data: assignments }, { data: scores }, { data: members }] = await Promise.all([
    supabase.from("assignments").select("*").in("class_id", classIds).returns<Assignment[]>(),
    supabase.from("submission_scores").select("*").in("class_id", classIds).returns<SubmissionScore[]>(),
    supabase.from("class_members").select("class_id, student_id, profile:profiles(id, full_name)").in("class_id", classIds)
  ]);

  type MemberRow = { class_id: string; student_id: string; profile: Pick<Profile, "id" | "full_name"> | null };
  const roster = (members ?? []) as unknown as MemberRow[];
  const studentNameById = new Map<string, string>();
  roster.forEach((m) => m.profile && studentNameById.set(m.student_id, m.profile.full_name));

  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));
  const assignmentById = new Map((assignments ?? []).map((a) => [a.id, a]));

  // A row per (student, assignment) they're enrolled for — including
  // not-yet-started work, so missing assignments are visible in the book.
  const rows: GradebookRow[] = [];
  const seen = new Set<string>();
  (scores ?? []).forEach((s) => {
    const a = assignmentById.get(s.assignment_id);
    if (!a) return;
    seen.add(`${s.assignment_id}_${s.student_id}`);
    rows.push({
      submissionId: s.submission_id,
      studentId: s.student_id,
      studentName: studentNameById.get(s.student_id) ?? "Student",
      className: classNameById.get(s.class_id) ?? "",
      classId: s.class_id,
      assignmentId: s.assignment_id,
      assignmentName: a.name,
      pointsEarned: s.percentage !== null ? s.points_earned : null,
      pointsPossible: s.points_possible,
      percentage: s.percentage,
      status: s.status,
      isLate: s.is_late
    });
  });
  roster.forEach((m) => {
    (assignments ?? [])
      .filter((a) => a.class_id === m.class_id && a.status === "published")
      .forEach((a) => {
        const seenKey = `${a.id}_${m.student_id}`;
        if (seen.has(seenKey)) return;
        rows.push({
          submissionId: null,
          studentId: m.student_id,
          studentName: m.profile?.full_name ?? "Student",
          className: classNameById.get(m.class_id) ?? "",
          classId: m.class_id,
          assignmentId: a.id,
          assignmentName: a.name,
          pointsEarned: null,
          pointsPossible: a.total_points,
          percentage: null,
          status: "not_started",
          isLate: false
        });
      });
  });

  return (
    <GradebookTable
      rows={rows}
      classes={(classes ?? []).map((c) => ({ id: c.id, name: c.name }))}
      assignments={(assignments ?? []).map((a) => ({ id: a.id, name: a.name, classId: a.class_id }))}
      initialQuery={searchParams.q ?? ""}
    />
  );
}
