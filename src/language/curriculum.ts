import curriculumMapJson from "../../language/curriculum-map.json";
import { unitsTwoToFiveLessons } from "../content/units-two-five";
import { unitsSixToTenLessons } from "../content/units-six-ten";
import type { Lesson } from "../domain";

export type CurriculumRole = "introduced" | "practised" | "reviewed";

export interface CurriculumUse {
  unit: number;
  lessonId: string;
  role: CurriculumRole;
  surface?: string;
}

export interface CurriculumEntry {
  lexemeId: string;
  uses: CurriculumUse[];
}

export interface CurriculumGap {
  term: string;
  unit: number;
  lessonId: string;
  reason: string;
}

export interface CurriculumMap {
  formatVersion: string;
  entries: CurriculumEntry[];
  gaps: CurriculumGap[];
}

const baseCurriculumMap = curriculumMapJson as CurriculumMap;

/**
 * Unit 1 is hand-mapped for its source-sensitive forms. Later units use the
 * same course metadata directly, so every active lesson still has a visible
 * introduction/practice history without duplicating that data by hand.
 */
function courseMapEntries(): CurriculumEntry[] {
  const alreadyIntroduced = new Set(
    baseCurriculumMap.entries.flatMap((entry) =>
      entry.uses
        .filter((use) => use.role === "introduced")
        .map(() => entry.lexemeId),
    ),
  );
  const usesByLexeme = new Map<string, CurriculumUse[]>();

  for (const lesson of [...unitsTwoToFiveLessons, ...unitsSixToTenLessons]) {
    for (const lexemeId of lesson.lexemeIds ?? []) {
      const uses = usesByLexeme.get(lexemeId) ?? [];
      uses.push({
        unit: lesson.unit,
        lessonId: lesson.id,
        role:
          lesson.phase === "review"
            ? "reviewed"
            : alreadyIntroduced.has(lexemeId)
              ? "practised"
              : "introduced",
      });
      alreadyIntroduced.add(lexemeId);
      usesByLexeme.set(lexemeId, uses);
    }
  }

  return [...usesByLexeme].map(([lexemeId, uses]) => ({ lexemeId, uses }));
}

const generatedCourseEntries = courseMapEntries();
const generatedUsesByLexeme = new Map(
  generatedCourseEntries.map((entry) => [entry.lexemeId, entry.uses]),
);

export const curriculumMap: CurriculumMap = {
  ...baseCurriculumMap,
  entries: [
    ...baseCurriculumMap.entries.map((entry) => ({
      ...entry,
      uses: [...entry.uses, ...(generatedUsesByLexeme.get(entry.lexemeId) ?? [])],
    })),
    ...generatedCourseEntries.filter(
      (entry) =>
        !baseCurriculumMap.entries.some(
          (baseEntry) => baseEntry.lexemeId === entry.lexemeId,
        ),
    ),
  ],
};

export interface CurriculumIssue {
  code:
    | "unknown-lesson"
    | "unit-mismatch"
    | "undeclared-lexeme"
    | "missing-use"
    | "used-before-introduction"
    | "undeclared-gap"
    | "missing-gap";
  message: string;
}

export interface UnitCurriculumReport {
  unit: number;
  introduced: string[];
  practised: string[];
  reviewed: string[];
  gaps: CurriculumGap[];
}

const lessonIndex = (lessons: Lesson[]) =>
  new Map(lessons.map((lesson, index) => [lesson.id, index]));

export function validateCurriculum(
  lessons: Lesson[],
  map: CurriculumMap = curriculumMap,
): CurriculumIssue[] {
  const issues: CurriculumIssue[] = [];
  const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const indices = lessonIndex(lessons);
  const introductions = new Map<string, number>();
  const documentedUses = new Set<string>();
  const documentedGaps = new Set<string>();

  for (const entry of map.entries) {
    for (const use of entry.uses) {
      const lesson = lessonsById.get(use.lessonId);
      const useKey = `${entry.lexemeId}:${use.lessonId}`;
      documentedUses.add(useKey);
      if (!lesson) {
        issues.push({
          code: "unknown-lesson",
          message: `${entry.lexemeId} verweist auf die unbekannte Lektion ${use.lessonId}.`,
        });
        continue;
      }
      if (lesson.unit !== use.unit) {
        issues.push({
          code: "unit-mismatch",
          message: `${entry.lexemeId} ist für Unit ${use.unit}, aber ${use.lessonId} gehört zu Unit ${lesson.unit}.`,
        });
      }
      if (!lesson.lexemeIds?.includes(entry.lexemeId)) {
        issues.push({
          code: "undeclared-lexeme",
          message: `${entry.lexemeId} ist in ${use.lessonId} kartiert, aber nicht in den Kursdaten deklariert.`,
        });
      }
      if (use.role === "introduced") {
        const index = indices.get(use.lessonId)!;
        const previous = introductions.get(entry.lexemeId);
        introductions.set(
          entry.lexemeId,
          previous === undefined ? index : Math.min(previous, index),
        );
      }
    }
  }

  for (const entry of map.entries) {
    for (const use of entry.uses) {
      if (use.role === "introduced") continue;
      const introductionIndex = introductions.get(entry.lexemeId);
      const useIndex = indices.get(use.lessonId);
      if (
        introductionIndex === undefined ||
        useIndex === undefined ||
        introductionIndex >= useIndex
      ) {
        issues.push({
          code: "used-before-introduction",
          message: `${entry.lexemeId} wird in ${use.lessonId} ${use.role}, bevor es eingeführt wurde.`,
        });
      }
    }
  }

  for (const gap of map.gaps) {
    const lesson = lessonsById.get(gap.lessonId);
    const gapKey = `${gap.term}:${gap.lessonId}`;
    documentedGaps.add(gapKey);
    if (!lesson) {
      issues.push({
        code: "unknown-lesson",
        message: `Die Lücke ${gap.term} verweist auf die unbekannte Lektion ${gap.lessonId}.`,
      });
      continue;
    }
    if (lesson.unit !== gap.unit) {
      issues.push({
        code: "unit-mismatch",
        message: `Die Lücke ${gap.term} ist für die falsche Unit dokumentiert.`,
      });
    }
    if (!lesson.curriculumGapTerms?.includes(gap.term)) {
      issues.push({
        code: "undeclared-gap",
        message: `Die Lücke ${gap.term} ist in ${gap.lessonId} nicht in den Kursdaten deklariert.`,
      });
    }
  }

  for (const lesson of lessons) {
    for (const lexemeId of lesson.lexemeIds ?? []) {
      if (!documentedUses.has(`${lexemeId}:${lesson.id}`)) {
        issues.push({
          code: "missing-use",
          message: `${lexemeId} wird in ${lesson.id} verwendet, aber nicht im Curriculum kartiert.`,
        });
      }
    }
    for (const term of lesson.curriculumGapTerms ?? []) {
      if (!documentedGaps.has(`${term}:${lesson.id}`)) {
        issues.push({
          code: "missing-gap",
          message: `Die deklarierte Lücke ${term} in ${lesson.id} fehlt im Curriculum-Bericht.`,
        });
      }
    }
  }

  return issues;
}

export function curriculumReport(
  map: CurriculumMap = curriculumMap,
): UnitCurriculumReport[] {
  const reports = new Map<number, UnitCurriculumReport>();
  const ensure = (unit: number) => {
    if (!reports.has(unit)) {
      reports.set(unit, {
        unit,
        introduced: [],
        practised: [],
        reviewed: [],
        gaps: [],
      });
    }
    return reports.get(unit)!;
  };

  for (const entry of map.entries) {
    for (const use of entry.uses) {
      ensure(use.unit)[use.role].push(entry.lexemeId);
    }
  }
  for (const gap of map.gaps) ensure(gap.unit).gaps.push(gap);
  return [...reports.values()].sort((left, right) => left.unit - right.unit);
}
