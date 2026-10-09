import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildLanguagePack, parseEldamoXml } from "./eldamo-transform.mjs";

const fixture = await readFile(
  new URL("./fixtures/eldamo-sample.xml", import.meta.url),
  "utf8",
);

describe("Eldamo import", () => {
  it("imports Sindarin and Neo-Sindarin records with provenance", () => {
    const { version, lexemes, skipped } = parseEldamoXml(fixture);
    assert.equal(version, "test-1");
    assert.equal(lexemes.length, 4);
    assert.equal(skipped.unsupportedLanguage, 1);

    const mellon = lexemes.find((lexeme) => lexeme.lemma === "mellon");
    assert.deepEqual(mellon.glosses, ["friend", "companion"]);
    assert.deepEqual(mellon.sourceRefIds, ["LotR/Moria"]);
    assert.equal(mellon.confidence, "attested");
    assert.equal(mellon.exerciseCandidate, true);
  });

  it("keeps Eldamo reliability markers as machine-readable quality data", () => {
    const { lexemes } = parseEldamoXml(fixture);
    assert.equal(
      lexemes.find((lexeme) => lexeme.lemma === "Hannon le").markers[0],
      "fan",
    );
    assert.equal(
      lexemes.find((lexeme) => lexeme.lemma === "abor²").confidence,
      "early",
    );
    assert.equal(
      lexemes.find((lexeme) => lexeme.lemma === "old-form").confidence,
      "archaic",
    );
    assert.equal(
      lexemes.find((lexeme) => lexeme.lemma === "Hannon le").exerciseCandidate,
      false,
    );
  });

  it("creates a versioned package with a reproducible source fingerprint", () => {
    const pack = buildLanguagePack(
      fixture,
      { id: "eldamo", license: "CC-BY-4.0" },
      {
        entries: [
          {
            lexemeId: "eldamo:100",
            uses: [{ unit: 1, lessonId: "arrival", role: "introduced" }],
          },
        ],
        gaps: [{ term: "Hannon le", unit: 1, lessonId: "camp" }],
      },
    );
    assert.equal(pack.formatVersion, "1");
    assert.equal(pack.source.version, "test-1");
    assert.match(pack.source.sha256, /^[a-f0-9]{64}$/);
    assert.equal(pack.statistics.lexemes, 4);
    assert.equal(pack.statistics.curriculum.assigned, 1);
    assert.equal(pack.statistics.curriculum.gaps, 1);
    assert.equal(
      pack.lexemes.find((lexeme) => lexeme.id === "eldamo:100").curriculum
        .state,
      "assigned",
    );
  });
});
