"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "outline",
  onConfirm,
  successMessage,
  ...props
}: {
  label: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  successMessage?: string;
} & Omit<ButtonProps, "onClick">) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <>
      <Button type="button" variant={variant} onClick={() => setOpen(true)} {...props}>
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} description={description} size="sm">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await onConfirm();
                  if (successMessage) show(successMessage);
                  setOpen(false);
                } catch (e) {
                  show(e instanceof Error ? e.message : "Something went wrong", "error");
                }
              })
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </Modal>
    </>
  );
}
