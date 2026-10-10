import { describe, expect, it } from "vitest";
import { randomizedMatchPairs, shuffled } from "./exercise-presentation";

describe("exercise presentation", () => {
  it("shuffles a copy without changing the authored order", () => {
    const source = ["first", "second", "third", "fourth"];
    const randomValues = [0, 0.5, 0.25];
    const random = () => randomValues.shift()!;

    expect(shuffled(source, random)).toEqual([
      "third",
      "fourth",
      "second",
      "first",
    ]);
    expect(source).toEqual(["first", "second", "third", "fourth"]);
  });

  it("never presents matching columns in the same row", () => {
    const pairs = [
      { left: "mellon", right: "Freund" },
      { left: "taur", right: "Wald" },
      { left: "annon", right: "Tor" },
    ];

    const presentation = randomizedMatchPairs(pairs, () => 0.999);

    expect(presentation.left.map((pair) => pair.left)).not.toEqual(
      presentation.right.map((pair) => pair.left),
    );
    expect(pairs.map((pair) => pair.left)).toEqual([
      "mellon",
      "taur",
      "annon",
    ]);
  });
});
