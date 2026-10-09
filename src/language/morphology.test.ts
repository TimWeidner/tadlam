import { describe, expect, it } from "vitest";
import { analyze, inflect } from "./morphology";

describe("morphology MVP", () => {
  it("forms the attested imperative minno from minna-", () => {
    const result = inflect("eldamo:2086508063", "imperative");
    expect(result?.surface).toBe("minno");
    expect(result?.derivation[0].ruleId).toBe("imperative-a-stem-to-o");
  });

  it("forms the attested imperative pedo from ped-", () => {
    const result = inflect("eldamo:599418975", "imperative");
    expect(result?.surface).toBe("pedo");
    expect(result?.derivation[0].ruleId).toBe("imperative-bare-stem-plus-o");
  });

  it("finds the lemma and derivation for an inflected input", () => {
    expect(analyze("Minno!")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lexemeId: "eldamo:2086508063",
          form: "imperative",
          surface: "minno",
        }),
      ]),
    );
  });

  it("keeps the curated Neo formula explicit and non-inflectable", () => {
    expect(inflect("tadlam:hannon-le")?.surface).toBe("Hannon le");
    expect(inflect("tadlam:hannon-le", "imperative")).toBeNull();
  });
});
