"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signUp, type AuthFormState } from "../actions";
import { FormField, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: AuthFormState = {};

export default function SignupPage() {
  const [state, formAction] = useFormState(signUp, initialState);
  const [role, setRole] = useState<"teacher" | "student">("teacher");

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Set up a teacher or student account to get started.</p>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        {(["teacher", "student"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "rounded-md py-1.5 text-sm font-medium capitalize transition-colors",
              role === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="role" value={role} />
        <FormField label="Full name">
          <Input name="full_name" placeholder={role === "teacher" ? "Ms. Rivera" : "Jordan Lee"} required autoComplete="name" />
        </FormField>
        <FormField label="Email">
          <Input type="email" name="email" placeholder="you@school.edu" required autoComplete="email" />
        </FormField>
        <FormField label="Password" hint="At least 8 characters.">
          <Input type="password" name="password" placeholder="••••••••" required minLength={8} autoComplete="new-password" />
        </FormField>

        {state.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>}
        {state.success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>}

        <SubmitButton>Create {role} account</SubmitButton>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
