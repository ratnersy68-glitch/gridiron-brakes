// Hand-authored domain types matching supabase/migrations/0001_init.sql.
// Kept as plain row interfaces (rather than the generated Supabase `Database`
// generic) so the app can evolve quickly; regenerate with the Supabase CLI
// (`supabase gen types typescript`) once a live project exists if stricter
// `.from()` typing is desired.

export type UserRole = "teacher" | "student";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type AssignmentStatus = "draft" | "published";
export type SubmissionStatus = "not_started" | "in_progress" | "submitted" | "graded" | "missing";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  school: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  grade_level: string | null;
  created_at: string;
}

export interface Topic {
  id: string;
  name: string;
  sort_order: number;
}

export interface ClassRow {
  id: string;
  teacher_id: string;
  name: string;
  subject: string;
  class_code: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassMember {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  name: string;
  date_assigned: string;
  due_date: string | null;
  total_points: number;
  instructions: string | null;
  topic_id: string | null;
  difficulty: DifficultyLevel;
  status: AssignmentStatus;
  has_answer_key: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  assignment_id: string;
  order_index: number;
  question_text: string;
  point_value: number;
  correct_answer: string | null;
  explanation: string | null;
  topic_id: string | null;
  difficulty: DifficultyLevel;
  answer_type: "auto" | "manual";
  created_at: string;
}

export interface StudentQuestion {
  id: string;
  order_index: number;
  question_text: string;
  point_value: number;
  topic_id: string | null;
  difficulty: DifficultyLevel;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: SubmissionStatus;
  is_late: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionScore {
  submission_id: string;
  assignment_id: string;
  student_id: string;
  status: SubmissionStatus;
  is_late: boolean;
  submitted_at: string | null;
  class_id: string;
  assignment_total_points: number;
  points_earned: number;
  points_possible: number;
  percentage: number | null;
  needs_review: boolean;
  fully_graded: boolean;
}

export interface StudentAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  answer_text: string | null;
  answered_at: string | null;
  created_at: string;
}

export interface Grade {
  id: string;
  submission_id: string;
  question_id: string;
  points_earned: number;
  points_possible: number;
  is_correct: boolean | null;
  needs_review: boolean;
  auto_graded: boolean;
  is_override: boolean;
  comment: string | null;
  graded_by: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  submission_id: string;
  comment: string;
  created_by: string | null;
  created_at: string;
}

export interface GradeHistory {
  id: string;
  grade_id: string;
  points_earned: number | null;
  points_possible: number | null;
  is_correct: boolean | null;
  comment: string | null;
  changed_by: string | null;
  changed_at: string;
}
