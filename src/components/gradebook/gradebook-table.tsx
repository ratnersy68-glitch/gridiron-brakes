"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Download, ArrowUpDown, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { SearchBox } from "@/components/ui/search-box";
import { EmptyState } from "@/components/ui/empty-state";
import { letterGrade, letterGradeColor, percentageColor } from "@/lib/math/grading";
import { downloadCsv } from "@/lib/csv";
import { useToast } from "@/components/ui/toast";
import { setRowMissing } from "@/app/(teacher)/gradebook/actions";
import type { SubmissionStatus } from "@/types/database";

export interface GradebookRow {
  submissionId: string | null;
  studentId: string;
  studentName: string;
  className: string;
  classId: string;
  assignmentId: string;
  assignmentName: string;
  pointsEarned: number | null;
  pointsPossible: number;
  percentage: number | null;
  status: SubmissionStatus;
  isLate: boolean;
}

type SortKey = "studentName" | "assignmentName" | "percentage";

export function GradebookTable({
  rows,
  classes,
  assignments,
  initialQuery = ""
}: {
  rows: GradebookRow[];
  classes: { id: string; name: string }[];
  assignments: { id: string; name: string; classId: string }[];
  initialQuery?: string;
}) {
  const q = initialQuery.trim().toLowerCase();
  const [classFilter, setClassFilter] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("studentName");
  const [sortAsc, setSortAsc] = useState(true);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const filteredAssignmentOptions = assignments.filter((a) => !classFilter || a.classId === classFilter);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (q && !r.studentName.toLowerCase().includes(q)) return false;
      if (classFilter && r.classId !== classFilter) return false;
      if (assignmentFilter && r.assignmentId !== assignmentFilter) return false;
      if (statusFilter === "missing" && r.status !== "missing") return false;
      if (statusFilter === "late" && !r.isLate) return false;
      if (statusFilter === "ungraded" && !(r.status === "submitted" && r.percentage === null)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "studentName") cmp = a.studentName.localeCompare(b.studentName);
      else if (sortKey === "assignmentName") cmp = a.assignmentName.localeCompare(b.assignmentName);
      else cmp = (a.percentage ?? -1) - (b.percentage ?? -1);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [rows, q, classFilter, assignmentFilter, statusFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const classAvg = useMemo(() => {
    const pcts = filtered.map((r) => r.percentage).filter((p): p is number => p !== null);
    return pcts.length ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10 : null;
  }, [filtered]);

  const exportCsv = () => {
    downloadCsv("gradebook.csv", [
      ["Student", "Class", "Assignment", "Score", "Percentage", "Letter Grade", "Missing", "Late"],
      ...filtered.map((r) => [
        r.studentName,
        r.className,
        r.assignmentName,
        r.pointsEarned !== null ? `${r.pointsEarned}/${r.pointsPossible}` : "",
        r.percentage !== null ? `${r.percentage}%` : "",
        r.percentage !== null ? letterGrade(r.percentage) : "",
        r.status === "missing" ? "Yes" : "No",
        r.isLate ? "Yes" : "No"
      ])
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox placeholder="Search students…" defaultValue={q} />
        <Select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setAssignmentFilter("");
          }}
          className="w-auto"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value)} className="w-auto">
          <option value="">All assignments</option>
          {filteredAssignmentOptions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="">All statuses</option>
          <option value="missing">Missing</option>
          <option value="late">Late</option>
          <option value="ungraded">Needs grading</option>
        </Select>
        <div className="ml-auto flex items-center gap-3">
          {classAvg !== null && (
            <span className="text-xs text-slate-500">
              Average: <span className={`font-semibold ${percentageColor(classAvg)}`}>{classAvg}%</span>
            </span>
          )}
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No rows match your filters" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="cursor-pointer select-none px-4 py-3 font-medium" onClick={() => toggleSort("studentName")}>
                  <span className="flex items-center gap-1">
                    Student <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="cursor-pointer select-none px-4 py-3 font-medium" onClick={() => toggleSort("assignmentName")}>
                  <span className="flex items-center gap-1">
                    Assignment <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="cursor-pointer select-none px-4 py-3 font-medium" onClick={() => toggleSort("percentage")}>
                  <span className="flex items-center gap-1">
                    Percentage <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">Letter</th>
                <th className="px-4 py-3 font-medium">Missing</th>
                <th className="px-4 py-3 font-medium">Late</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const letter = letterGrade(r.percentage);
                return (
                  <tr key={`${r.assignmentId}_${r.studentId}`} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5">
                      <Link href={`/students/${r.studentId}`} className="font-medium text-slate-800 hover:text-brand-600">
                        {r.studentName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{r.className}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/assignments/${r.assignmentId}`} className="text-slate-700 hover:text-brand-600">
                        {r.assignmentName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{r.pointsEarned !== null ? `${r.pointsEarned}/${r.pointsPossible}` : "—"}</td>
                    <td className={`px-4 py-2.5 font-medium ${percentageColor(r.percentage)}`}>{r.percentage !== null ? `${r.percentage}%` : "—"}</td>
                    <td className="px-4 py-2.5">{r.percentage !== null && <ColorBadge colorClasses={letterGradeColor(letter)}>{letter}</ColorBadge>}</td>
                    <td className="px-4 py-2.5">
                      <button
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            try {
                              await setRowMissing(r.assignmentId, r.studentId, r.status !== "missing");
                            } catch (e) {
                              show(e instanceof Error ? e.message : "Failed to update", "error");
                            }
                          })
                        }
                      >
                        {r.status === "missing" ? <Badge tone="rose">Missing</Badge> : <span className="text-xs text-slate-300 hover:text-slate-500">Mark missing</span>}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">{r.isLate ? <Badge tone="amber">Late</Badge> : <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/assignments/${r.assignmentId}/grade`} className="text-xs font-medium text-brand-600 hover:underline">
                        Grade
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
