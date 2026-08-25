// Populates a Supabase project (after `supabase/migrations` has been applied)
// with a realistic demo teacher, roster, classes, assignments, and grade
// history so the app looks populated during development.
//
// Usage:
//   1. Copy .env.example to .env.local and fill in your Supabase project URL,
//      anon key, and service role key.
//   2. Apply the migrations in supabase/migrations/ to that project.
//   3. npm run seed

import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: existsSync(".env.local") ? ".env.local" : ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_PASSWORD = "Password123!";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill it in first.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function getOrCreateUser({ email, fullName, role }) {
  const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { role, full_name: fullName }
  });
  if (error) throw new Error(`Failed to create ${email}: ${error.message}`);
  return data.user.id;
}

const TOPIC_QUESTIONS = {
  Fractions: [
    { text: "What is 2/4 written in simplest form?", answer: "1/2" },
    { text: "Add: 1/6 + 2/6", answer: "1/2" },
    { text: "What is 3/4 of 8?", answer: "6" },
    { text: "Convert 3/4 to a decimal.", answer: "0.75" }
  ],
  Decimals: [
    { text: "0.5 + 0.25 = ?", answer: "0.75" },
    { text: "1.2 × 3 = ?", answer: "3.6" },
    { text: "What is 4.5 − 1.75?", answer: "2.75" },
    { text: "Round 3.14159 to two decimal places.", answer: "3.14" }
  ],
  Algebra: [
    { text: "Simplify: 2x + 3x", answer: "5x" },
    { text: "Simplify: 4(x + 2)", answer: "4x + 8" },
    { text: "Simplify: 3x + 2 − x", answer: "2x + 2" },
    { text: "Evaluate 2x + 1 when x = 3.", answer: "7" }
  ],
  Equations: [
    { text: "Solve for x: x + 4 = 10", answer: "x = 6" },
    { text: "Solve for x: 3x = 12", answer: "x = 4" },
    { text: "Solve for x: 2x − 1 = 9", answer: "x = 5" },
    { text: "Solve for x: x/2 = 7", answer: "x = 14" }
  ],
  Percentages: [
    { text: "What is 25% of 80?", answer: "20" },
    { text: "Write 50% as a fraction in simplest form.", answer: "1/2" },
    { text: "What is 10% of 250?", answer: "25" },
    { text: "Write 0.4 as a percentage (just the number).", answer: "40" }
  ]
};

function questionSetFor(topicName) {
  const bank = TOPIC_QUESTIONS[topicName] ?? TOPIC_QUESTIONS.Algebra;
  return [
    ...bank.map((q) => ({ question_text: q.text, point_value: 2, correct_answer: q.answer, explanation: null, difficulty: pick(["easy", "medium", "hard"]), answer_type: "auto" })),
    {
      question_text: `Write a short word problem answer: explain a real-world situation involving ${topicName.toLowerCase()}.`,
      point_value: 2,
      correct_answer: null,
      explanation: "Graded for reasoning, not an exact numeric match.",
      difficulty: "medium",
      answer_type: "manual"
    }
  ];
}

async function main() {
  console.log("Seeding demo data...");

  const { data: topics } = await supabase.from("topics").select("id, name");
  const topicIdByName = new Map((topics ?? []).map((t) => [t.name, t.id]));

  const teacherId = await getOrCreateUser({ email: "teacher@demo.school", fullName: "Ms. Rivera", role: "teacher" });
  await supabase.from("teachers").update({ school: "Lincoln Middle School" }).eq("id", teacherId);
  console.log("Teacher:", teacherId);

  const studentDefs = [
    { email: "student1@demo.school", name: "Ava Thompson", base: 94 },
    { email: "student2@demo.school", name: "Ben Rodriguez", base: 88 },
    { email: "student3@demo.school", name: "Chloe Kim", base: 76 },
    { email: "student4@demo.school", name: "Diego Martinez", base: 55 },
    { email: "student5@demo.school", name: "Ella Nguyen", base: 82 },
    { email: "student6@demo.school", name: "Finn O'Brien", base: 63 },
    { email: "student7@demo.school", name: "Grace Patel", base: 91 },
    { email: "student8@demo.school", name: "Henry Wilson", base: 70 }
  ];
  for (const s of studentDefs) {
    s.id = await getOrCreateUser({ email: s.email, fullName: s.name, role: "student" });
  }
  console.log(`Students: ${studentDefs.length}`);

  const classDefs = [
    { name: "Algebra 1 — Period 2", subject: "Math", students: studentDefs.slice(0, 5), topics: ["Fractions", "Algebra", "Equations", "Decimals"] },
    { name: "Pre-Algebra — Period 5", subject: "Math", students: studentDefs.slice(3, 8), topics: ["Decimals", "Percentages", "Fractions", "Equations"] }
  ];

  for (const classDef of classDefs) {
    let code = generateCode();
    const { data: existingClass } = await supabase.from("classes").select("id").eq("teacher_id", teacherId).eq("name", classDef.name).maybeSingle();

    let classId = existingClass?.id;
    if (!classId) {
      const { data: created, error } = await supabase
        .from("classes")
        .insert({ teacher_id: teacherId, name: classDef.name, subject: classDef.subject, class_code: code })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      classId = created.id;
    }
    console.log(`Class "${classDef.name}":`, classId);

    for (const student of classDef.students) {
      await supabase.from("class_members").upsert({ class_id: classId, student_id: student.id }, { onConflict: "class_id,student_id" });
    }

    // 4 past (graded) assignments, 1 upcoming published, 1 draft.
    const pastTopics = classDef.topics;
    for (let i = 0; i < pastTopics.length; i++) {
      const topicName = pastTopics[i];
      const daysAgo = 28 - i * 7;
      const assignmentId = await createAssignment({
        classId,
        name: `${topicName} Practice #${i + 1}`,
        topicId: topicIdByName.get(topicName),
        dateAssigned: isoDaysAgo(daysAgo + 2),
        dueDate: isoDaysAgo(daysAgo),
        status: "published",
        difficulty: pick(["easy", "medium", "hard"])
      });
      const questions = await createQuestions(assignmentId, questionSetFor(topicName));
      await gradeClassForAssignment({ assignmentId, dueDate: isoDaysAgo(daysAgo), students: classDef.students, questions, teacherId });
    }

    const upcomingTopic = pick(classDef.topics);
    await createAssignment({
      classId,
      name: `${upcomingTopic} Quiz (Upcoming)`,
      topicId: topicIdByName.get(upcomingTopic),
      dateAssigned: isoDaysAgo(1),
      dueDate: isoDaysFromNow(5),
      status: "published",
      difficulty: "medium"
    }).then((id) => createQuestions(id, questionSetFor(upcomingTopic)));

    const draftTopic = pick(classDef.topics);
    await createAssignment({
      classId,
      name: `${draftTopic} Test (Draft)`,
      topicId: topicIdByName.get(draftTopic),
      dateAssigned: isoDaysFromNow(3),
      dueDate: isoDaysFromNow(10),
      status: "draft",
      difficulty: "hard"
    }).then((id) => createQuestions(id, questionSetFor(draftTopic)));
  }

  console.log("\nDone! Demo accounts (password for all: " + DEMO_PASSWORD + "):");
  console.log("  Teacher: teacher@demo.school");
  studentDefs.forEach((s) => console.log(`  Student: ${s.email} (${s.name})`));
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[randInt(0, alphabet.length - 1)];
  return code;
}

async function createAssignment({ classId, name, topicId, dateAssigned, dueDate, status, difficulty }) {
  const { data: existing } = await supabase.from("assignments").select("id").eq("class_id", classId).eq("name", name).maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("assignments")
    .insert({
      class_id: classId,
      name,
      topic_id: topicId ?? null,
      date_assigned: dateAssigned,
      due_date: dueDate,
      status,
      difficulty,
      total_points: 0,
      instructions: "Show your work where applicable. Round decimal answers to two places.",
      has_answer_key: true
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function createQuestions(assignmentId, questionDefs) {
  const { data: existing } = await supabase.from("questions").select("id, order_index, point_value").eq("assignment_id", assignmentId).order("order_index");
  if (existing && existing.length > 0) return existing;

  const rows = questionDefs.map((q, i) => ({ assignment_id: assignmentId, order_index: i, ...q }));
  const { data, error } = await supabase.from("questions").insert(rows).select("id, order_index, point_value");
  if (error) throw new Error(error.message);

  const total = questionDefs.reduce((sum, q) => sum + q.point_value, 0);
  await supabase.from("assignments").update({ total_points: total }).eq("id", assignmentId);
  return data;
}

async function gradeClassForAssignment({ assignmentId, dueDate, students, questions, teacherId }) {
  for (const student of students) {
    const roll = Math.random();
    // Most students submit on time and get graded; a few are late, missing, or awaiting grading.
    if (roll < 0.06) {
      await supabase.from("submissions").upsert(
        { assignment_id: assignmentId, student_id: student.id, status: "missing" },
        { onConflict: "assignment_id,student_id" }
      );
      continue;
    }

    const isLate = roll < 0.16;
    const stillUngraded = roll < 0.24;
    const submittedAt = isLate ? `${dueDate}T23:59:00Z` : `${dueDate}T15:00:00Z`;

    const { data: submission, error } = await supabase
      .from("submissions")
      .upsert(
        { assignment_id: assignmentId, student_id: student.id, status: "submitted", submitted_at: submittedAt, is_late: isLate },
        { onConflict: "assignment_id,student_id" }
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const target = clamp(student.base + randInt(-12, 8), 20, 100);

    const answerRows = [];
    const gradeRows = [];
    for (const q of questions) {
      const success = Math.random() * 100 < target;
      const earned = q.point_value === undefined ? 2 : success ? q.point_value : Math.random() < 0.4 ? Math.round(q.point_value / 2) : 0;
      answerRows.push({ submission_id: submission.id, question_id: q.id, answer_text: success ? "correct-ish answer" : "attempted answer", answered_at: submittedAt });
      if (!stillUngraded) {
        gradeRows.push({
          submission_id: submission.id,
          question_id: q.id,
          points_earned: earned,
          points_possible: q.point_value ?? 2,
          is_correct: earned >= (q.point_value ?? 2),
          needs_review: false,
          auto_graded: true,
          graded_by: teacherId,
          graded_at: new Date().toISOString()
        });
      }
    }
    if (answerRows.length) await supabase.from("student_answers").upsert(answerRows, { onConflict: "submission_id,question_id" });
    if (gradeRows.length) await supabase.from("grades").upsert(gradeRows, { onConflict: "submission_id,question_id" });
    if (!stillUngraded) {
      await supabase.from("submissions").update({ status: "graded" }).eq("id", submission.id);
      if (Math.random() < 0.3) {
        const comment = target >= 85 ? "Great work — keep it up!" : target < 60 ? "Let's review this topic together in office hours." : "Nice progress, watch your sign errors.";
        await supabase.from("feedback").insert({ submission_id: submission.id, comment, created_by: teacherId });
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
