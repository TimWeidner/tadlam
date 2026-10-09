import { describe, expect, it } from "vitest";
import unitOneJson from "../../language/course-plans/unit-01.json";
import unitTwoJson from "../../language/course-plans/unit-02.json";
import { compileUnitContent, type UnitContentPlan } from "./content-compiler";

const unitOne = unitOneJson as UnitContentPlan;
const unitTwo = unitTwoJson as UnitContentPlan;

describe("content compiler", () => {
  it("does not add an empty review node to the first Unit", () => {
    const nodes = compileUnitContent({ plan: unitOne, knownLexemeIds: [] });

    expect(nodes.map((node) => node.phase)).toEqual([
      "new",
      "new",
      "grammar",
      "ramp",
    ]);
    expect(nodes.every((node) => node.lexemeIds.length > 0)).toBe(true);
    expect(nodes.every((node) => node.exerciseCount === 15)).toBe(true);
    expect(nodes.filter((node) => node.phase === "new").every((node) => node.lexemeIds.length <= 8)).toBe(true);
  });

  it("only adds repetition when there is enough older vocabulary", () => {
    const knownLexemeIds = unitOne.newLexemes.map((lexeme) => lexeme.lexemeId);
    const nodes = compileUnitContent({
      plan: unitTwo,
      knownLexemeIds,
      practiceSignals: {
        [`lexeme:${knownLexemeIds[4]}`]: {
          misses: 3,
          lastMissedAt: "2026-10-09",
        },
      },
    });
    const review = nodes.find((node) => node.phase === "review");

    expect(review).toMatchObject({ title: "Wiederholen, was wackelt" });
    expect(review?.lexemeIds[0]).toBe(knownLexemeIds[4]);
    expect(nodes.map((node) => node.phase)).toEqual([
      "new",
      "new",
      "review",
      "ramp",
    ]);
  });

  it("never creates a placeholder grammar lesson for reference-only topics", () => {
    const plan: UnitContentPlan = {
      ...unitOne,
      grammarComponents: ["adverbs"],
    };
    expect(
      compileUnitContent({ plan, knownLexemeIds: [] }).map((node) => node.phase),
    ).toEqual(["new", "new", "ramp"]);
  });
});
