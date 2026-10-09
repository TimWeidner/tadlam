import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const readJson = async (relativePath) =>
  JSON.parse(
    await readFile(new URL(relativePath, import.meta.url), "utf8"),
  );

const [lexicon, roadmap, unitOne, unitTwo, unitThree, unitFour, unitFive] = await Promise.all([
  readJson("../../src/language/generated/eldamo-lexicon.json"),
  readJson("../../language/grammar-roadmap.json"),
  readJson("../../language/course-plans/unit-01.json"),
  readJson("../../language/course-plans/unit-02.json"),
  readJson("../../language/course-plans/unit-03.json"),
  readJson("../../language/course-plans/unit-04.json"),
  readJson("../../language/course-plans/unit-05.json"),
]);

const units = [unitOne, unitTwo, unitThree, unitFour, unitFive];

const lexemesById = new Map(lexicon.lexemes.map((lexeme) => [lexeme.id, lexeme]));
const components = new Set(roadmap.components.map((component) => component.id));

describe("course plans", () => {
  it("keeps the published units inside the 10–30 lemma budget", () => {
    for (const unit of units) {
      assert.ok(unit.newLexemes.length >= 10 && unit.newLexemes.length <= 30);
    }
  });

  it("uses attested lemmas with matching stable IDs and glosses", () => {
    for (const unit of units) {
      for (const planned of unit.newLexemes) {
        const lexeme = lexemesById.get(planned.lexemeId);
        assert.ok(lexeme, `${planned.lexemeId} is absent from the Eldamo package`);
        assert.equal(lexeme.lemma, planned.lemma);
        assert.equal(lexeme.confidence, "attested");
      }
    }
  });

  it("maps every unit grammar topic onto the shared roadmap", () => {
    for (const unit of units) {
      for (const component of unit.grammarComponents) {
        assert.ok(components.has(component), `${component} is not on the roadmap`);
      }
    }
  });
});
