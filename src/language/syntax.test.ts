import { describe, expect, it } from "vitest";
import { generateSentence, validateSentence } from "./syntax";

describe("syntax MVP", () => {
  it("generates the attested command sequence from curated imperatives", () => {
    const sentence = generateSentence("command-sequence");
    expect(sentence.surface).toBe("Pedo mellon a minno.");
    expect(sentence.derivation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "imperative-bare-stem-plus-o" }),
        expect.objectContaining({ ruleId: "vocative-keeps-base-form" }),
        expect.objectContaining({ ruleId: "imperative-a-stem-to-o" }),
      ]),
    );
  });

  it("uses a soft mutation for the curated direct object", () => {
    const sentence = generateSentence("direct-object-command");
    expect(sentence.surface).toBe("Lasto beth.");
    expect(sentence.derivation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "soft-mutation-direct-object",
          from: "peth",
          to: "beth",
        }),
      ]),
    );
  });

  it("accepts harmless capitalization and punctuation variation", () => {
    expect(validateSentence("command-sequence", "pedo mellon a minno")).toMatchObject({
      status: "valid",
    });
  });

  it("explains a mismatch without rejecting unparsed free Sindarin globally", () => {
    expect(validateSentence("direct-object-command", "Lasto peth.")).toEqual(
      expect.objectContaining({
        status: "invalid",
        errors: [
          expect.objectContaining({
            expected: "Lasto beth.",
            ruleId: "frame-surface-mismatch",
          }),
        ],
      }),
    );
  });
});
