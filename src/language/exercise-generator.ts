import type { EngineExerciseContext, Exercise, ExerciseKind } from "../domain";
import { generateSentence, type GeneratedSentence, type SyntaxFrame } from "./syntax";

export type GeneratedExerciseKind = Extract<
  ExerciseKind,
  "choice" | "cloze" | "order" | "type"
>;

export interface PracticeSignal {
  misses: number;
  lastMissedAt: string;
}

export interface ExerciseGenerationRequest {
  frames: SyntaxFrame[];
  kinds?: GeneratedExerciseKind[];
  limit?: number;
  practiceSignals?: Record<string, PracticeSignal>;
}

const allKinds: GeneratedExerciseKind[] = ["choice", "order", "cloze", "type"];

const frameAlternatives: Record<SyntaxFrame, string[]> = {
  greeting: ["Pedo mellon a minno.", "Hannon le."],
  "command-sequence": ["Mae govannen.", "Hannon le."],
  "direct-object-command": ["Mae govannen.", "Pedo mellon a minno."],
};

const sourceLabel = (sentence: GeneratedSentence) =>
  `Eldamo · ${sentence.sourceRefIds[0]?.replace("Eldamo:", "") ?? "kuratierter Satzframe"}`;

const asContext = (sentence: GeneratedSentence): EngineExerciseContext => ({
  frame: sentence.frame,
  lexemeIds: sentence.lexemeIds,
  ruleIds: sentence.derivation.map((step) => step.ruleId),
  sourceRefIds: sentence.sourceRefIds,
});

function shuffledTokens(sentence: GeneratedSentence): string[] {
  const tokens = sentence.surface.replace(/[.!?,;:]/g, "").split(/\s+/);
  return tokens.length < 2 ? tokens : [...tokens.slice(1), tokens[0]];
}

function clozeWord(sentence: GeneratedSentence): string {
  return sentence.surface.replace(/[.!?,;:]/g, "").split(/\s+/).at(-1)!;
}

function clozeChoices(answer: string): string[] {
  const pool = ["mellon", "minno", "pedo", "beth", "govannen", "hannon"].filter(
    (word) => word !== answer,
  );
  return [answer, ...pool.slice(0, 2)];
}

function buildExercise(
  sentence: GeneratedSentence,
  kind: GeneratedExerciseKind,
): Exercise {
  const common = {
    id: `engine:${sentence.frame}:${kind}`,
    kind,
    status: "attested" as const,
    source: sourceLabel(sentence),
    engine: asContext(sentence),
  };

  switch (kind) {
    case "choice":
      return {
        ...common,
        prompt: `Welche Sindarin-Zeile bedeutet „${sentence.translation}“?`,
        choices: [sentence.surface, ...frameAlternatives[sentence.frame]],
        answer: sentence.surface,
      };
    case "order":
      return {
        ...common,
        prompt: `Ordne die Wörter: „${sentence.translation}“`,
        tokens: shuffledTokens(sentence),
        answer: sentence.surface,
      };
    case "cloze": {
      const answer = clozeWord(sentence);
      return {
        ...common,
        prompt: `Vervollständige: ${sentence.surface.replace(answer, "___")}`,
        choices: clozeChoices(answer),
        answer,
      };
    }
    case "type":
      return {
        ...common,
        prompt: `Tippe auf Sindarin: „${sentence.translation}“`,
        answer: sentence.surface,
        accepted: [sentence.surface.replace(/[.!?,;:]/g, "")],
      };
  }
}

function priority(
  sentence: GeneratedSentence,
  practiceSignals: Record<string, PracticeSignal>,
) {
  return [
    ...sentence.lexemeIds.map((id) => `lexeme:${id}`),
    ...sentence.derivation.map((step) => `rule:${step.ruleId}`),
  ].reduce((total, key) => total + (practiceSignals[key]?.misses ?? 0), 0);
}

/**
 * Produces deterministic, source-backed exercises. Weak lexemes or rules move
 * their frame earlier; forms always come from the syntax and rule engine.
 */
export function generateExercises({
  frames,
  kinds = allKinds,
  limit = frames.length * kinds.length,
  practiceSignals = {},
}: ExerciseGenerationRequest): Exercise[] {
  const sentences = frames
    .map(generateSentence)
    .sort((left, right) => priority(right, practiceSignals) - priority(left, practiceSignals));
  return sentences
    .flatMap((sentence) => kinds.map((kind) => buildExercise(sentence, kind)))
    .slice(0, limit);
}

const lessonRequests: Record<
  string,
  Omit<ExerciseGenerationRequest, "practiceSignals">
> = {
  gate: { frames: ["command-sequence"], kinds: ["choice", "order"] },
  ramp: { frames: ["command-sequence"], kinds: ["cloze", "type"] },
};

/** Only lessons whose declared lexemes cover a frame receive generated tasks. */
export function generatedExercisesForLesson(
  lessonId: string,
  practiceSignals: Record<string, PracticeSignal> = {},
): Exercise[] {
  const request = lessonRequests[lessonId];
  return request ? generateExercises({ ...request, practiceSignals }) : [];
}
