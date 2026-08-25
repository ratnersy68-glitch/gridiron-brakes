"use client";

import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { setAssignmentStatus } from "@/app/(teacher)/assignments/actions";
import type { AssignmentStatus } from "@/types/database";

export function PublishToggle({ assignmentId, status }: { assignmentId: string; status: AssignmentStatus }) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const toggle = () => {
    const next: AssignmentStatus = status === "published" ? "draft" : "published";
    startTransition(async () => {
      try {
        await setAssignmentStatus(assignmentId, next);
        show(next === "published" ? "Assignment published to students" : "Assignment unpublished");
      } catch (e) {
        show(e instanceof Error ? e.message : "Failed to update", "error");
      }
    });
  };

  return (
    <Button variant="outline" loading={pending} onClick={toggle}>
      {status === "published" ? (
        <>
          <EyeOff className="h-3.5 w-3.5" /> Unpublish
        </>
      ) : (
        <>
          <Eye className="h-3.5 w-3.5" /> Publish
        </>
      )}
    </Button>
  );
}
