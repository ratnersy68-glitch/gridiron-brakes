"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signIn, type AuthFormState } from "../actions";
import { FormField, Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthFormState = {};

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, initialState);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Log in to your teacher or student account.</p>

      <form action={formAction} className="mt-6 space-y-4">
        <FormField label="Email">
          <Input type="email" name="email" placeholder="you@school.edu" required autoComplete="email" />
        </FormField>
        <FormField label="Password">
          <Input type="password" name="password" placeholder="••••••••" required autoComplete="current-password" />
        </FormField>

        {state.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>}

        <SubmitButton>Log in</SubmitButton>
      </form>

      <div className="mt-4 flex items-center justify-between text-xs">
        <Link href="/reset-password" className="text-brand-600 hover:underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-slate-500 hover:underline">
          Create an account
        </Link>
      </div>

      <div className="mt-4 border-t border-slate-100" />
      <p className="mt-4 text-xs text-slate-400">
        <Label className="mb-0 inline text-xs font-normal text-slate-400">Demo accounts (after seeding): </Label>
        teacher@demo.school / student1@demo.school — password <code className="rounded bg-slate-100 px-1">Password123!</code>
      </p>
    </div>
  );
}
