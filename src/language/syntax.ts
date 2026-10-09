import { inflect, type DerivationStep } from "./morphology";
import { applyMutation } from "./mutation";

export type SyntaxFrame =
  | "greeting"
  | "command-sequence"
  | "direct-object-command";

export interface SentenceToken {
  surface: string;
  lexemeId?: string;
  role: "verb" | "object" | "vocative" | "conjunction" | "fixed-phrase";
}

export interface SentenceDerivation extends DerivationStep {
  role: SentenceToken["role"];
}

export interface GeneratedSentence {
  frame: SyntaxFrame;
  label: string;
  translation: string;
  surface: string;
  tokens: SentenceToken[];
  lexemeIds: string[];
  derivation: SentenceDerivation[];
  sourceRefIds: string[];
}

export type SentenceValidation =
  | { status: "valid"; sentence: GeneratedSentence }
  | {
      status: "invalid";
      errors: Array<{
        ruleId: "frame-surface-mismatch";
        expected: string;
        explanation: string;
      }>;
    };

const normalizeSurface = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/[.!?,;:]/g, "")
    .replace(/\s+/g, " ")
    .normalize("NFC");

function requiredImperative(lexemeId: string) {
  const result = inflect(lexemeId, "imperative");
  if (!result) {
    throw new Error(`Missing curated imperative for ${lexemeId}.`);
  }
  return result;
}

function greeting(): GeneratedSentence {
  return {
    frame: "greeting",
    label: "Begrüßung",
    translation: "Willkommen.",
    surface: "Mae govannen.",
    tokens: [
      {
        surface: "Mae govannen",
        lexemeId: "eldamo:2338511755",
        role: "fixed-phrase",
      },
    ],
    lexemeIds: ["eldamo:2338511755"],
    derivation: [
      {
        role: "fixed-phrase",
        ruleId: "curated-fixed-phrase",
        from: "mae govannen",
        to: "Mae govannen",
        explanation:
          "Diese Begrüßung wird als kuratierte feste Formel verwendet und nicht frei flektiert.",
        sourceRefId: "Eldamo:word-2338511755",
      },
    ],
    sourceRefIds: ["Eldamo:word-2338511755"],
  };
}

function commandSequence(): GeneratedSentence {
  const speak = requiredImperative("eldamo:599418975");
  const enter = requiredImperative("eldamo:2086508063");
  return {
    frame: "command-sequence",
    label: "Anrede mit zwei Aufforderungen",
    translation: "Sage „Freund“ und tritt ein.",
    surface: `${capitalize(speak.surface)} mellon a ${enter.surface}.`,
    tokens: [
      { surface: speak.surface, lexemeId: speak.lexemeId, role: "verb" },
      { surface: "mellon", lexemeId: "eldamo:2964964287", role: "vocative" },
      { surface: "a", role: "conjunction" },
      { surface: enter.surface, lexemeId: enter.lexemeId, role: "verb" },
    ],
    lexemeIds: [
      speak.lexemeId,
      "eldamo:2964964287",
      enter.lexemeId,
    ],
    derivation: [
      ...speak.derivation.map((step) => ({ ...step, role: "verb" as const })),
      {
        role: "vocative",
        ruleId: "vocative-keeps-base-form",
        from: "mellon",
        to: "mellon",
        explanation:
          "Die Anrede wird in diesem kuratierten Satzmuster nicht als direktes Objekt mutiert.",
        sourceRefId: "Eldamo:word-3670583905",
      },
      ...enter.derivation.map((step) => ({ ...step, role: "verb" as const })),
    ],
    sourceRefIds: [
      "Eldamo:word-3670583905",
      ...speak.derivation.map((step) => step.sourceRefId),
      ...enter.derivation.map((step) => step.sourceRefId),
    ],
  };
}

function directObjectCommand(): GeneratedSentence {
  const listen = requiredImperative("eldamo:3923493535");
  const object = applyMutation(
    "eldamo:184000497",
    "soft",
    "direct-object",
  );
  if (!object) {
    throw new Error("Missing curated direct-object mutation for peth.");
  }
  return {
    frame: "direct-object-command",
    label: "Aufforderung mit direktem Objekt",
    translation: "Höre auf das Wort.",
    surface: `${capitalize(listen.surface)} ${object.surface}.`,
    tokens: [
      { surface: listen.surface, lexemeId: listen.lexemeId, role: "verb" },
      { surface: object.surface, lexemeId: object.lexemeId, role: "object" },
    ],
    lexemeIds: [listen.lexemeId, object.lexemeId],
    derivation: [
      ...listen.derivation.map((step) => ({ ...step, role: "verb" as const })),
      {
        role: "object",
        ruleId: "soft-mutation-direct-object",
        from: object.base,
        to: object.surface,
        explanation: object.explanation,
        sourceRefId: object.sourceRefId,
      },
    ],
    sourceRefIds: [
      "Eldamo:word-1341071759",
      ...listen.derivation.map((step) => step.sourceRefId),
      object.sourceRefId,
    ],
  };
}

const capitalize = (value: string) =>
  `${value.charAt(0).toLocaleUpperCase("de-DE")}${value.slice(1)}`;

/** Generates only curated sentence frames; this is deliberately not free translation. */
export function generateSentence(frame: SyntaxFrame): GeneratedSentence {
  switch (frame) {
    case "greeting":
      return greeting();
    case "command-sequence":
      return commandSequence();
    case "direct-object-command":
      return directObjectCommand();
  }
}

/**
 * Validates an answer against one explicitly selected lesson frame. Unknown prose
 * remains outside this MVP instead of being incorrectly labelled as ungrammatical.
 */
export function validateSentence(
  frame: SyntaxFrame,
  input: string,
): SentenceValidation {
  const sentence = generateSentence(frame);
  if (normalizeSurface(input) === normalizeSurface(sentence.surface)) {
    return { status: "valid", sentence };
  }
  return {
    status: "invalid",
    errors: [
      {
        ruleId: "frame-surface-mismatch",
        expected: sentence.surface,
        explanation:
          "Die Antwort passt nicht zur kuratierten Form dieses Satzmusters. Andere freie Formulierungen bewertet dieser MVP bewusst noch nicht.",
      },
    ],
  };
}
