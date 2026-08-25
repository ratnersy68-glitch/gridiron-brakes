import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBox } from "@/components/ui/search-box";
import { initials, round1 } from "@/lib/utils";
import { letterGrade, percentageColor } from "@/lib/math/grading";
import type { ClassRow, SubmissionScore } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function StudentsPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const query = (searchParams.q ?? "").trim().toLowerCase();

  const { data: classes } = await supabase.from("classes").select("id, name").eq("teacher_id", user.id).returns<Pick<ClassRow, "id" | "name">[]>();
  const classIds = (classes ?? []).map((c) => c.id);
  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));

  if (classIds.length === 0) {
    return <EmptyState icon={Users} title="No students yet" description="Create a class and add students to see them here." />;
  }

  const [{ data: members }, { data: scores }] = await Promise.all([
    supabase
      .from("class_members")
      .select("class_id, student_id, profile:profiles(id, full_name, email)")
      .in("class_id", classIds),
    supabase.from("submission_scores").select("*").in("class_id", classIds).returns<SubmissionScore[]>()
  ]);

  type MemberRow = { class_id: string; student_id: string; profile: { id: string; full_name: string; email: string } | null };
  const roster = (members ?? []) as unknown as MemberRow[];

  const classesByStudent = new Map<string, string[]>();
  const seen = new Set<string>();
  const students: { id: string; name: string; email: string }[] = [];
  roster.forEach((m) => {
    if (!m.profile) return;
    if (!classesByStudent.has(m.student_id)) classesByStudent.set(m.student_id, []);
    classesByStudent.get(m.student_id)!.push(classNameById.get(m.class_id) ?? "Class");
    if (!seen.has(m.student_id)) {
      seen.add(m.student_id);
      students.push({ id: m.student_id, name: m.profile.full_name, email: m.profile.email });
    }
  });

  const scoresByStudent = new Map<string, number[]>();
  const missingByStudent = new Map<string, number>();
  (scores ?? []).forEach((s) => {
    if (s.percentage !== null) {
      if (!scoresByStudent.has(s.student_id)) scoresByStudent.set(s.student_id, []);
      scoresByStudent.get(s.student_id)!.push(s.percentage);
    }
    if (s.status === "missing") missingByStudent.set(s.student_id, (missingByStudent.get(s.student_id) ?? 0) + 1);
  });

  const filtered = students
    .filter((s) => !query || s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <SearchBox placeholder="Search students by name or email…" defaultValue={searchParams.q} />

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students found" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Classes</th>
                <th className="px-5 py-3 font-medium">Average</th>
                <th className="px-5 py-3 font-medium">Missing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => {
                const pcts = scoresByStudent.get(s.id) ?? [];
                const avg = pcts.length ? round1(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
                const missing = missingByStudent.get(s.id) ?? 0;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/students/${s.id}`} className="flex items-center gap-2.5 font-medium text-slate-800 hover:text-brand-600">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {initials(s.name)}
                        </span>
                        <span>
                          {s.name}
                          <span className="block text-xs font-normal text-slate-400">{s.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{(classesByStudent.get(s.id) ?? []).join(", ")}</td>
                    <td className={`px-5 py-3 font-medium ${percentageColor(avg)}`}>{avg !== null ? `${avg}% (${letterGrade(avg)})` : "—"}</td>
                    <td className="px-5 py-3">
                      {missing > 0 ? (
                        <Badge tone="rose">
                          <AlertTriangle className="h-3 w-3" /> {missing}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
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
