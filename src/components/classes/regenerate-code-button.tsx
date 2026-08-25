"use client";

import { RefreshCw } from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { regenerateClassCode } from "@/app/(teacher)/classes/actions";

export function RegenerateCodeButton({ classId }: { classId: string }) {
  return (
    <ConfirmButton
      label={
        <>
          <RefreshCw className="h-3 w-3" /> New code
        </>
      }
      size="sm"
      variant="ghost"
      className="text-xs text-slate-500"
      title="Generate a new class code?"
      description="The old code will stop working immediately. Students who haven't joined yet will need the new code."
      confirmLabel="Generate new code"
      successMessage="Class code updated"
      onConfirm={() => regenerateClassCode(classId)}
    />
  );
}
