"use client";

import { useFormState } from "react-dom";
import { KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";
import { joinClassByCode, type JoinClassState } from "../actions";

const initialState: JoinClassState = {};

export default function JoinClassPage() {
  const [state, formAction] = useFormState(joinClassByCode, initialState);

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <KeyRound className="h-4 w-4 text-brand-600" /> Join a class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <FormField label="Class code" hint="Ask your teacher for the 6-character code.">
              <Input name="code" placeholder="ABC123" required maxLength={8} className="text-center font-mono text-lg uppercase tracking-widest" />
            </FormField>
            {state.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>}
            {state.success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>}
            <SubmitButton>Join class</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
