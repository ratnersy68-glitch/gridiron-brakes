"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input, Label, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { DifficultyLevel, Topic } from "@/types/database";
import type { AssignmentInput, QuestionInput } from "@/app/(teacher)/assignments/actions";

const DIFFICULTIES: DifficultyLevel[] = ["easy", "medium", "hard"];

function emptyQuestion(): QuestionInput {
  return {
    question_text: "",
    point_value: 1,
    correct_answer: "",
    explanation: "",
    topic_id: null,
    difficulty: "medium",
    answer_type: "auto"
  };
}

export function AssignmentForm({
  classes,
  topics,
  defaultClassId,
  initial,
  onSubmit,
  submitLabel
}: {
  classes: { id: string; name: string }[];
  topics: Topic[];
  defaultClassId?: string;
  initial?: Partial<AssignmentInput>;
  onSubmit: (input: AssignmentInput) => Promise<unknown>;
  submitLabel: string;
}) {
  const [classId, setClassId] = useState(initial?.classId ?? defaultClassId ?? classes[0]?.id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [dateAssigned, setDateAssigned] = useState(initial?.dateAssigned ?? new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [topicId, setTopicId] = useState<string | null>(initial?.topicId ?? topics[0]?.id ?? null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initial?.difficulty ?? "medium");
  const [status, setStatus] = useState<AssignmentInput["status"]>(initial?.status ?? "draft");
  const [questions, setQuestions] = useState<QuestionInput[]>(initial?.questions?.length ? initial.questions : [emptyQuestion()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.point_value) || 0), 0);

  const updateQuestion = (index: number, patch: Partial<QuestionInput>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (index: number) => setQuestions((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!classId) return setError("Please select a class.");
    if (!name.trim()) return setError("Assignment name is required.");
    const cleanQuestions = questions.filter((q) => q.question_text.trim().length > 0);
    if (cleanQuestions.length === 0) return setError("Add at least one question.");

    startTransition(async () => {
      try {
        await onSubmit({ classId, name, dateAssigned, dueDate, instructions, topicId, difficulty, status, questions: cleanQuestions });
      } catch (err) {
        const digest = (err as { digest?: string } | null)?.digest;
        if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw err;
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        show(message, "error");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assignment details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Assignment name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fractions Quiz #1" required />
          </FormField>
          <FormField label="Class">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} required>
              <option value="" disabled>
                Select a class
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Date assigned">
            <Input type="date" value={dateAssigned} onChange={(e) => setDateAssigned(e.target.value)} />
          </FormField>
          <FormField label="Due date">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>
          <FormField label="Math topic">
            <Select value={topicId ?? ""} onChange={(e) => setTopicId(e.target.value || null)}>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Difficulty">
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d} className="capitalize">
                  {d}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Instructions" hint="Shown to students at the top of the assignment.">
              <Textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Show your work for full credit…" />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus("draft")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${status === "draft" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-600"}`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setStatus("published")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${status === "published" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 text-slate-600"}`}
              >
                Published (visible to students)
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <span className="text-xs font-medium text-slate-500">{totalPoints} total points</span>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <GripVertical className="h-3.5 w-3.5 text-slate-300" /> Question {i + 1}
                </span>
                <button type="button" onClick={() => removeQuestion(i)} className="text-slate-400 hover:text-rose-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <FormField label="Question text">
                    <Textarea rows={2} value={q.question_text} onChange={(e) => updateQuestion(i, { question_text: e.target.value })} placeholder="What is 2/4 written in simplest form?" />
                  </FormField>
                </div>
                <div className="sm:col-span-1">
                  <FormField label="Points">
                    <Input type="number" min={0} step="0.5" value={q.point_value} onChange={(e) => updateQuestion(i, { point_value: Number(e.target.value) })} />
                  </FormField>
                </div>
                <div className="sm:col-span-2">
                  <FormField label="Correct answer" hint="Used for auto-grading">
                    <Input value={q.correct_answer} onChange={(e) => updateQuestion(i, { correct_answer: e.target.value })} placeholder="1/2" />
                  </FormField>
                </div>
                <div className="sm:col-span-1">
                  <FormField label="Topic">
                    <Select value={q.topic_id ?? ""} onChange={(e) => updateQuestion(i, { topic_id: e.target.value || null })}>
                      <option value="">—</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
                <div className="sm:col-span-1">
                  <FormField label="Difficulty">
                    <Select value={q.difficulty} onChange={(e) => updateQuestion(i, { difficulty: e.target.value as DifficultyLevel })}>
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
                <div className="sm:col-span-1">
                  <FormField label="Grading">
                    <Select value={q.answer_type} onChange={(e) => updateQuestion(i, { answer_type: e.target.value as "auto" | "manual" })}>
                      <option value="auto">Auto-check</option>
                      <option value="manual">Teacher review</option>
                    </Select>
                  </FormField>
                </div>
                <div className="sm:col-span-6">
                  <FormField label="Explanation (optional)" hint="Shown to students as feedback once graded.">
                    <Input value={q.explanation} onChange={(e) => updateQuestion(i, { explanation: e.target.value })} placeholder="Divide numerator and denominator by their GCF." />
                  </FormField>
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}>
            <Plus className="h-3.5 w-3.5" /> Add question
          </Button>
        </CardContent>
      </Card>

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
