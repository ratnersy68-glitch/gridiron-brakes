"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Copy, Trash2, ClipboardCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { duplicateAssignment, deleteAssignment } from "@/app/(teacher)/assignments/actions";

export function AssignmentRowActions({ assignmentId }: { assignmentId: string }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  return (
    <div className="relative inline-block text-left">
      <button onClick={() => setOpen((v) => !v)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
            <Link href={`/assignments/${assignmentId}/grade`} className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50" onClick={() => setOpen(false)}>
              <ClipboardCheck className="h-3.5 w-3.5" /> Grade
            </Link>
            <Link href={`/assignments/${assignmentId}/edit`} className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50" onClick={() => setOpen(false)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    const newId = await duplicateAssignment(assignmentId);
                    show("Assignment duplicated");
                    setOpen(false);
                    router.push(`/assignments/${newId}/edit`);
                  } catch (e) {
                    show(e instanceof Error ? e.message : "Failed to duplicate", "error");
                  }
                })
              }
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50"
            >
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            ) : (
              <button
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await deleteAssignment(assignmentId);
                      show("Assignment deleted");
                      setOpen(false);
                    } catch (e) {
                      show(e instanceof Error ? e.message : "Failed to delete", "error");
                    }
                  })
                }
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Confirm delete?
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
