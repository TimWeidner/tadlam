import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";

const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  trimValues: true,
};

const partOfSpeechMap = {
  n: "noun",
  vb: "verb",
  adj: "adjective",
  adv: "adverb",
  prep: "preposition",
  pron: "pronoun",
  conj: "conjunction",
  interj: "interjection",
  num: "numeral",
  pref: "prefix",
  suf: "suffix",
  root: "root",
  phr: "phrase",
};

const asArray = (value) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

function normalizeMarkerSymbols(value) {
  return [
    ...new Set(
      [...String(value ?? "")].filter((symbol) =>
        ["!", "^", "†", "?"].includes(symbol),
      ),
    ),
  ];
}

function markersFromSymbols(symbols) {
  return symbols.map(
    (symbol) =>
      ({
        "!": "fan",
        "^": "early-or-rejected",
        "†": "archaic",
        "?": "uncertain",
      })[symbol],
  );
}

function confidenceFor(language, markers) {
  if (markers.includes("archaic")) return "archaic";
  if (markers.includes("early-or-rejected")) return "early";
  if (markers.includes("uncertain")) return "uncertain";
  return language === "ns" ? "neo" : "attested";
}

function sourceIdsFrom(value, sourceIds = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => sourceIdsFrom(item, sourceIds));
    return sourceIds;
  }
  if (!value || typeof value !== "object") return sourceIds;
  if (typeof value["@_source"] === "string") sourceIds.add(value["@_source"]);
  Object.values(value).forEach((item) => sourceIdsFrom(item, sourceIds));
  return sourceIds;
}

function glossesFrom(gloss) {
  return String(gloss ?? "")
    .split(/;\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function partOfSpeechFrom(speech) {
  const raw = String(speech ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return {
    raw,
    normalized: [
      ...new Set(raw.map((item) => partOfSpeechMap[item] ?? "other")),
    ],
  };
}

export function parseEldamoXml(xml) {
  const parsed = new XMLParser(parserOptions).parse(xml);
  const root = parsed["word-data"];
  if (!root?.["@_version"])
    throw new Error("Eldamo XML has no word-data version.");

  const skipped = {
    missingIdentity: 0,
    unsupportedLanguage: 0,
    missingGloss: 0,
  };
  const lexemes = [];

  for (const word of asArray(root.word)) {
    const language = word?.["@_l"];
    if (language !== "s" && language !== "ns") {
      skipped.unsupportedLanguage += 1;
      continue;
    }

    const pageId = word["@_page-id"];
    const lemma = word["@_v"];
    if (!pageId || !lemma) {
      skipped.missingIdentity += 1;
      continue;
    }

    const glosses = glossesFrom(word["@_gloss"]);
    if (!glosses.length) skipped.missingGloss += 1;
    const markerSymbols = normalizeMarkerSymbols(word["@_mark"]);
    const markers = markersFromSymbols(markerSymbols);
    const confidence = confidenceFor(language, markers);
    const speech = partOfSpeechFrom(word["@_speech"]);

    lexemes.push({
      id: `eldamo:${pageId}`,
      externalIds: [{ system: "eldamo-page-id", value: String(pageId) }],
      lemma: String(lemma),
      stem: word["@_stem"] ? String(word["@_stem"]) : undefined,
      language: language === "s" ? "sindarin" : "neo-sindarin",
      partOfSpeech: speech.normalized,
      rawPartOfSpeech: speech.raw,
      glosses,
      confidence,
      markers,
      sourceRefIds: [...sourceIdsFrom(word)].sort(),
      eldamo: {
        category: word["@_cat"] ? String(word["@_cat"]) : undefined,
        createdBy: word["@_created"] ? String(word["@_created"]) : undefined,
        neoVersion: word["@_neo-version"]
          ? String(word["@_neo-version"])
          : undefined,
        markerSymbols,
      },
      exerciseCandidate:
        glosses.length > 0 &&
        !markers.includes("fan") &&
        !markers.includes("early-or-rejected") &&
        !markers.includes("archaic") &&
        !markers.includes("uncertain"),
    });
  }

  lexemes.sort((left, right) => left.id.localeCompare(right.id));
  return { version: String(root["@_version"]), lexemes, skipped };
}

function applyOverrides(lexemes, overrides = {}) {
  const customLexemes = Array.isArray(overrides.customLexemes)
    ? overrides.customLexemes
    : [];
  const seenIds = new Set(lexemes.map((lexeme) => lexeme.id));
  for (const lexeme of customLexemes) {
    if (!lexeme.id || !lexeme.lemma) {
      throw new Error("A custom Tadlam lexeme needs both id and lemma.");
    }
    if (seenIds.has(lexeme.id)) {
      throw new Error(`A custom Tadlam lexeme duplicates ${lexeme.id}.`);
    }
    seenIds.add(lexeme.id);
  }
  return [...lexemes, ...customLexemes].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function applyCurriculum(lexemes, curriculum = {}) {
  const entries = Array.isArray(curriculum.entries) ? curriculum.entries : [];
  const usesByLexemeId = new Map();
  const knownLexemeIds = new Set(lexemes.map((lexeme) => lexeme.id));

  for (const entry of entries) {
    if (!knownLexemeIds.has(entry.lexemeId)) {
      throw new Error(
        `Curriculum entry references an unknown lexeme: ${entry.lexemeId}`,
      );
    }
    if (!Array.isArray(entry.uses) || !entry.uses.length) {
      throw new Error(`Curriculum entry has no uses: ${entry.lexemeId}`);
    }
    usesByLexemeId.set(entry.lexemeId, entry.uses);
  }

  return lexemes.map((lexeme) => {
    const uses = usesByLexemeId.get(lexeme.id) ?? [];
    return {
      ...lexeme,
      curriculum: {
        state: uses.length ? "assigned" : "unassigned",
        uses,
      },
    };
  });
}

export function buildLanguagePack(
  xml,
  source,
  curriculum = {},
  overrides = {},
) {
  const { version, lexemes: importedLexemes, skipped } = parseEldamoXml(xml);
  const lexemes = applyCurriculum(
    applyOverrides(importedLexemes, overrides),
    curriculum,
  );
  const sourceSha256 = createHash("sha256").update(xml).digest("hex");
  const candidatesByConfidence = Object.fromEntries(
    ["attested", "neo", "early", "archaic", "uncertain"].map((confidence) => [
      confidence,
      lexemes.filter((lexeme) => lexeme.confidence === confidence).length,
    ]),
  );

  return {
    formatVersion: "1",
    engineCompatibility: "1.x",
    source: {
      ...source,
      version,
      sha256: sourceSha256,
    },
    lexemes,
    rules: {
      morphology: Array.isArray(overrides.morphology)
        ? overrides.morphology
        : [],
      mutations: Array.isArray(overrides.mutations) ? overrides.mutations : [],
    },
    statistics: {
      lexemes: lexemes.length,
      exerciseCandidates: lexemes.filter((lexeme) => lexeme.exerciseCandidate)
        .length,
      candidatesByConfidence,
      skipped,
      curriculum: {
        assigned: lexemes.filter(
          (lexeme) => lexeme.curriculum.state === "assigned",
        ).length,
        unassigned: lexemes.filter(
          (lexeme) => lexeme.curriculum.state === "unassigned",
        ).length,
        gaps: Array.isArray(curriculum.gaps) ? curriculum.gaps.length : 0,
        customLexemes: Array.isArray(overrides.customLexemes)
          ? overrides.customLexemes.length
          : 0,
      },
    },
    curriculumGaps: Array.isArray(curriculum.gaps) ? curriculum.gaps : [],
  };
}
