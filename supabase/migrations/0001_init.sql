-- ============================================================================
-- Gridiron Brakes — Math Teacher Grading App
-- Initial schema: tables, indexes, functions, triggers, and Row Level Security
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('teacher', 'student');
create type difficulty_level as enum ('easy', 'medium', 'hard');
create type assignment_status as enum ('draft', 'published');
create type submission_status as enum ('not_started', 'in_progress', 'submitted', 'graded', 'missing');

-- ---------------------------------------------------------------------------
-- Core identity tables
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table teachers (
  id uuid primary key references profiles(id) on delete cascade,
  school text,
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key references profiles(id) on delete cascade,
  grade_level text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
create table topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- Classes & rosters
-- ---------------------------------------------------------------------------
create table classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  name text not null,
  subject text not null default 'Math',
  class_code text not null unique,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index classes_teacher_id_idx on classes(teacher_id);
create index classes_class_code_idx on classes(class_code);

create table class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (class_id, student_id)
);
create index class_members_class_id_idx on class_members(class_id);
create index class_members_student_id_idx on class_members(student_id);

-- ---------------------------------------------------------------------------
-- Assignments & questions
-- ---------------------------------------------------------------------------
create table assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  name text not null,
  date_assigned date not null default current_date,
  due_date date,
  total_points numeric not null default 0,
  instructions text,
  topic_id uuid references topics(id),
  difficulty difficulty_level not null default 'medium',
  status assignment_status not null default 'draft',
  has_answer_key boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assignments_class_id_idx on assignments(class_id);
create index assignments_due_date_idx on assignments(due_date);

create table questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  order_index int not null default 0,
  question_text text not null,
  point_value numeric not null default 1,
  correct_answer text,
  explanation text,
  topic_id uuid references topics(id),
  difficulty difficulty_level not null default 'medium',
  answer_type text not null default 'auto',
  created_at timestamptz not null default now()
);
create index questions_assignment_id_idx on questions(assignment_id);

-- ---------------------------------------------------------------------------
-- Submissions, answers, grades, feedback
-- ---------------------------------------------------------------------------
create table submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status submission_status not null default 'not_started',
  is_late boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index submissions_assignment_id_idx on submissions(assignment_id);
create index submissions_student_id_idx on submissions(student_id);

create table student_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  answer_text text,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (submission_id, question_id)
);
create index student_answers_submission_id_idx on student_answers(submission_id);
create index student_answers_question_id_idx on student_answers(question_id);

create table grades (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  points_earned numeric not null default 0,
  points_possible numeric not null default 0,
  is_correct boolean,
  needs_review boolean not null default false,
  auto_graded boolean not null default false,
  is_override boolean not null default false,
  comment text,
  graded_by uuid references teachers(id),
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, question_id)
);
create index grades_submission_id_idx on grades(submission_id);
create index grades_question_id_idx on grades(question_id);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  comment text not null,
  created_by uuid references teachers(id),
  created_at timestamptz not null default now()
);
create index feedback_submission_id_idx on feedback(submission_id);

-- ---------------------------------------------------------------------------
-- Grade change history (undo support)
-- ---------------------------------------------------------------------------
create table grade_history (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references grades(id) on delete cascade,
  points_earned numeric,
  points_possible numeric,
  is_correct boolean,
  comment text,
  changed_by uuid references teachers(id),
  changed_at timestamptz not null default now()
);
create index grade_history_grade_id_idx on grade_history(grade_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles for each row execute function set_updated_at();
create trigger trg_classes_updated_at before update on classes for each row execute function set_updated_at();
create trigger trg_assignments_updated_at before update on assignments for each row execute function set_updated_at();
create trigger trg_submissions_updated_at before update on submissions for each row execute function set_updated_at();
create trigger trg_grades_updated_at before update on grades for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- New auth user -> profile/teacher/student bootstrap
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role text := coalesce(new.raw_user_meta_data->>'role', 'student');
  _name text := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
begin
  insert into profiles (id, role, full_name, email)
  values (new.id, _role::user_role, _name, new.email)
  on conflict (id) do nothing;

  if _role = 'teacher' then
    insert into teachers (id) values (new.id) on conflict (id) do nothing;
  else
    insert into students (id) values (new.id) on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Late-submission trigger
-- ---------------------------------------------------------------------------
create or replace function set_submission_late()
returns trigger
language plpgsql
as $$
declare
  _due date;
begin
  if new.status = 'submitted' and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    if new.submitted_at is null then
      new.submitted_at := now();
    end if;
    select due_date into _due from assignments where id = new.assignment_id;
    if _due is not null and new.submitted_at::date > _due then
      new.is_late := true;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_submission_late_ins
before insert on submissions
for each row execute function set_submission_late();

create trigger trg_submission_late_upd
before update on submissions
for each row execute function set_submission_late();

-- Auto-flip a submission to 'graded' once every question has a graded row,
-- and record grade history for undo support.
create or replace function sync_submission_status()
returns trigger
language plpgsql
as $$
declare
  _submission_id uuid := coalesce(new.submission_id, old.submission_id);
  _assignment_id uuid;
  _total_questions int;
  _graded_questions int;
begin
  select assignment_id into _assignment_id from submissions where id = _submission_id;
  select count(*) into _total_questions from questions where assignment_id = _assignment_id;
  select count(*) into _graded_questions
    from grades where submission_id = _submission_id and graded_at is not null;

  if _total_questions > 0 and _graded_questions >= _total_questions then
    update submissions set status = 'graded' where id = _submission_id and status <> 'graded';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_grades_sync_status
after insert or update or delete on grades
for each row execute function sync_submission_status();

create or replace function record_grade_history()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and (
    old.points_earned is distinct from new.points_earned
    or old.comment is distinct from new.comment
    or old.is_correct is distinct from new.is_correct
  ) then
    insert into grade_history (grade_id, points_earned, points_possible, is_correct, comment, changed_by)
    values (old.id, old.points_earned, old.points_possible, old.is_correct, old.comment, new.graded_by);
  end if;
  return new;
end;
$$;

create trigger trg_grades_history
before update on grades
for each row execute function record_grade_history();

-- ---------------------------------------------------------------------------
-- Ownership helper functions (used throughout RLS policies)
-- ---------------------------------------------------------------------------
create or replace function is_teacher_of_class(_class_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes c where c.id = _class_id and c.teacher_id = auth.uid());
$$;

create or replace function is_student_of_class(_class_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from class_members cm where cm.class_id = _class_id and cm.student_id = auth.uid());
$$;

create or replace function is_teacher_of_assignment(_assignment_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from assignments a
    join classes c on c.id = a.class_id
    where a.id = _assignment_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function is_student_of_assignment(_assignment_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from assignments a
    join class_members cm on cm.class_id = a.class_id
    where a.id = _assignment_id and cm.student_id = auth.uid()
  );
$$;

create or replace function is_teacher_of_submission(_submission_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from submissions s
    join assignments a on a.id = s.assignment_id
    join classes c on c.id = a.class_id
    where s.id = _submission_id and c.teacher_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Join-by-code RPC (students never get direct table access to classes
-- they are not already a member of)
-- ---------------------------------------------------------------------------
create or replace function join_class_by_code(_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _class_id uuid;
  _student_id uuid := auth.uid();
begin
  if _student_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from students where id = _student_id) then
    raise exception 'Only students can join a class';
  end if;

  select id into _class_id from classes where class_code = upper(trim(_code)) and archived = false;

  if _class_id is null then
    raise exception 'Invalid class code';
  end if;

  insert into class_members (class_id, student_id)
  values (_class_id, _student_id)
  on conflict (class_id, student_id) do nothing;

  return _class_id;
end;
$$;

grant execute on function join_class_by_code(text) to authenticated;

-- Returns published-assignment questions without the answer key, for the
-- student-facing assignment/submission UI.
create or replace function get_assignment_questions(_assignment_id uuid)
returns table (
  id uuid,
  order_index int,
  question_text text,
  point_value numeric,
  topic_id uuid,
  difficulty difficulty_level
)
language sql stable security definer set search_path = public as $$
  select q.id, q.order_index, q.question_text, q.point_value, q.topic_id, q.difficulty
  from questions q
  join assignments a on a.id = q.assignment_id
  where q.assignment_id = _assignment_id
    and a.status = 'published'
    and is_student_of_class(a.class_id)
  order by q.order_index;
$$;

grant execute on function get_assignment_questions(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Computed views
-- ---------------------------------------------------------------------------
create view submission_scores as
select
  s.id as submission_id,
  s.assignment_id,
  s.student_id,
  s.status,
  s.is_late,
  s.submitted_at,
  a.class_id,
  a.total_points as assignment_total_points,
  coalesce(sum(g.points_earned), 0) as points_earned,
  coalesce(nullif(sum(g.points_possible), 0), a.total_points) as points_possible,
  case
    when coalesce(sum(g.points_possible), 0) > 0
      then round((100.0 * sum(g.points_earned) / sum(g.points_possible))::numeric, 1)
    else null
  end as percentage,
  coalesce(bool_or(g.needs_review), false) as needs_review,
  (count(g.id) > 0 and count(g.id) filter (where g.graded_at is null) = 0) as fully_graded
from submissions s
join assignments a on a.id = s.assignment_id
left join grades g on g.submission_id = s.id
group by s.id, s.assignment_id, s.student_id, s.status, s.is_late, s.submitted_at, a.class_id, a.total_points;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table teachers enable row level security;
alter table students enable row level security;
alter table topics enable row level security;
alter table classes enable row level security;
alter table class_members enable row level security;
alter table assignments enable row level security;
alter table questions enable row level security;
alter table submissions enable row level security;
alter table student_answers enable row level security;
alter table grades enable row level security;
alter table feedback enable row level security;
alter table grade_history enable row level security;

-- topics: readable by any authenticated user
create policy topics_select_all on topics for select to authenticated using (true);

-- profiles
create policy profiles_select on profiles for select to authenticated using (
  id = auth.uid()
  or exists (
    select 1 from class_members cm join classes c on c.id = cm.class_id
    where c.teacher_id = auth.uid() and cm.student_id = profiles.id
  )
  or exists (
    select 1 from class_members cm join classes c on c.id = cm.class_id
    where cm.student_id = auth.uid() and c.teacher_id = profiles.id
  )
);
create policy profiles_insert_self on profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- teachers
create policy teachers_select_self on teachers for select to authenticated using (id = auth.uid());
create policy teachers_insert_self on teachers for insert to authenticated with check (id = auth.uid());
create policy teachers_update_self on teachers for update to authenticated using (id = auth.uid());

-- students
create policy students_select on students for select to authenticated using (
  id = auth.uid()
  or exists (
    select 1 from class_members cm join classes c on c.id = cm.class_id
    where c.teacher_id = auth.uid() and cm.student_id = students.id
  )
);
create policy students_insert_self on students for insert to authenticated with check (id = auth.uid());
create policy students_update_self on students for update to authenticated using (id = auth.uid());

-- classes
create policy classes_select on classes for select to authenticated using (
  teacher_id = auth.uid() or is_student_of_class(id)
);
create policy classes_insert on classes for insert to authenticated with check (teacher_id = auth.uid());
create policy classes_update on classes for update to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy classes_delete on classes for delete to authenticated using (teacher_id = auth.uid());

-- class_members
create policy class_members_select on class_members for select to authenticated using (
  student_id = auth.uid() or is_teacher_of_class(class_id)
);
create policy class_members_insert_teacher on class_members for insert to authenticated with check (is_teacher_of_class(class_id));
create policy class_members_delete_teacher on class_members for delete to authenticated using (is_teacher_of_class(class_id));

-- assignments
create policy assignments_select on assignments for select to authenticated using (
  is_teacher_of_class(class_id) or (status = 'published' and is_student_of_class(class_id))
);
create policy assignments_insert on assignments for insert to authenticated with check (is_teacher_of_class(class_id));
create policy assignments_update on assignments for update to authenticated using (is_teacher_of_class(class_id)) with check (is_teacher_of_class(class_id));
create policy assignments_delete on assignments for delete to authenticated using (is_teacher_of_class(class_id));

-- questions: teacher-only table access; students use get_assignment_questions()
create policy questions_select_teacher on questions for select to authenticated using (is_teacher_of_assignment(assignment_id));
create policy questions_insert_teacher on questions for insert to authenticated with check (is_teacher_of_assignment(assignment_id));
create policy questions_update_teacher on questions for update to authenticated using (is_teacher_of_assignment(assignment_id)) with check (is_teacher_of_assignment(assignment_id));
create policy questions_delete_teacher on questions for delete to authenticated using (is_teacher_of_assignment(assignment_id));

-- submissions
create policy submissions_select on submissions for select to authenticated using (
  student_id = auth.uid() or is_teacher_of_assignment(assignment_id)
);
create policy submissions_insert_student on submissions for insert to authenticated with check (
  student_id = auth.uid() and is_student_of_assignment(assignment_id)
);
create policy submissions_insert_teacher on submissions for insert to authenticated with check (
  is_teacher_of_assignment(assignment_id)
);
create policy submissions_update_student on submissions for update to authenticated
  using (student_id = auth.uid() and status <> 'graded')
  with check (student_id = auth.uid() and status in ('not_started', 'in_progress', 'submitted'));
create policy submissions_update_teacher on submissions for update to authenticated
  using (is_teacher_of_assignment(assignment_id)) with check (is_teacher_of_assignment(assignment_id));

-- student_answers
create policy student_answers_select on student_answers for select to authenticated using (
  exists (select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid())
  or is_teacher_of_submission(submission_id)
);
create policy student_answers_insert_student on student_answers for insert to authenticated with check (
  exists (select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid() and s.status <> 'graded')
);
create policy student_answers_update_student on student_answers for update to authenticated using (
  exists (select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid() and s.status <> 'graded')
);

-- grades: teacher-only writes; students read-only their own
create policy grades_select on grades for select to authenticated using (
  is_teacher_of_submission(submission_id)
  or exists (select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid())
);
create policy grades_insert_teacher on grades for insert to authenticated with check (is_teacher_of_submission(submission_id));
create policy grades_update_teacher on grades for update to authenticated using (is_teacher_of_submission(submission_id)) with check (is_teacher_of_submission(submission_id));
create policy grades_delete_teacher on grades for delete to authenticated using (is_teacher_of_submission(submission_id));

-- feedback
create policy feedback_select on feedback for select to authenticated using (
  is_teacher_of_submission(submission_id)
  or exists (select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid())
);
create policy feedback_insert_teacher on feedback for insert to authenticated with check (is_teacher_of_submission(submission_id));
create policy feedback_delete_teacher on feedback for delete to authenticated using (is_teacher_of_submission(submission_id));

-- grade_history: teacher-only, read-only from the client (rows are written by the trigger)
create policy grade_history_select_teacher on grade_history for select to authenticated using (
  exists (
    select 1 from grades g where g.id = grade_id and is_teacher_of_submission(g.submission_id)
  )
);

-- ---------------------------------------------------------------------------
-- Seed reference topics (not demo data — required for the app to function)
-- ---------------------------------------------------------------------------
insert into topics (name, sort_order) values
  ('Addition', 1),
  ('Subtraction', 2),
  ('Multiplication', 3),
  ('Division', 4),
  ('Fractions', 5),
  ('Decimals', 6),
  ('Percentages', 7),
  ('Algebra', 8),
  ('Geometry', 9),
  ('Equations', 10),
  ('Graphing', 11),
  ('Word Problems', 12)
on conflict (name) do nothing;
