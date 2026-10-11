import type { Exercise, Lesson } from "../domain";
import {
  generatedExercisesForLesson,
  type PracticeSignal,
} from "./exercise-generator";

/** A Tadlam lesson is a compact, consistent 15-exercise play session. */
export const LESSON_EXERCISE_TARGET = 15;

/**
 * A published lesson must bring its own varied, reviewed fifteen-question
 * pool. The client refuses to pad a session with copied questions.
 */
export function lessonExerciseSet(
  lesson: Lesson,
  practiceSignals: Record<string, PracticeSignal> = {},
): Exercise[] {
  const source =
    lesson.exercises.length >= LESSON_EXERCISE_TARGET
      ? lesson.exercises
      : [
          ...lesson.exercises,
          ...generatedExercisesForLesson(lesson.id, practiceSignals),
        ];
  if (source.length !== LESSON_EXERCISE_TARGET) {
    throw new Error(
      `Lektion ${lesson.id} hat ${source.length} Übungen; erwartet werden ${LESSON_EXERCISE_TARGET}.`,
    );
  }
  return source;
}

type PracticeSignals = Record<string, PracticeSignal>;

interface ReviewCandidate {
  exercise: Exercise;
  lesson: Lesson;
}

function conceptKeys(candidate: ReviewCandidate): string[] {
  const { exercise, lesson } = candidate;
  return [
    `exercise:${exercise.id}`,
    ...(exercise.engine?.lexemeIds ?? exercise.lexemeIds ?? lesson.lexemeIds ?? []).map(
      (id) => `lexeme:${id}`,
    ),
    ...(exercise.engine?.ruleIds ?? exercise.grammarIds ?? []).map(
      (id) => `rule:${id}`,
    ),
  ];
}

function weakness(candidate: ReviewCandidate, practiceSignals: PracticeSignals) {
  return conceptKeys(candidate).reduce(
    (total, key) => total + signalWeight(practiceSignals[key]),
    0,
  );
}

/** Current misses lead; a resolved miss remains a light long-term signal. */
function signalWeight(signal: PracticeSignal | undefined) {
  if (!signal?.lastMissedAt) return 0;
  return signal.misses > 0 ? 10 + signal.misses : 1;
}

function rememberedKeys(practiceSignals: PracticeSignals) {
  return Object.entries(practiceSignals)
    .filter(([, signal]) => Boolean(signal.lastMissedAt))
    .sort(([, left], [, right]) => signalWeight(right) - signalWeight(left))
    .map(([key]) => key);
}

function selectRelatedReview(
  candidates: ReviewCandidate[],
  fallback: Exercise[],
  practiceSignals: PracticeSignals,
): Exercise[] {
  const weakKeys = rememberedKeys(practiceSignals);
  if (!weakKeys.length) return fallback;

  const selected: Exercise[] = [];
  const selectedIds = new Set<string>();
  const add = (candidate: ReviewCandidate | undefined) => {
    if (!candidate || selectedIds.has(candidate.exercise.id)) return;
    selected.push(candidate.exercise);
    selectedIds.add(candidate.exercise.id);
  };
  const ranked = [...candidates].sort(
    (left, right) => weakness(right, practiceSignals) - weakness(left, practiceSignals),
  );

  // For every remembered concept, choose a neighbouring question before the
  // exact error. This turns a past miss into transferable practice.
  for (const key of weakKeys) {
    if (selected.length >= 8) break;
    const related = ranked.find(
      (candidate) =>
        candidate.exercise.id !== key.replace("exercise:", "") &&
        conceptKeys(candidate).includes(key),
    );
    add(related);
  }
  for (const candidate of ranked) {
    if (selected.length >= 8) break;
    add(candidate);
  }
  for (const exercise of fallback) {
    if (selected.length >= LESSON_EXERCISE_TARGET) break;
    if (!selectedIds.has(exercise.id)) {
      selected.push(exercise);
      selectedIds.add(exercise.id);
    }
  }
  for (const candidate of ranked) {
    if (selected.length >= LESSON_EXERCISE_TARGET) break;
    add(candidate);
  }
  return selected.slice(0, LESSON_EXERCISE_TARGET);
}

/**
 * Builds the in-path revision lesson from older work. A missed task can return
 * directly, but a different task sharing its word or grammar rule is selected
 * first whenever possible. The authored review remains the balanced fallback.
 */
export function adaptiveReviewExerciseSet(
  reviewLesson: Lesson,
  courseLessons: Lesson[],
  practiceSignals: PracticeSignals = {},
): Exercise[] {
  const authored = lessonExerciseSet(reviewLesson, practiceSignals);
  if (reviewLesson.phase !== "review" || reviewLesson.unit < 5) return authored;

  const earlier: ReviewCandidate[] = courseLessons
    .filter((lesson) => lesson.unit < reviewLesson.unit)
    .flatMap((lesson) =>
      lessonExerciseSet(lesson, practiceSignals).map((exercise) => ({ exercise, lesson })),
    );
  return selectRelatedReview(earlier, authored, practiceSignals);
}

/** Personal review uses the same concept links as the in-path review nodes. */
export function personalReviewExerciseSet(
  courseLessons: Lesson[],
  practiceSignals: PracticeSignals = {},
): Exercise[] {
  const candidates = courseLessons.flatMap((lesson) =>
    lessonExerciseSet(lesson, practiceSignals).map((exercise) => ({ exercise, lesson })),
  );
  return selectRelatedReview(candidates, [], practiceSignals);
}
