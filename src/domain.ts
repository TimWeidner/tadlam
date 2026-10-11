import { lessonExerciseSet } from "./language/lesson-exercises";
import { validateExerciseAnswer } from "./language/validation";
import type { SyntaxFrame } from "./language/syntax";
import { unitOneLessons } from "./content/unit-one";
import { unitsTwoToFiveLessons } from "./content/units-two-five";
import { unitsSixToTenLessons } from "./content/units-six-ten";

export type LanguageStatus = "attested" | "neo";
export type ExerciseKind = "choice" | "cloze" | "order" | "type" | "match";

export interface EngineExerciseContext {
  frame: SyntaxFrame;
  lexemeIds: string[];
  ruleIds: string[];
  sourceRefIds: string[];
}

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  prompt: string;
  hint?: string;
  pronunciation?: string;
  status: LanguageStatus;
  source: string;
  answer: string;
  accepted?: string[];
  choices?: string[];
  tokens?: string[];
  pairs?: Array<{ left: string; right: string }>;
  /** Learning concepts that make this task a useful alternate review item. */
  lexemeIds?: string[];
  grammarIds?: string[];
  engine?: EngineExerciseContext;
}

export type LessonPhase = "new" | "practice" | "review" | "grammar" | "ramp";
export interface Lesson {
  id: string;
  unit: number;
  title: string;
  subtitle: string;
  icon: string;
  phase: LessonPhase;
  lexemeIds?: string[];
  curriculumGapTerms?: string[];
  exercises: Exercise[];
}
export interface Progress {
  completedLessonIds: string[];
  perfectLessonIds: string[];
  currentLessonId: string;
  xp: number;
  goal: number;
  lastPracticeDate: string | null;
  todayXp: number;
  streak: number;
  reviewExerciseIds: string[];
  practiceSignals: Record<string, { misses: number; lastMissedAt: string }>;
}

export const todayKey = (date = new Date()) => date.toISOString().slice(0, 10);
export const statusLabel = (status: LanguageStatus) =>
  status === "neo" ? "Neo" : "belegt";
export function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/[.!?,;:]/g, "")
    .normalize("NFC");
}
export function isAnswerCorrect(exercise: Exercise, answer: string) {
  if (
    exercise.engine &&
    ["choice", "order", "type"].includes(exercise.kind)
  ) {
    return validateExerciseAnswer(exercise.engine.frame, answer).status === "valid";
  }
  return [exercise.answer, ...(exercise.accepted ?? [])]
    .map(normalizeAnswer)
    .includes(normalizeAnswer(answer));
}
export function defaultProgress(): Progress {
  return {
    completedLessonIds: [],
    perfectLessonIds: [],
    currentLessonId: "arrival",
    xp: 0,
    goal: 8,
    lastPracticeDate: null,
    todayXp: 0,
    streak: 0,
    reviewExerciseIds: [],
    practiceSignals: {},
  };
}
export function migrateProgress(
  value: Partial<Progress> & { hearts?: unknown },
): Progress {
  const defaults = defaultProgress();
  const lessonIds: Record<string, string> = {
    greetings: "arrival",
    nature: "camp",
    people: "gate",
  };
  const isLegacy = Object.prototype.hasOwnProperty.call(value, "hearts");
  const completedCandidates = Array.isArray(value.completedLessonIds)
    ? value.completedLessonIds
        .map((id) => lessonIds[id] ?? id)
        .filter((id) => lessons.some((lesson) => lesson.id === id))
    : [];
  // A lesson cannot be complete while an earlier course step is still open.
  // This also keeps progress from older course shapes from creating green islands.
  const completed: string[] = [];
  for (const lesson of lessons) {
    if (!completedCandidates.includes(lesson.id)) break;
    completed.push(lesson.id);
  }
  return {
    ...defaults,
    ...value,
    completedLessonIds: [...new Set(completed)],
    perfectLessonIds: Array.isArray(value.perfectLessonIds)
      ? [
          ...new Set(
            value.perfectLessonIds.filter((id) => completed.includes(id)),
          ),
        ]
      : [],
    currentLessonId:
      lessonIds[value.currentLessonId ?? ""] ??
      value.currentLessonId ??
      defaults.currentLessonId,
    reviewExerciseIds: Array.isArray(value.reviewExerciseIds)
      ? value.reviewExerciseIds.filter((id) =>
          allExercises.some((exercise) => exercise.id === id),
        )
      : [],
    practiceSignals:
      value.practiceSignals && typeof value.practiceSignals === "object"
        ? Object.fromEntries(
            Object.entries(value.practiceSignals).flatMap(([key, signal]) => {
              if (!signal || typeof signal !== "object") return [];
              const candidate = signal as {
                misses?: unknown;
                lastMissedAt?: unknown;
              };
              if (
                typeof candidate.misses !== "number" ||
                typeof candidate.lastMissedAt !== "string"
              )
                return [];
              return [[key, {
                misses: Math.max(0, candidate.misses),
                lastMissedAt: candidate.lastMissedAt,
              }]];
            }),
          )
        : defaults.practiceSignals,
    xp: typeof value.xp === "number" ? value.xp : defaults.xp,
    goal:
      !isLegacy && [5, 8, 12].includes(value.goal ?? 0)
        ? value.goal!
        : defaults.goal,
    streak: typeof value.streak === "number" ? value.streak : defaults.streak,
    todayXp:
      !isLegacy && typeof value.todayXp === "number"
        ? value.todayXp
        : defaults.todayXp,
  };
}
export function awardProgress(
  progress: Progress,
  amount: number,
  date = todayKey(),
): Progress {
  const isNewDay = progress.lastPracticeDate !== date;
  return {
    ...progress,
    xp: progress.xp + amount,
    todayXp: isNewDay ? amount : progress.todayXp + amount,
    lastPracticeDate: date,
    streak: isNewDay ? progress.streak + 1 : progress.streak,
  };
}
export function queueForReview(
  progress: Progress,
  exerciseId: string,
): Progress {
  return progress.reviewExerciseIds.includes(exerciseId)
    ? progress
    : {
        ...progress,
        reviewExerciseIds: [...progress.reviewExerciseIds, exerciseId],
      };
}

function practiceSignalKeys(
  exercise: Exercise,
  fallbackLexemeIds: string[] = [],
): string[] {
  const lexemeIds = exercise.engine?.lexemeIds ?? exercise.lexemeIds ?? fallbackLexemeIds;
  const grammarIds = exercise.engine?.ruleIds ?? exercise.grammarIds ?? [];
  return [
    `exercise:${exercise.id}`,
    ...lexemeIds.map((id) => `lexeme:${id}`),
    ...grammarIds.map((id) => `rule:${id}`),
  ];
}

export function recordExerciseMiss(
  progress: Progress,
  exercise: Exercise,
  date = todayKey(),
  fallbackLexemeIds: string[] = [],
): Progress {
  const practiceSignals = { ...progress.practiceSignals };
  for (const key of practiceSignalKeys(exercise, fallbackLexemeIds)) {
    const previous = practiceSignals[key];
    practiceSignals[key] = {
      misses: (previous?.misses ?? 0) + 1,
      lastMissedAt: date,
    };
  }
  return { ...progress, practiceSignals };
}

export function recordExerciseSuccess(
  progress: Progress,
  exercise: Exercise,
  fallbackLexemeIds: string[] = [],
): Progress {
  const practiceSignals = { ...progress.practiceSignals };
  for (const key of practiceSignalKeys(exercise, fallbackLexemeIds)) {
    const previous = practiceSignals[key];
    if (!previous) continue;
    practiceSignals[key] = { ...previous, misses: Math.max(0, previous.misses - 1) };
  }
  return { ...progress, practiceSignals };
}

const legacyLessons: Lesson[] = [
  {
    id: "arrival",
    unit: 1,
    title: "Am Lager ankommen",
    subtitle: "Neue Wörter · Begrüßen",
    icon: "✦",
    phase: "new",
    lexemeIds: ["eldamo:3420722951", "eldamo:2338511755", "eldamo:2964964287"],
    exercises: [
      {
        id: "a1",
        kind: "choice",
        prompt: "Was drückt „Mae govannen!“ aus?",
        choices: ["Sei gegrüßt!", "Ich heiße …", "Bis morgen!"],
        answer: "Sei gegrüßt!",
        pronunciation: "MAI go-VAN-nen",
        hint: "Eine belegte Grußformel.",
        status: "attested",
        source: "LotR · Moria-Tor",
      },
      {
        id: "a2",
        kind: "cloze",
        prompt: "Ergänze die Begrüßung: Mae ___!",
        choices: ["govannen", "mellon", "annon"],
        answer: "govannen",
        pronunciation: "MAI go-VAN-nen",
        hint: "Die Formel bedeutet sinngemäß „wohl getroffen“.",
        status: "attested",
        source: "LotR · Moria-Tor",
      },
      {
        id: "a3",
        kind: "type",
        prompt: "Tippe das Sindarin-Wort für „Freund“.",
        answer: "mellon",
        pronunciation: "MEL-lon",
        hint: "Das Wort öffnet ein berühmtes Tor.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
      {
        id: "a4",
        kind: "order",
        prompt: "Baue die feste Formel „Sei gegrüßt!“",
        tokens: ["Mae", "govannen!"],
        answer: "Mae govannen!",
        pronunciation: "MAI go-VAN-nen",
        hint: "Beginne mit „Mae“.",
        status: "attested",
        source: "LotR · Moria-Tor",
      },
    ],
  },
  {
    id: "arrival-practice",
    unit: 1,
    title: "Begrüßungen üben",
    subtitle: "Wörter anwenden",
    icon: "◎",
    phase: "practice",
    lexemeIds: ["eldamo:3420722951", "eldamo:2338511755", "eldamo:2964964287"],
    exercises: [
      {
        id: "ap1",
        kind: "choice",
        prompt: "Was bedeutet „mellon“?",
        choices: ["Freund", "Tor", "Wald"],
        answer: "Freund",
        pronunciation: "MEL-lon",
        hint: "Ein Wort aus der Moria-Inschrift.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
      {
        id: "ap2",
        kind: "cloze",
        prompt: "Vervollständige: Mae ___!",
        choices: ["govannen", "minno", "taur"],
        answer: "govannen",
        pronunciation: "MAI go-VAN-nen",
        hint: "Die Begrüßung vom ersten Knoten.",
        status: "attested",
        source: "LotR · Moria-Tor",
      },
      {
        id: "ap3",
        kind: "order",
        prompt: "Baue die Begrüßung erneut.",
        tokens: ["Mae", "govannen!"],
        answer: "Mae govannen!",
        pronunciation: "MAI go-VAN-nen",
        hint: "Wiederholung macht Formen sicher.",
        status: "attested",
        source: "LotR · Moria-Tor",
      },
      {
        id: "ap4",
        kind: "type",
        prompt: "Tippe: Freund",
        answer: "mellon",
        pronunciation: "MEL-lon",
        hint: "Jetzt ohne Auswahlhilfe.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
    ],
  },
  {
    id: "camp",
    unit: 1,
    title: "Im Lager",
    subtitle: "Neue Wörter · Höflichkeit",
    icon: "⌁",
    phase: "new",
    lexemeIds: [
      "tadlam:hannon-le",
      "eldamo:2964964287",
      "eldamo:3606114301",
      "eldamo:809570117",
    ],
    exercises: [
      {
        id: "c1",
        kind: "choice",
        prompt: "Was bedeutet „Hannon le“?",
        choices: ["Danke dir", "Folge mir", "Wo ist das Lager?"],
        answer: "Danke dir",
        pronunciation: "HAN-non leh",
        hint: "Eine praktische Neo-Sindarin-Höflichkeitsformel.",
        status: "neo",
        source: "Neo-Sindarin · Kurskonvention",
      },
      {
        id: "c2",
        kind: "match",
        prompt: "Ordne die Wörter ihren Bedeutungen zu.",
        pairs: [
          { left: "mellon", right: "Freund" },
          { left: "annon", right: "Tor" },
          { left: "taur", right: "Wald" },
        ],
        answer: "match",
        hint: "Du hast drei Versuche; richtige Paare bleiben bestehen.",
        status: "attested",
        source: "LotR · Wörter & Namen",
      },
      {
        id: "c3",
        kind: "cloze",
        prompt: "Ein großer Eingang ist ein ___.",
        choices: ["annon", "mellon", "galad"],
        answer: "annon",
        pronunciation: "AN-non",
        hint: "Wie beim Tor von Moria.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
      {
        id: "c4",
        kind: "type",
        prompt: "Tippe das Wort für „Wald“.",
        answer: "taur",
        pronunciation: "TAUR",
        hint: "Eine nützliche Ortsangabe im Spiel.",
        status: "attested",
        source: "Sindarin · Ortsnamen",
      },
    ],
  },
  {
    id: "camp-review",
    unit: 1,
    title: "Lagerfeuer-Mix",
    subtitle: "Wiederholung · bisherige Wörter",
    icon: "↻",
    phase: "review",
    lexemeIds: [
      "tadlam:hannon-le",
      "eldamo:2964964287",
      "eldamo:3606114301",
      "eldamo:809570117",
    ],
    exercises: [
      {
        id: "cr1",
        kind: "match",
        prompt: "Ordne alte und neue Wörter zu.",
        pairs: [
          { left: "mellon", right: "Freund" },
          { left: "taur", right: "Wald" },
          { left: "annon", right: "Tor" },
        ],
        answer: "match",
        hint: "Hier treffen Wörter aus allen bisherigen Knoten zusammen.",
        status: "attested",
        source: "LotR · Wörter & Namen",
      },
      {
        id: "cr2",
        kind: "choice",
        prompt: "Welche Formel passt nach einer Hilfe im Lager?",
        choices: ["Hannon le", "Mae govannen", "Pedo mellon"],
        answer: "Hannon le",
        pronunciation: "HAN-non leh",
        hint: "Eine Neo-Sindarin-Höflichkeitsformel.",
        status: "neo",
        source: "Neo-Sindarin · Kurskonvention",
      },
      {
        id: "cr3",
        kind: "type",
        prompt: "Tippe das Wort für „Tor“.",
        answer: "annon",
        pronunciation: "AN-non",
        hint: "Ein Wort aus der Moria-Inschrift.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
      {
        id: "cr4",
        kind: "cloze",
        prompt: "Ein ___ ist ein Freund.",
        choices: ["mellon", "taur", "annon"],
        answer: "mellon",
        pronunciation: "MEL-lon",
        hint: "Wortschatz aus dem ersten Knoten.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
    ],
  },
  {
    id: "gate",
    unit: 1,
    title: "Vor dem Tor",
    subtitle: "Grammatik · Imperative",
    icon: "❋",
    phase: "grammar",
    lexemeIds: ["eldamo:2086508063", "eldamo:599418975", "eldamo:3670583905"],
    exercises: [
      {
        id: "g1",
        kind: "choice",
        prompt: "„Pedo mellon a minno“ bedeutet ungefähr …",
        choices: [
          "Sprich Freund und tritt ein",
          "Der Freund bewacht das Tor",
          "Willkommen im Wald",
        ],
        answer: "Sprich Freund und tritt ein",
        pronunciation: "PE-do MEL-lon a MIN-no",
        hint: "Eine feste Inschrift, keine frei erzeugte Alltagssprache.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
      {
        id: "g2",
        kind: "order",
        prompt: "Ordne die Wörter der Moria-Inschrift.",
        tokens: ["Pedo", "mellon", "a", "minno."],
        answer: "Pedo mellon a minno.",
        pronunciation: "PE-do MEL-lon a MIN-no",
        hint: "Das kleine „a“ bedeutet „und“.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
      {
        id: "g3",
        kind: "choice",
        prompt: "Was bedeutet „minno“?",
        choices: ["tritt ein!", "sprich!", "Freund"],
        answer: "tritt ein!",
        pronunciation: "MIN-no",
        hint: "Ein Imperativ.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
      {
        id: "g4",
        kind: "type",
        prompt: "Tippe das Wort für „und“ aus der Inschrift.",
        answer: "a",
        pronunciation: "A",
        hint: "Nur ein Buchstabe.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
    ],
  },
  {
    id: "ramp",
    unit: 1,
    title: "Ramp-up: Das Tor",
    subtitle: "Gemischte Abschlussrunde",
    icon: "◆",
    phase: "ramp",
    lexemeIds: ["eldamo:2086508063", "eldamo:599418975", "eldamo:3670583905"],
    exercises: [
      {
        id: "r1",
        kind: "choice",
        prompt: "Was bedeutet „pedo“?",
        choices: ["sprich!", "tritt ein!", "Freund"],
        answer: "sprich!",
        pronunciation: "PE-do",
        hint: "Ein Imperativ aus der Inschrift.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
      {
        id: "r2",
        kind: "cloze",
        prompt: "Vervollständige: Pedo mellon a ___.",
        choices: ["minno", "govannen", "annon"],
        answer: "minno",
        pronunciation: "MIN-no",
        hint: "Jetzt setzt du mehrere bekannte Wörter zusammen.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
      {
        id: "r3",
        kind: "order",
        prompt: "Baue „Sprich Freund und tritt ein“.",
        tokens: ["Pedo", "mellon", "a", "minno."],
        answer: "Pedo mellon a minno.",
        pronunciation: "PE-do MEL-lon a MIN-no",
        hint: "Dein erster kleiner Lese-Moment.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
      {
        id: "r4",
        kind: "type",
        prompt: "Tippe: tritt ein!",
        answer: "minno",
        pronunciation: "MIN-no",
        hint: "Der letzte Baustein der Inschrift.",
        status: "attested",
        source: "LotR · Moria-Inschrift",
      },
    ],
  },
];

// Kept temporarily for migration documentation. The active Unit 1 uses the
// curated four-lesson pool, not the earlier six-node prototype above.
void legacyLessons;
export const lessons: Lesson[] = [
  ...unitOneLessons,
  ...unitsTwoToFiveLessons,
  ...unitsSixToTenLessons,
];
export const allExercises = lessons.flatMap((lesson) => lessonExerciseSet(lesson));
export const findExercise = (id: string) =>
  allExercises.find((exercise) => exercise.id === id);
export function isLessonUnlocked(lesson: Lesson, progress: Progress) {
  const index = lessons.findIndex((item) => item.id === lesson.id);
  return (
    index <= 0 ||
    lessons
      .slice(0, index)
      .every((previous) => progress.completedLessonIds.includes(previous.id))
  );
}
