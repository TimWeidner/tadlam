import { describe, expect, it } from "vitest";
import {
  awardProgress,
  defaultProgress,
  isAnswerCorrect,
  isLessonUnlocked,
  lessons,
  migrateProgress,
  queueForReview,
  recordExerciseMiss,
  recordExerciseSuccess,
} from "./domain";
import { generatedExercisesForLesson } from "./language/exercise-generator";

describe("answer evaluation", () => {
  it("accepts case, punctuation and whitespace variations", () =>
    expect(isAnswerCorrect(lessons[0].exercises[5], "  MELLON.  ")).toBe(true));
  it("rejects a different answer", () =>
    expect(isAnswerCorrect(lessons[0].exercises[5], "Anor")).toBe(false));
});
describe("progress", () => {
  it("awards XP and starts a streak on a new day", () =>
    expect(awardProgress(defaultProgress(), 10, "2026-10-09")).toMatchObject({
      xp: 10,
      todayXp: 10,
      streak: 1,
    }));
  it("does not add a second streak day for same-day practice", () =>
    expect(
      awardProgress(
        awardProgress(defaultProgress(), 10, "2026-10-09"),
        10,
        "2026-10-09",
      ),
    ).toMatchObject({ todayXp: 20, streak: 1 }));
  it("queues a missed item just once for review", () =>
    expect(
      queueForReview(queueForReview(defaultProgress(), "a1"), "a1")
        .reviewExerciseIds,
    ).toEqual(["a1"]));
  it("records and then decays local rule-level practice signals", () => {
    const exercise = generatedExercisesForLesson("gate")[0];
    const missed = recordExerciseMiss(defaultProgress(), exercise, "2026-10-09");
    expect(missed.practiceSignals["rule:imperative-bare-stem-plus-o"]).toEqual({
      misses: 1,
      lastMissedAt: "2026-10-09",
    });
    expect(
      recordExerciseSuccess(missed, exercise).practiceSignals[
        "rule:imperative-bare-stem-plus-o"
      ]?.misses,
    ).toBe(0);
  });
  it("locks later lessons until their predecessor is done", () =>
    expect(isLessonUnlocked(lessons[1], defaultProgress())).toBe(false));
  it("does not let a legacy later completion bypass inserted learning steps", () =>
    expect(
      isLessonUnlocked(lessons[3], {
        ...defaultProgress(),
        completedLessonIds: ["arrival", "camp"],
      }),
    ).toBe(false));
  it("migrates the continuous prefix when legacy step ids still map directly", () =>
    expect(
      migrateProgress({ completedLessonIds: ["greetings", "nature"], xp: 30 })
        .completedLessonIds,
    ).toEqual(["arrival", "camp"]));
  it("keeps perfect markers only for completed lessons", () =>
    expect(
      migrateProgress({
        completedLessonIds: ["arrival"],
        perfectLessonIds: ["arrival", "camp"],
      }).perfectLessonIds,
    ).toEqual(["arrival"]));
  it("resets the incompatible XP-based daily goal from the first course", () =>
    expect(
      migrateProgress({
        completedLessonIds: ["greetings"],
        xp: 20,
        goal: 20,
        todayXp: 20,
        hearts: 5,
      }),
    ).toMatchObject({ goal: 8, todayXp: 0 }));
});
