import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLanguagePack } from "./eldamo-transform.mjs";

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const defaultManifest = resolve(workspace, "language/eldamo-source.json");
const defaultCurriculum = resolve(workspace, "language/curriculum-map.json");
const defaultOverrides = resolve(workspace, "language/tadlam-overrides.json");
const defaultOutput = resolve(
  workspace,
  "src/language/generated/eldamo-lexicon.json",
);

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function printUsage() {
  console.log(
    "Usage: npm run language:import -- --download | --input <eldamo-data.xml> [--out <pack.json>]",
  );
}

const input = readArgument("--input");
const shouldDownload = process.argv.includes("--download");
const output = resolve(readArgument("--out") ?? defaultOutput);
const curriculumPath = resolve(
  readArgument("--curriculum") ?? defaultCurriculum,
);
const overridesPath = resolve(readArgument("--overrides") ?? defaultOverrides);

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
  process.exit(0);
}
if (Boolean(input) === shouldDownload) {
  printUsage();
  throw new Error("Choose exactly one Eldamo source: --download or --input.");
}

const source = JSON.parse(await readFile(defaultManifest, "utf8"));
const curriculum = JSON.parse(await readFile(curriculumPath, "utf8"));
const overrides = JSON.parse(await readFile(overridesPath, "utf8"));
let xml;
if (input) {
  xml = await readFile(resolve(input), "utf8");
} else {
  const response = await fetch(source.dataUrl, {
    headers: {
      "User-Agent": "Tadlam language data importer (local development)",
    },
  });
  if (!response.ok)
    throw new Error(`Eldamo download failed (${response.status}).`);
  xml = await response.text();
}

const languagePack = buildLanguagePack(xml, source, curriculum, overrides);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(languagePack, null, 2)}\n`, "utf8");

console.log(
  `Imported Eldamo ${languagePack.source.version}: ${languagePack.statistics.lexemes} Sindarin / Neo-Sindarin lexemes.`,
);
console.log(
  `Exercise candidates: ${languagePack.statistics.exerciseCandidates}.`,
);
console.log(
  `Curriculum: ${languagePack.statistics.curriculum.assigned} assigned, ${languagePack.statistics.curriculum.unassigned} unassigned, ${languagePack.statistics.curriculum.gaps} gaps, ${languagePack.statistics.curriculum.customLexemes} custom lexemes.`,
);
console.log(`Wrote ${output}`);
