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
