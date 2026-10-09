import { describe, expect, it } from "vitest";
import { explainValidation, validateExerciseAnswer } from "./validation";

describe("exercise validation MVP", () => {
  it("accepts a generated sentence and exposes its rule trace", () => {
    const result = validateExerciseAnswer("command-sequence", "pedo mellon a minno");
    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(explainValidation(result)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ruleId: "imperative-bare-stem-plus-o" }),
        ]),
      );
    }
  });

  it("explains the missing mutation in a direct-object answer", () => {
    expect(
      validateExerciseAnswer("direct-object-command", "Lasto peth."),
    ).toEqual(
      expect.objectContaining({
        status: "invalid",
        errors: [
          expect.objectContaining({
            code: "missing-required-mutation",
            expected: "beth",
          }),
        ],
      }),
    );
  });

  it("explains when a stem is used instead of a required imperative", () => {
    expect(
      validateExerciseAnswer("command-sequence", "Ped, mellon, a minno."),
    ).toEqual(
      expect.objectContaining({
        status: "invalid",
        errors: [
          expect.objectContaining({
            code: "missing-required-inflection",
            expected: "pedo",
          }),
        ],
      }),
    );
  });

  it("flags a mutation in an unlicensed context", () => {
    expect(
      validateExerciseAnswer("command-sequence", "Pedo vellon a minno."),
    ).toEqual(
      expect.objectContaining({
        status: "invalid",
        errors: [expect.objectContaining({ code: "unexpected-mutation" })],
      }),
    );
  });

  it("sends unknown free input to review instead of calling it wrong", () => {
    expect(
      validateExerciseAnswer("direct-object-command", "Lasto glar.")
    ).toEqual(
      expect.objectContaining({
        status: "review",
        reasons: [expect.objectContaining({ code: "unknown-form", token: "glar" })],
      }),
    );
  });
});
