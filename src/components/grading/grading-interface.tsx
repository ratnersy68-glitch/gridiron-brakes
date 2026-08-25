"use client";

import { useMemo, useRef, useState } from "react";
import { Check, X, RotateCcw, AlertCircle, Clock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, initials, formatDateTime } from "@/lib/utils";
import { computePercentage, letterGrade, letterGradeColor, percentageColor } from "@/lib/math/grading";
import { upsertGrade, undoLastGradeChange, setSubmissionFeedback } from "@/app/(teacher)/assignments/[assignmentId]/grade/actions";
import type { SubmissionStatus } from "@/types/database";

export interface GradingQuestion {
  id: string;
  orderIndex: number;
  text: string;
  pointValue: number;
  correctAnswer: string | null;
  explanation: string | null;
  answerType: "auto" | "manual";
}

export interface GradingStudent {
  studentId: string;
  name: string;
  submission: { id: string; status: SubmissionStatus; isLate: boolean; submittedAt: string | null } | null;
  answers: { questionId: string; answerText: string | null }[];
  grades: {
    id: string;
    questionId: string;
    pointsEarned: number;
    pointsPossible: number;
    comment: string | null;
    needsReview: boolean;
    autoGraded: boolean;
    isOverride: boolean;
  }[];
  feedback: string;
}

interface GradeState {
  gradeId: string | null;
  pointsEarned: number;
  pointsPossible: number;
  comment: string;
  needsReview: boolean;
  autoGraded: boolean;
  canUndo: boolean;
}

type SaveStatus = "idle" | "saving" | "saved";

export function GradingInterface({
  assignmentId,
  questions,
  students
}: {
  assignmentId: string;
  totalPoints: number;
  questions: GradingQuestion[];
  students: GradingStudent[];
}) {
  const [selectedId, setSelectedId] = useState(students.find((s) => s.submission)?.studentId ?? students[0]?.studentId);
  const [gradeState, setGradeState] = useState<Record<string, Record<string, GradeState>>>(() => {
    const initial: Record<string, Record<string, GradeState>> = {};
    for (const s of students) {
      const byQuestion: Record<string, GradeState> = {};
      for (const q of questions) {
        const g = s.grades.find((gr) => gr.questionId === q.id);
        byQuestion[q.id] = g
          ? { gradeId: g.id, pointsEarned: g.pointsEarned, pointsPossible: g.pointsPossible, comment: g.comment ?? "", needsReview: g.needsReview, autoGraded: g.autoGraded, canUndo: g.isOverride }
          : { gradeId: null, pointsEarned: 0, pointsPossible: q.pointValue, comment: "", needsReview: false, autoGraded: false, canUndo: false };
      }
      initial[s.studentId] = byQuestion;
    }
    return initial;
  });
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>(() =>
    Object.fromEntries(students.map((s) => [s.studentId, s.feedback]))
  );
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const selectedStudent = students.find((s) => s.studentId === selectedId) ?? students[0];
  const answerByQuestion = useMemo(() => {
    const map = new Map<string, string | null>();
    selectedStudent?.answers.forEach((a) => map.set(a.questionId, a.answerText));
    return map;
  }, [selectedStudent]);

  const studentGrades = selectedStudent ? gradeState[selectedStudent.studentId] : undefined;
  const totals = useMemo(() => {
    if (!studentGrades) return { earned: 0, possible: 0 };
    return Object.values(studentGrades).reduce(
      (acc, g) => ({ earned: acc.earned + g.pointsEarned, possible: acc.possible + g.pointsPossible }),
      { earned: 0, possible: 0 }
    );
  }, [studentGrades]);
  const percentage = computePercentage(totals.earned, totals.possible);

  const key = (studentId: string, questionId: string) => `${studentId}:${questionId}`;

  const saveGrade = (studentId: string, questionId: string, next: Partial<GradeState>) => {
    setGradeState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [questionId]: { ...prev[studentId][questionId], ...next, needsReview: false } }
    }));

    const k = key(studentId, questionId);
    setSaveStatus((prev) => ({ ...prev, [k]: "saving" }));
    clearTimeout(timers.current[k]);
    timers.current[k] = setTimeout(async () => {
      const submission = students.find((s) => s.studentId === studentId)?.submission;
      if (!submission) return;
      const current = { ...gradeState[studentId][questionId], ...next };
      try {
        const result = await upsertGrade({
          assignmentId,
          submissionId: submission.id,
          questionId,
          pointsEarned: current.pointsEarned,
          pointsPossible: current.pointsPossible,
          comment: current.comment
        });
        setGradeState((prev) => ({
          ...prev,
          [studentId]: { ...prev[studentId], [questionId]: { ...prev[studentId][questionId], gradeId: result.gradeId, canUndo: result.canUndo } }
        }));
        setSaveStatus((prev) => ({ ...prev, [k]: "saved" }));
      } catch {
        setSaveStatus((prev) => ({ ...prev, [k]: "idle" }));
      }
    }, 500);
  };

  const undo = async (studentId: string, questionId: string) => {
    const g = gradeState[studentId][questionId];
    if (!g.gradeId) return;
    const restored = await undoLastGradeChange(g.gradeId);
    setGradeState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [questionId]: { ...prev[studentId][questionId], pointsEarned: restored.pointsEarned, pointsPossible: restored.pointsPossible, comment: restored.comment ?? "" }
      }
    }));
  };

  const saveFeedback = (studentId: string, submissionId: string, comment: string) => {
    setFeedbackState((prev) => ({ ...prev, [studentId]: comment }));
    const k = `feedback:${studentId}`;
    setSaveStatus((prev) => ({ ...prev, [k]: "saving" }));
    clearTimeout(timers.current[k]);
    timers.current[k] = setTimeout(async () => {
      try {
        await setSubmissionFeedback(submissionId, comment);
        setSaveStatus((prev) => ({ ...prev, [k]: "saved" }));
      } catch {
        setSaveStatus((prev) => ({ ...prev, [k]: "idle" }));
      }
    }, 600);
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr]">
      <Card className="flex min-h-0 flex-col overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold text-slate-500">STUDENTS ({students.length})</div>
        <div className="flex-1 overflow-y-auto">
          {students.map((s) => {
            const g = gradeState[s.studentId];
            const totalsForStudent = Object.values(g).reduce((acc, x) => ({ earned: acc.earned + x.pointsEarned, possible: acc.possible + x.pointsPossible }), { earned: 0, possible: 0 });
            const pct = computePercentage(totalsForStudent.earned, totalsForStudent.possible);
            const needsReview = Object.values(g).some((x) => x.needsReview);
            return (
              <button
                key={s.studentId}
                onClick={() => setSelectedId(s.studentId)}
                className={cn(
                  "flex w-full items-center gap-2.5 border-b border-slate-50 px-4 py-2.5 text-left text-sm",
                  selectedId === s.studentId ? "bg-brand-50" : "hover:bg-slate-50"
                )}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{initials(s.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800">{s.name}</span>
                  <span className="block text-xs text-slate-400">
                    {!s.submission ? "Not submitted" : s.submission.status === "not_started" ? "Not started" : `${pct ?? 0}%`}
                  </span>
                </span>
                {needsReview && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-violet-500" />}
                {s.submission?.isLate && <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex min-h-0 flex-col overflow-hidden">
        {!selectedStudent || !selectedStudent.submission ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-400">
            {selectedStudent?.name} hasn&apos;t submitted this assignment yet.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedStudent.name}</p>
                <p className="text-xs text-slate-500">
                  Submitted {formatDateTime(selectedStudent.submission.submittedAt)}
                  {selectedStudent.submission.isLate && (
                    <Badge tone="amber" className="ml-1.5">
                      Late
                    </Badge>
                  )}
                </p>
              </div>
              <ColorBadge colorClasses={letterGradeColor(letterGrade(percentage))}>
                {totals.earned}/{totals.possible} · {percentage !== null ? `${percentage}%` : "—"} · {letterGrade(percentage)}
              </ColorBadge>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {questions.map((q, i) => {
                const g = gradeState[selectedStudent.studentId][q.id];
                const answer = answerByQuestion.get(q.id);
                const k = key(selectedStudent.studentId, q.id);
                const status = saveStatus[k];
                const isFull = g.pointsEarned >= g.pointsPossible && g.pointsPossible > 0;
                const isZero = g.pointsEarned <= 0;
                return (
                  <div key={q.id} className={cn("rounded-lg border p-4", g.needsReview ? "border-violet-300 bg-violet-50/40" : "border-slate-200")}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-800">
                        <span className="font-medium text-slate-500">{i + 1}.</span> {q.text}
                      </p>
                      <span className="shrink-0 text-xs font-medium text-slate-500">/{q.pointValue} pts</span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-md bg-slate-50 px-3 py-2 text-xs">
                        <span className="text-slate-400">Student answer: </span>
                        <span className="font-mono text-slate-700">{answer || "(blank)"}</span>
                      </div>
                      {q.correctAnswer && (
                        <div className="rounded-md bg-slate-50 px-3 py-2 text-xs">
                          <span className="text-slate-400">Answer key: </span>
                          <span className="font-mono text-slate-700">{q.correctAnswer}</span>
                        </div>
                      )}
                    </div>

                    {g.needsReview && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-medium text-violet-700">
                        <Sparkles className="h-3.5 w-3.5" /> Needs teacher review — couldn&apos;t safely auto-grade this answer.
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isFull ? "primary" : "outline"}
                        onClick={() => saveGrade(selectedStudent.studentId, q.id, { pointsEarned: q.pointValue, pointsPossible: q.pointValue })}
                      >
                        <Check className="h-3.5 w-3.5" /> Full credit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isZero ? "danger" : "outline"}
                        onClick={() => saveGrade(selectedStudent.studentId, q.id, { pointsEarned: 0, pointsPossible: q.pointValue })}
                      >
                        <X className="h-3.5 w-3.5" /> Zero
                      </Button>
                      <div className="flex items-center gap-1.5">
                        <Label className="mb-0 text-xs text-slate-400">Points:</Label>
                        <Input
                          type="number"
                          min={0}
                          max={q.pointValue}
                          step="0.5"
                          value={g.pointsEarned}
                          onChange={(e) => saveGrade(selectedStudent.studentId, q.id, { pointsEarned: Number(e.target.value), pointsPossible: q.pointValue })}
                          className="h-8 w-20"
                        />
                      </div>
                      {g.canUndo && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => undo(selectedStudent.studentId, q.id)}>
                          <RotateCcw className="h-3.5 w-3.5" /> Undo
                        </Button>
                      )}
                      <span className="ml-auto text-xs text-slate-400">{status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}</span>
                    </div>

                    <Input
                      placeholder="Add a comment for the student…"
                      value={g.comment}
                      onChange={(e) => saveGrade(selectedStudent.studentId, q.id, { comment: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-100 px-5 py-3">
              <Label>Overall feedback</Label>
              <Textarea
                rows={2}
                placeholder="Great improvement on fractions this week!"
                value={feedbackState[selectedStudent.studentId] ?? ""}
                onChange={(e) => saveFeedback(selectedStudent.studentId, selectedStudent.submission!.id, e.target.value)}
              />
              <span className="text-xs text-slate-400">{saveStatus[`feedback:${selectedStudent.studentId}`] === "saving" ? "Saving…" : saveStatus[`feedback:${selectedStudent.studentId}`] === "saved" ? "Saved" : ""}</span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
