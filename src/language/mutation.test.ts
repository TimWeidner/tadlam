import { describe, expect, it } from "vitest";
import { analyzeMutation, applyMutation } from "./mutation";

describe("soft mutation MVP", () => {
  it("mutates mellon to vellon as a direct object", () => {
    expect(
      applyMutation("eldamo:2964964287", "soft", "direct-object"),
    ).toMatchObject({
      base: "mellon",
      surface: "vellon",
      context: "direct-object",
    });
  });

  it("does not mutate the vocative mellon in pedo mellon a minno", () => {
    expect(applyMutation("eldamo:2964964287", "soft", "vocative")).toBeNull();
  });

  it("analyzes the mutated surface back to its lexical form", () => {
    expect(analyzeMutation("Vellon!")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lexemeId: "eldamo:2964964287",
          base: "mellon",
          surface: "vellon",
        }),
      ]),
    );
  });
});
