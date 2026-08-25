import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBox } from "@/components/ui/search-box";
import { AssignmentRowActions } from "@/components/assignments/assignment-row-actions";
import { formatDate, round1 } from "@/lib/utils";
import { percentageColor } from "@/lib/math/grading";
import type { Assignment, ClassRow, SubmissionScore } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage({ searchParams }: { searchParams: { q?: string; classId?: string; status?: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: classes } = await supabase.from("classes").select("id, name").eq("teacher_id", user.id).returns<Pick<ClassRow, "id" | "name">[]>();
  const classIds = (classes ?? []).map((c) => c.id);
  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));

  if (classIds.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Create a class first"
        action={
          <Link href="/classes">
            <Button>Go to classes</Button>
          </Link>
        }
      />
    );
  }

  const { data: assignments } = await supabase.from("assignments").select("*").in("class_id", classIds).order("created_at", { ascending: false }).returns<Assignment[]>();
  const assignmentIds = (assignments ?? []).map((a) => a.id);

  const { data: scores } = assignmentIds.length
    ? await supabase.from("submission_scores").select("*").in("assignment_id", assignmentIds).returns<SubmissionScore[]>()
    : { data: [] as SubmissionScore[] };

  const scoresByAssignment = new Map<string, SubmissionScore[]>();
  (scores ?? []).forEach((s) => {
    if (!scoresByAssignment.has(s.assignment_id)) scoresByAssignment.set(s.assignment_id, []);
    scoresByAssignment.get(s.assignment_id)!.push(s);
  });

  const query = (searchParams.q ?? "").trim().toLowerCase();
  const filtered = (assignments ?? []).filter((a) => {
    if (query && !a.name.toLowerCase().includes(query)) return false;
    if (searchParams.classId && a.class_id !== searchParams.classId) return false;
    if (searchParams.status && a.status !== searchParams.status) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox placeholder="Search assignments…" defaultValue={searchParams.q} />
        </div>
        <Link href="/assignments/new">
          <Button>
            <Plus className="h-4 w-4" /> New assignment
          </Button>
        </Link>
      </div>

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
                <th className="px-5 py-3 font-medium">Points</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Average</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => {
                const rowScores = scoresByAssignment.get(a.id) ?? [];
                const pcts = rowScores.map((s) => s.percentage).filter((p): p is number => p !== null);
                const avg = pcts.length ? round1(pcts.reduce((x, y) => x + y, 0) / pcts.length) : null;
                const submittedCount = rowScores.filter((s) => s.status !== "not_started").length;
                return (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/assignments/${a.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                        {a.name}
                      </Link>
                      <p className="text-xs text-slate-400">{submittedCount} submitted</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{classNameById.get(a.class_id)}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(a.due_date)}</td>
                    <td className="px-5 py-3 text-slate-500">{a.total_points}</td>
                    <td className="px-5 py-3">
                      <Badge tone={a.status === "published" ? "emerald" : "slate"}>{a.status}</Badge>
                    </td>
                    <td className={`px-5 py-3 font-medium ${percentageColor(avg)}`}>{avg !== null ? `${avg}%` : "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <AssignmentRowActions assignmentId={a.id} />
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
