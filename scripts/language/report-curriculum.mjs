import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const packPath = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(workspace, "src/language/generated/eldamo-lexicon.json");
const pack = JSON.parse(await readFile(packPath, "utf8"));
const units = new Map();

const reportFor = (unit) => {
  if (!units.has(unit)) {
    units.set(unit, {
      introduced: new Set(),
      practised: new Set(),
      reviewed: new Set(),
      gaps: [],
    });
  }
  return units.get(unit);
};

for (const lexeme of pack.lexemes) {
  for (const use of lexeme.curriculum?.uses ?? []) {
    reportFor(use.unit)[use.role].add(use.surface ?? lexeme.lemma);
  }
}
for (const gap of pack.curriculumGaps ?? []) reportFor(gap.unit).gaps.push(gap);

console.log(`Tadlam Curriculum Report · Eldamo ${pack.source.version}`);
console.log(`Unassigned lexemes: ${pack.statistics.curriculum.unassigned}`);
for (const [unit, report] of [...units.entries()].sort(
  ([left], [right]) => left - right,
)) {
  console.log(`\nUnit ${unit}`);
  for (const role of ["introduced", "practised", "reviewed"]) {
    const terms = [...report[role]].sort((left, right) =>
      left.localeCompare(right, "de"),
    );
    console.log(`  ${role}: ${terms.length ? terms.join(", ") : "—"}`);
  }
  for (const gap of report.gaps) {
    console.log(`  open: ${gap.term} (${gap.lessonId}) — ${gap.reason}`);
  }
}
