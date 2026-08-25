import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBox } from "@/components/ui/search-box";
import { formatDate } from "@/lib/utils";
import { letterGrade, letterGradeColor } from "@/lib/math/grading";
import type { Assignment, ClassRow, SubmissionScore } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StudentAssignmentsPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase.from("class_members").select("class_id, classes(id, name)").eq("student_id", user.id);
  type MembershipRow = { class_id: string; classes: Pick<ClassRow, "id" | "name"> | null };
  const classIds = ((memberships ?? []) as unknown as MembershipRow[]).map((m) => m.class_id);
  const classNameById = new Map(((memberships ?? []) as unknown as MembershipRow[]).map((m) => [m.class_id, m.classes?.name ?? ""]));

  if (classIds.length === 0) {
    return <EmptyState icon={ClipboardList} title="No assignments yet" description="Join a class to see assignments here." />;
  }

  const [{ data: assignments }, { data: scores }] = await Promise.all([
    supabase.from("assignments").select("*").in("class_id", classIds).eq("status", "published").order("due_date").returns<Assignment[]>(),
    supabase.from("submission_scores").select("*").eq("student_id", user.id).in("class_id", classIds).returns<SubmissionScore[]>()
  ]);

  const scoreByAssignment = new Map((scores ?? []).map((s) => [s.assignment_id, s]));
  const query = (searchParams.q ?? "").trim().toLowerCase();
  const filtered = (assignments ?? []).filter((a) => !query || a.name.toLowerCase().includes(query));

  return (
    <div className="space-y-4">
      <SearchBox placeholder="Search assignments…" defaultValue={searchParams.q} />

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments found" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Assignment</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => {
                const s = scoreByAssignment.get(a.id);
                const letter = letterGrade(s?.percentage ?? null);
                return (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/student/assignments/${a.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{classNameById.get(a.class_id)}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(a.due_date)}</td>
                    <td className="px-5 py-3">
                      {!s || s.status === "not_started" ? (
                        <Badge tone="slate">Not started</Badge>
                      ) : s.status === "in_progress" ? (
                        <Badge tone="amber">In progress</Badge>
                      ) : s.status === "missing" ? (
                        <Badge tone="rose">Missing</Badge>
                      ) : s.fully_graded ? (
                        <ColorBadge colorClasses={letterGradeColor(letter)}>{s.percentage}% · {letter}</ColorBadge>
                      ) : (
                        <Badge tone="sky">Submitted</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/student/assignments/${a.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                        {!s || s.status === "not_started" ? "Start" : s.status === "in_progress" ? "Continue" : "View"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
