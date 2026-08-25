"use client";

import { useFormState } from "react-dom";
import { updatePassword, type AuthFormState } from "../actions";
import { FormField, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthFormState = {};

export default function UpdatePasswordPage() {
  const [state, formAction] = useFormState(updatePassword, initialState);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Choose a new password</h1>
      <p className="mt-1 text-sm text-slate-500">Enter and confirm your new password below.</p>

      <form action={formAction} className="mt-6 space-y-4">
        <FormField label="New password" hint="At least 8 characters.">
          <Input type="password" name="password" placeholder="••••••••" required minLength={8} autoComplete="new-password" />
        </FormField>
        <FormField label="Confirm password">
          <Input type="password" name="confirm_password" placeholder="••••••••" required minLength={8} autoComplete="new-password" />
        </FormField>

        {state.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>}

        <SubmitButton>Update password</SubmitButton>
      </form>
    </div>
  );
}
