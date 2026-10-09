import { describe, expect, it } from "vitest";
import { isAnswerCorrect } from "../domain";
import { generateExercises, generatedExercisesForLesson } from "./exercise-generator";

describe("exercise generator MVP", () => {
  it("creates all supported exercise types from a curated frame", () => {
    const exercises = generateExercises({ frames: ["command-sequence"] });
    expect(exercises.map((exercise) => exercise.kind)).toEqual([
      "choice",
      "order",
      "cloze",
      "type",
    ]);
    expect(
      exercises.every(
        (exercise) => exercise.engine?.frame === "command-sequence",
      ),
    ).toBe(true);
  });

  it("keeps the generated order task intentionally scrambled", () => {
    const [exercise] = generateExercises({
      frames: ["command-sequence"],
      kinds: ["order"],
    });
    expect(exercise.tokens).toEqual(["mellon", "a", "minno", "Pedo"]);
    expect(exercise.answer).toBe("Pedo mellon a minno.");
  });

  it("routes typed engine answers through syntax validation", () => {
    const [exercise] = generateExercises({
      frames: ["direct-object-command"],
      kinds: ["type"],
    });
    expect(isAnswerCorrect(exercise, "Lasto beth")).toBe(true);
    expect(isAnswerCorrect(exercise, "Lasto peth")).toBe(false);
  });

  it("only adds frames to lessons that declare their vocabulary", () => {
    expect(generatedExercisesForLesson("arrival")).toEqual([]);
    expect(generatedExercisesForLesson("gate")).toHaveLength(2);
    expect(generatedExercisesForLesson("ramp")).toHaveLength(2);
  });

  it("prioritizes a frame with recorded weak rules", () => {
    const exercises = generateExercises({
      frames: ["command-sequence", "direct-object-command"],
      kinds: ["type"],
      practiceSignals: {
        "rule:soft-mutation-direct-object": {
          misses: 3,
          lastMissedAt: "2026-10-09",
        },
      },
    });
    expect(exercises[0].engine?.frame).toBe("direct-object-command");
  });
});
