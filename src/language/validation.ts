import { analyze, type DerivationStep } from "./morphology";
import { analyzeMutation, type MutationResult } from "./mutation";
import {
  generateSentence,
  type GeneratedSentence,
  type SentenceDerivation,
  type SyntaxFrame,
} from "./syntax";

export type ValidationStatus = "valid" | "review" | "invalid";

export interface ValidationNote {
  code:
    | "unknown-form"
    | "missing-required-mutation"
    | "missing-required-inflection"
    | "unexpected-mutation"
    | "known-form-mismatch";
  token?: string;
  expected?: string;
  explanation: string;
  sourceRefId?: string;
}

export type ExerciseValidation =
  | {
      status: "valid";
      sentence: GeneratedSentence;
      derivation: SentenceDerivation[];
    }
  | { status: "review"; reasons: ValidationNote[] }
  | { status: "invalid"; errors: ValidationNote[] };

type WordAnalysis = {
  token: string;
  inflections: ReturnType<typeof analyze>;
  mutations: MutationResult[];
};

const normalizeSurface = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/[.!?,;:]/g, "")
    .replace(/\s+/g, " ")
    .normalize("NFC");

const words = (value: string) =>
  normalizeSurface(value)
    .split(" ")
    .filter(Boolean);

const normalizeRuleForm = (value: string) => normalizeSurface(value).replace(/-$/, "");

function analyzeWords(input: string): WordAnalysis[] {
  return words(input).map((token) => ({
    token,
    inflections: analyze(token),
    mutations: analyzeMutation(token),
  }));
}

function ruleForExpectedWord(
  sentence: GeneratedSentence,
  expected: string,
): SentenceDerivation | undefined {
  return sentence.derivation.find(
    (step) => normalizeRuleForm(step.to) === normalizeRuleForm(expected),
  );
}

function concreteMismatch(
  sentence: GeneratedSentence,
  inputWords: string[],
): ValidationNote | null {
  const expectedWords = words(sentence.surface);

  for (const [index, expected] of expectedWords.entries()) {
    const actual = inputWords[index];
    if (!actual || actual === expected) continue;

    const derivation = ruleForExpectedWord(sentence, expected);
    if (derivation && actual === normalizeRuleForm(derivation.from)) {
      if (derivation.ruleId.startsWith("soft-mutation")) {
        return {
          code: "missing-required-mutation",
          token: actual,
          expected,
          explanation: `In diesem Satzmuster ist „${expected}“ die erwartete weiche Mutation von „${actual}“.`,
          sourceRefId: derivation.sourceRefId,
        };
      }
      if (derivation.ruleId.startsWith("imperative")) {
        return {
          code: "missing-required-inflection",
          token: actual,
          expected,
          explanation: `Hier erwartet Tadlam die Imperativform „${expected}“ statt der Stammform „${actual}“.`,
          sourceRefId: derivation.sourceRefId,
        };
      }
    }

    const reverseMutation = analyzeMutation(actual).find(
      (mutation) => mutation.lexemeId === sentence.tokens[index]?.lexemeId,
    );
    if (reverseMutation) {
      return {
        code: "unexpected-mutation",
        token: actual,
        expected,
        explanation: `„${actual}“ ist eine mutierte Form. An dieser Stelle erwartet dieses Satzmuster die Grundform „${expected}“.`,
        sourceRefId: reverseMutation.sourceRefId,
      };
    }
  }
  return null;
}

function hasKnownAnalysis(analysis: WordAnalysis): boolean {
  return analysis.inflections.length > 0 || analysis.mutations.length > 0;
}

/**
 * Validates a typed answer against one selected, curated course frame. It never
 * calls unrecognised free Sindarin wrong: absent a concrete violated rule, that
 * answer is returned for editorial review instead.
 */
export function validateExerciseAnswer(
  frame: SyntaxFrame,
  input: string,
): ExerciseValidation {
  const sentence = generateSentence(frame);
  if (normalizeSurface(input) === normalizeSurface(sentence.surface)) {
    return {
      status: "valid",
      sentence,
      derivation: sentence.derivation,
    };
  }

  const inputWords = words(input);
  const concrete = concreteMismatch(sentence, inputWords);
  if (concrete) return { status: "invalid", errors: [concrete] };

  const analyses = analyzeWords(input);
  const unknown = analyses.find((entry) => !hasKnownAnalysis(entry));
  if (unknown) {
    return {
      status: "review",
      reasons: [
        {
          code: "unknown-form",
          token: unknown.token,
          explanation: `„${unknown.token}“ kann das aktuelle Regelpaket noch nicht eindeutig analysieren. Die Eingabe wird nicht pauschal als falsch bewertet.`,
        },
      ],
    };
  }

  return {
    status: "invalid",
    errors: [
      {
        code: "known-form-mismatch",
        expected: sentence.surface,
        explanation: `Die erkannten Formen ergeben nicht das aktive Satzmuster. Erwartet wird: „${sentence.surface}“`,
      },
    ],
  };
}

/** Exposes the source-backed rule trace used by a valid answer for “Warum?”. */
export function explainValidation(
  validation: Extract<ExerciseValidation, { status: "valid" }>,
): DerivationStep[] {
  return validation.derivation;
}
