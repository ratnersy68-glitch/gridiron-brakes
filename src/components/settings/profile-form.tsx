"use client";

import { useFormState } from "react-dom";
import { FormField, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";
import { updateProfile, type SettingsFormState } from "@/app/(teacher)/settings/actions";

const initialState: SettingsFormState = {};

export function ProfileForm({ fullName, email, school }: { fullName: string; email: string; school: string }) {
  const [state, formAction] = useFormState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="Email">
        <Input value={email} disabled />
        <p className="mt-1 text-xs text-slate-400">Contact support to change your email address.</p>
      </FormField>
      <FormField label="Full name">
        <Input name="full_name" defaultValue={fullName} required />
      </FormField>
      <FormField label="School (optional)">
        <Input name="school" defaultValue={school} placeholder="Lincoln Middle School" />
      </FormField>
      {state.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>}
      {state.success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>}
      <SubmitButton className="w-auto">Save profile</SubmitButton>
    </form>
  );
}
