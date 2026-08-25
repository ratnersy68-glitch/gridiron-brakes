# Gridiron Grading — Math Teacher Grading App

A full-stack app for a math teacher to create classes, add students, build assignments with a question bank, grade fast (with math-aware auto-grading), track a gradebook, and see analytics on which topics students are struggling with. Students get their own portal to join a class, submit work, and track their grades and progress.

## Tech stack

- **Next.js 14** (App Router, Server Actions) + **TypeScript**
- **Tailwind CSS**
- **Supabase** (Postgres + Auth + Row Level Security)
- **Recharts** for charts, **mathjs** for math-equivalence answer checking

## Getting started

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Apply the schema.** In the Supabase SQL editor (or via the Supabase CLI), run the migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_student_review.sql`
3. **Configure environment variables.** Copy `.env.example` to `.env.local` and fill in your project's URL, anon key, and service role key (Project Settings → API).
4. **Install dependencies and run the app:**
   ```bash
   npm install
   npm run dev
   ```
5. **(Optional) Seed demo data.** Populates a demo teacher, 8 students, 2 classes, and several graded assignments so the app looks populated:
   ```bash
   npm run seed
   ```
   This creates `teacher@demo.school` and `student1@demo.school` … `student8@demo.school`, all with the password `Password123!`.

## How it fits together

- **Auth** — Supabase Auth with email/password. Signup collects a `role` (`teacher` or `student`) that a database trigger (`handle_new_user`) uses to create matching `profiles`/`teachers`/`students` rows automatically. Middleware (`src/middleware.ts`) protects `/dashboard`, `/classes`, `/assignments`, `/gradebook`, `/students`, `/analytics`, `/settings` for teachers and `/student/*` for students, and redirects each role away from the other's routes.
- **Database & RLS** — every table in `supabase/migrations/0001_init.sql` has Row Level Security enabled. Teachers can only read/write their own classes, assignments, and grades; students can only read their own submissions/grades and can never write to `grades` directly. A student joining a class by code goes through the `join_class_by_code` RPC rather than direct table access, and a student's own view of question sets goes through `get_assignment_questions` / `get_graded_submission_review` so answer keys are never exposed before an assignment is graded.
- **Math-aware auto-grading** — `src/lib/math/equivalence.ts` uses `mathjs` to check whether a student's answer is *mathematically* equivalent to the answer key (e.g. `2/4` ≡ `1/2`, `x+x` ≡ `2x`, `50%` ≡ `1/2`), not a string match. Anything it can't safely evaluate is routed to **Needs Teacher Review** instead of being guessed at. This runs automatically when a student submits (`src/lib/grading/auto-grade.ts`), and the teacher can freely override any grade in the grading UI.
- **Grading UI** (`/assignments/[id]/grade`) — a Student → Question → Answer → Points grid with full/zero/partial credit, autosave (debounced writes on every change), comments, and one-level undo backed by a `grade_history` table populated by a database trigger.
- **Gradebook, Analytics, Student portal** — see the sidebar. The gradebook supports sort/filter/search and CSV export; analytics surfaces class/topic/assignment averages, score distribution, and automatically flags topics averaging under 70%.

## Project structure

```
src/
  app/
    (auth)/            sign in, sign up, password reset
    (teacher)/          dashboard, classes, assignments, gradebook, students, analytics, settings
    student/            student portal
  components/           reusable UI, layout, charts, feature-specific components
  lib/
    supabase/           browser/server/middleware/admin Supabase clients
    math/                answer-equivalence engine + grade/letter helpers
    grading/             auto-grade-on-submit logic
supabase/
  migrations/           SQL schema, RLS policies, triggers, RPCs
scripts/
  seed.mjs               demo data generator
```
