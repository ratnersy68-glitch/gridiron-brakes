"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { requestPasswordReset, type AuthFormState } from "../actions";
import { FormField, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthFormState = {};

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">We&apos;ll email you a link to choose a new password.</p>

      <form action={formAction} className="mt-6 space-y-4">
        <FormField label="Email">
          <Input type="email" name="email" placeholder="you@school.edu" required autoComplete="email" />
        </FormField>

        {state.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>}
        {state.success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>}

        <SubmitButton>Send reset link</SubmitButton>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        <Link href="/login" className="text-brand-600 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
