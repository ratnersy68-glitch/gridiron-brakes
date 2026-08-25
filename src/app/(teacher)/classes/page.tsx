import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, BookOpen, Users, Archive, ArrowUpFromLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormModalButton } from "@/components/ui/form-modal";
import { FormField, Input } from "@/components/ui/input";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { createClass, setClassArchived } from "./actions";
import type { ClassRow, SubmissionScore } from "@/types/database";
import { round1 } from "@/lib/utils";
import { percentageColor } from "@/lib/math/grading";

export const dynamic = "force-dynamic";

export default async function ClassesPage({ searchParams }: { searchParams: { view?: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const showArchived = searchParams.view === "archived";

  const { data: classes } = await supabase
    .from("classes")
    .select("id, teacher_id, name, subject, class_code, archived, created_at, updated_at")
    .eq("teacher_id", user.id)
    .eq("archived", showArchived)
    .order("created_at", { ascending: false })
    .returns<ClassRow[]>();

  const classIds = (classes ?? []).map((c) => c.id);

  const [{ data: members }, { data: scores }] = await Promise.all([
    classIds.length ? supabase.from("class_members").select("class_id, student_id").in("class_id", classIds) : Promise.resolve({ data: [] }),
    classIds.length ? supabase.from("submission_scores").select("*").in("class_id", classIds).returns<SubmissionScore[]>() : Promise.resolve({ data: [] })
  ]);

  const memberCountByClass = new Map<string, number>();
  (members ?? []).forEach((m) => memberCountByClass.set(m.class_id, (memberCountByClass.get(m.class_id) ?? 0) + 1));

  const scoresByClass = new Map<string, number[]>();
  (scores ?? []).forEach((s) => {
    if (s.percentage === null) return;
    if (!scoresByClass.has(s.class_id)) scoresByClass.set(s.class_id, []);
    scoresByClass.get(s.class_id)!.push(s.percentage);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
          <Link href="/classes" className={`rounded-md px-3 py-1.5 font-medium ${!showArchived ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
            Active
          </Link>
          <Link href="/classes?view=archived" className={`rounded-md px-3 py-1.5 font-medium ${showArchived ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
            Archived
          </Link>
        </div>
        {!showArchived && (
          <FormModalButton
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New Class
              </Button>
            }
            title="Create a class"
            description="You can add students and generate a class code afterward."
            action={createClass}
            submitLabel="Create class"
            successMessage="Class created"
          >
            <FormField label="Class name">
              <Input name="name" placeholder="Algebra 1 — Period 2" required autoFocus />
            </FormField>
            <FormField label="Subject">
              <Input name="subject" placeholder="Math" defaultValue="Math" />
            </FormField>
          </FormModalButton>
        )}
      </div>

      {(classes ?? []).length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={showArchived ? "No archived classes" : "No classes yet"}
          description={showArchived ? undefined : "Create a class to start adding students and assignments."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes!.map((c) => {
            const pcts = scoresByClass.get(c.id) ?? [];
            const avg = pcts.length ? round1(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
            return (
              <Card key={c.id} className="flex flex-col">
                <CardContent className="flex-1 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/classes/${c.id}`} className="text-sm font-semibold text-slate-900 hover:text-brand-600">
                        {c.name}
                      </Link>
                      <p className="text-xs text-slate-500">{c.subject}</p>
                    </div>
                    <Badge tone="brand">{c.class_code}</Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {memberCountByClass.get(c.id) ?? 0} students
                    </span>
                    {avg !== null && <span className={`font-medium ${percentageColor(avg)}`}>{avg}% avg</span>}
                  </div>
                </CardContent>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
                  <Link href={`/classes/${c.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                    View class
                  </Link>
                  {!c.archived ? (
                    <ConfirmButton
                      label={
                        <>
                          <Archive className="h-3.5 w-3.5" /> Archive
                        </>
                      }
                      size="sm"
                      title={`Archive ${c.name}?`}
                      description="Students will no longer see this class, but grades are preserved. You can unarchive anytime."
                      confirmLabel="Archive class"
                      successMessage="Class archived"
                      onConfirm={setClassArchived.bind(null, c.id, true)}
                    />
                  ) : (
                    <ConfirmButton
                      label={
                        <>
                          <ArrowUpFromLine className="h-3.5 w-3.5" /> Unarchive
                        </>
                      }
                      size="sm"
                      title={`Unarchive ${c.name}?`}
                      confirmLabel="Unarchive"
                      successMessage="Class restored"
                      onConfirm={setClassArchived.bind(null, c.id, false)}
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
