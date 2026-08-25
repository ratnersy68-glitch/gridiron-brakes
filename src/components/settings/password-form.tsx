"use client";

import { useFormState } from "react-dom";
import { FormField, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";
import { changePassword, type SettingsFormState } from "@/app/(teacher)/settings/actions";

const initialState: SettingsFormState = {};

export function PasswordForm() {
  const [state, formAction] = useFormState(changePassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="New password" hint="At least 8 characters.">
        <Input type="password" name="password" required minLength={8} autoComplete="new-password" />
      </FormField>
      <FormField label="Confirm new password">
        <Input type="password" name="confirm_password" required minLength={8} autoComplete="new-password" />
      </FormField>
      {state.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>}
      {state.success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>}
      <SubmitButton className="w-auto">Update password</SubmitButton>
    </form>
  );
}
