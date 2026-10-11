import { describe, expect, it } from "vitest";
import { lessons } from "../domain";
import { defaultProgress, recordExerciseMiss } from "../domain";
import {
  adaptiveReviewExerciseSet,
  LESSON_EXERCISE_TARGET,
  lessonExerciseSet,
} from "./lesson-exercises";

describe("lesson exercise set", () => {
  it("gives every playable lesson exactly fifteen exercises", () => {
    expect(lessons.map((lesson) => lessonExerciseSet(lesson).length)).toEqual(
      lessons.map(() => LESSON_EXERCISE_TARGET),
    );
  });

  it("publishes ten contiguous, playable course units", () => {
    expect([...new Set(lessons.map((lesson) => lesson.unit))]).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(lessons.filter((lesson) => lesson.unit === 1)).toHaveLength(4);
    for (const unit of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const unitLessons = lessons.filter((lesson) => lesson.unit === unit);
      expect(unitLessons).toHaveLength(5);
      expect(unitLessons[2].phase).toBe("review");
    }
  });

  it("uses a fully authored pool with unique question ids", () => {
    const exercises = lessonExerciseSet(lessons[0]);
    expect(exercises.slice(0, 4).map((exercise) => exercise.id)).toEqual([
      "u1a1",
      "u1a2",
      "u1a3",
      "u1a4",
    ]);
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(
      LESSON_EXERCISE_TARGET,
    );
  });

  it("keeps every course round varied instead of mechanically recycling a prompt", () => {
    for (const lesson of lessons) {
      const exercises = lessonExerciseSet(lesson);
      expect(new Set(exercises.map((exercise) => exercise.prompt)).size, lesson.id).toBe(
        LESSON_EXERCISE_TARGET,
      );
      expect(new Set(exercises.map((exercise) => exercise.kind)).size).toBeGreaterThanOrEqual(3);
    }
  });

  it("does not use abstract sequence questions", () => {
    expect(
      lessons.flatMap((lesson) => lesson.exercises).some((exercise) =>
        exercise.prompt.includes("Welche Abfolge passt"),
      ),
    ).toBe(false);
  });

  it("does not quiz source-status labels", () => {
    expect(
      lessons.flatMap((lesson) => lesson.exercises).some((exercise) =>
        /belegt|neo-sindarin|status/i.test(exercise.prompt),
      ),
    ).toBe(false);
  });

  it("keeps typed answers in the first unit to single words", () => {
    const unitOneExercises = lessons
      .filter((lesson) => lesson.unit === 1)
      .flatMap((lesson) => lesson.exercises);

    expect(
      unitOneExercises
        .filter((exercise) => exercise.kind === "type")
        .every((exercise) => !/\s/.test(exercise.answer)),
    ).toBe(true);
    expect(
      unitOneExercises.some((exercise) =>
        /tor-aufforderung/i.test(exercise.prompt),
      ),
    ).toBe(false);
    expect(
      unitOneExercises.some((exercise) => /inschrift/i.test(exercise.prompt)),
    ).toBe(false);
  });

  it("rejects an incomplete authored pool instead of cloning questions", () => {
    expect(() => lessonExerciseSet({ ...lessons[0], exercises: [] })).toThrow(
      "erwartet werden 15",
    );
  });

  it("turns a miss into related vocabulary and grammar practice from Unit 5 onward", () => {
    const weakLesson = lessons.find((lesson) => lesson.id === "u4-gates")!;
    const weakExercise = weakLesson.exercises[0];
    const progress = recordExerciseMiss(
      defaultProgress(),
      weakExercise,
      "2026-10-11",
      weakLesson.lexemeIds,
    );
    const reviewLesson = lessons.find((lesson) => lesson.id === "u5-review")!;
    const exercises = adaptiveReviewExerciseSet(
      reviewLesson,
      lessons,
      progress.practiceSignals,
    );

    expect(exercises).toHaveLength(LESSON_EXERCISE_TARGET);
    expect(exercises.map((exercise) => exercise.id)).toContain(weakExercise.id);
    expect(
      exercises.filter(
        (exercise) =>
          exercise.id !== weakExercise.id &&
          exercise.lexemeIds?.includes(weakExercise.lexemeIds![0]),
      ),
    ).not.toHaveLength(0);
    expect(
      exercises.some(
        (exercise) =>
          exercise.id !== weakExercise.id &&
          exercise.grammarIds?.includes("singular-plural"),
      ),
    ).toBe(true);
  });
});
