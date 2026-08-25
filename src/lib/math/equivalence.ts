import { create, all, type MathNode } from "mathjs";

// A sandboxed math-expression instance — this only ever parses/evaluates
// arithmetic and algebraic expressions, never arbitrary code.
const math = create(all, {});

const MAX_INPUT_LENGTH = 200;
const ALLOWED_CHARS = /^[0-9a-zA-Z+\-*/^().,\s]*$/;
const KNOWN_CONSTANTS = new Set(["pi", "e", "tau", "i", "Infinity", "NaN"]);
const EPSILON = 1e-6;
const SAMPLE_POINTS = [0.5, 1.7, -2.3, 3.1, -0.9];
const MAX_VARIABLES = 3;

export type EquivalenceResult =
  | { status: "correct" }
  | { status: "incorrect" }
  | { status: "needs_review"; reason: string };

/**
 * Determines whether a student's math answer is mathematically equivalent to
 * the correct answer — e.g. "2/4" ≡ "1/2", "x+x" ≡ "2x", "50%" ≡ "1/2" —
 * without relying on exact string matching. Anything that can't be safely
 * evaluated (free-form prose, unparseable syntax, too many unknowns) is
 * routed to a human via `needs_review` rather than guessed at.
 */
export function checkMathEquivalence(studentRaw: string | null | undefined, correctRaw: string | null | undefined): EquivalenceResult {
  const student = (studentRaw ?? "").trim();
  const correct = (correctRaw ?? "").trim();

  if (!student) return { status: "incorrect" };
  if (!correct) return { status: "needs_review", reason: "No answer key was provided for this question." };

  const studentNode = safeParse(preprocess(student));
  const correctNode = safeParse(preprocess(correct));

  if (!studentNode || !correctNode) {
    return { status: "needs_review", reason: "Answer could not be parsed as a math expression." };
  }

  const variables = Array.from(new Set([...collectSymbols(studentNode), ...collectSymbols(correctNode)]));

  if (variables.length > MAX_VARIABLES) {
    return { status: "needs_review", reason: "Too many unknowns to safely auto-grade." };
  }

  try {
    if (variables.length === 0) {
      const a = studentNode.evaluate();
      const b = correctNode.evaluate();
      if (!isFiniteNumber(a) || !isFiniteNumber(b)) {
        return { status: "needs_review", reason: "Expression did not evaluate to a number." };
      }
      return Math.abs(a - b) < EPSILON ? { status: "correct" } : { status: "incorrect" };
    }

    // Algebraic expressions: compare by evaluating both sides across several
    // sample points for each unknown. If every sample matches, the
    // expressions are (almost certainly) equivalent — the same technique
    // computer algebra systems use for a fast probabilistic equivalence check.
    let evaluatedAny = false;
    for (const base of SAMPLE_POINTS) {
      const scope: Record<string, number> = {};
      variables.forEach((name, i) => (scope[name] = base + i * 0.37));

      let a: unknown;
      let b: unknown;
      try {
        a = studentNode.evaluate({ ...scope });
        b = correctNode.evaluate({ ...scope });
      } catch {
        continue;
      }

      if (!isFiniteNumber(a) || !isFiniteNumber(b)) continue;
      evaluatedAny = true;
      if (Math.abs(a - b) > EPSILON) {
        return { status: "incorrect" };
      }
    }

    if (!evaluatedAny) {
      return { status: "needs_review", reason: "Expression could not be evaluated across sample values." };
    }
    return { status: "correct" };
  } catch {
    return { status: "needs_review", reason: "Unexpected error evaluating the expression." };
  }
}

function preprocess(raw: string): string {
  let s = raw.trim();
  s = s.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  // Mixed numbers: "1 1/2" -> "(1 + 1/2)"
  s = s.replace(/(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)/g, (_m, sign, whole, num, den) => `${sign}(${whole} + ${num}/${den})`);
  // Percentages: "50%" -> "(50/100)"
  s = s.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");
  // Strip a single leading "x=" / "y=" style prefix so "x = 5" compares against "5"
  s = s.replace(/^[a-zA-Z]\w*\s*=\s*/, "");
  return s;
}

function safeParse(expr: string): MathNode | null {
  if (!expr || expr.length > MAX_INPUT_LENGTH) return null;
  if (!ALLOWED_CHARS.test(expr)) return null;
  try {
    return math.parse(expr);
  } catch {
    return null;
  }
}

function collectSymbols(node: MathNode): string[] {
  const names = new Set<string>();
  node.traverse((n) => {
    if (n.type === "SymbolNode") {
      const name = (n as unknown as { name: string }).name;
      if (name && !KNOWN_CONSTANTS.has(name)) names.add(name);
    }
  });
  return Array.from(names);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
