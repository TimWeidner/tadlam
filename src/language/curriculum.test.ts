import { describe, expect, it } from "vitest";
import { lessons } from "../domain";
import {
  curriculumMap,
  curriculumReport,
  validateCurriculum,
} from "./curriculum";

describe("curriculum validation", () => {
  it("keeps every currently declared course word traceable", () => {
    expect(validateCurriculum(lessons)).toEqual([]);
  });

  it("reports useful Unit coverage", () => {
    const [unitOne] = curriculumReport();
    expect(unitOne.unit).toBe(1);
    expect(unitOne.introduced).toContain("eldamo:2964964287");
    expect(unitOne.introduced).toContain("tadlam:hannon-le");
    expect(unitOne.gaps).toHaveLength(0);
  });

  it("rejects a word that is used before introduction", () => {
    const invalidMap = structuredClone(curriculumMap);
    invalidMap.entries = invalidMap.entries.map((entry) =>
      entry.lexemeId === "eldamo:2964964287"
        ? {
            ...entry,
            uses: entry.uses.filter((use) => use.role !== "introduced"),
          }
        : entry,
    );
    expect(validateCurriculum(lessons, invalidMap)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "used-before-introduction" }),
      ]),
    );
  });
});
