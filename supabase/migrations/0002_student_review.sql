-- Lets a student review the answer key, explanation, and their earned points
-- for a submission — but only once it has been fully graded, so answer keys
-- never leak while an assignment is still open for other students to submit.
create or replace function get_graded_submission_review(_submission_id uuid)
returns table (
  question_id uuid,
  order_index int,
  question_text text,
  point_value numeric,
  correct_answer text,
  explanation text,
  student_answer text,
  points_earned numeric,
  points_possible numeric,
  comment text
)
language sql stable security definer set search_path = public as $$
  select q.id, q.order_index, q.question_text, q.point_value, q.correct_answer, q.explanation,
         sa.answer_text, g.points_earned, g.points_possible, g.comment
  from submissions s
  join questions q on q.assignment_id = s.assignment_id
  left join student_answers sa on sa.submission_id = s.id and sa.question_id = q.id
  left join grades g on g.submission_id = s.id and g.question_id = q.id
  where s.id = _submission_id
    and s.student_id = auth.uid()
    and s.status = 'graded'
  order by q.order_index;
$$;

grant execute on function get_graded_submission_review(uuid) to authenticated;
