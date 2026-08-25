"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { saveAnswer, submitAssignment } from "@/app/student/actions";
import type { StudentQuestion } from "@/types/database";

export function AssignmentTaker({
  assignmentId,
  questions,
  initialAnswers
}: {
  assignmentId: string;
  questions: StudentQuestion[];
  initialAnswers: Record<string, string>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [saveStatus, setSaveStatus] = useState<Record<string, "saving" | "saved">>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const router = useRouter();
  const { show } = useToast();

  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;

  const onChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    clearTimeout(timers.current[questionId]);
    setSaveStatus((prev) => ({ ...prev, [questionId]: "saving" }));
    timers.current[questionId] = setTimeout(async () => {
      try {
        await saveAnswer(assignmentId, questionId, value);
        setSaveStatus((prev) => ({ ...prev, [questionId]: "saved" }));
      } catch {
        // Autosave failures are silent by design — the student's typed value
        // stays in local state and the next keystroke retries the save.
      }
    }, 600);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitAssignment(assignmentId);
      setConfirmOpen(false);
      show("Assignment submitted!");
      router.refresh();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to submit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-800">
                <span className="font-medium text-slate-500">{i + 1}.</span> {q.question_text}
              </p>
              <span className="shrink-0 text-xs font-medium text-slate-500">{q.point_value} pts</span>
            </div>
            <Textarea
              rows={2}
              className="mt-2"
              placeholder="Type your answer…"
              value={answers[q.id] ?? ""}
              onChange={(e) => onChange(q.id, e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">{saveStatus[q.id] === "saving" ? "Saving…" : saveStatus[q.id] === "saved" ? "Saved" : " "}</p>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-lg">
        <p className="text-xs text-slate-500">
          {answeredCount} of {questions.length} answered
        </p>
        <Button onClick={() => setConfirmOpen(true)}>
          <Send className="h-3.5 w-3.5" /> Submit assignment
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Submit this assignment?" description="You won't be able to change your answers after submitting." size="sm">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Keep working
          </Button>
          <Button loading={submitting} onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </Modal>
    </>
  );
}
