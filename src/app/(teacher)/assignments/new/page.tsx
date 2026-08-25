import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { createAssignment } from "../actions";
import type { Topic } from "@/types/database";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewAssignmentPage({ searchParams }: { searchParams: { classId?: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: classes }, { data: topics }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("teacher_id", user.id).eq("archived", false).order("name"),
    supabase.from("topics").select("*").order("sort_order").returns<Topic[]>()
  ]);

  if (!classes || classes.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Create a class first"
        description="You need at least one class before you can create an assignment."
        action={
          <Link href="/classes">
            <Button>Go to classes</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">New assignment</h2>
        <p className="text-sm text-slate-500">Add questions with an answer key so grading can happen automatically where possible.</p>
      </div>
      <AssignmentForm classes={classes} topics={topics ?? []} defaultClassId={searchParams.classId} onSubmit={createAssignment} submitLabel="Create assignment" />
    </div>
  );
}
