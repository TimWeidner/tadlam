import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const file = new URL("../language/exercise-review-feedback.json", import.meta.url);
const decisions = new Set(["accepted", "needs-revision", "rejected"]);

test("exercise review dataset has the supported schema", async () => {
  const dataset = JSON.parse(await readFile(file, "utf8"));
  assert.equal(dataset.formatVersion, "1");
  assert.ok(dataset.updatedAt === null || typeof dataset.updatedAt === "string");
  assert.ok(Array.isArray(dataset.reviews));
  for (const review of dataset.reviews) {
    assert.equal(typeof review.exerciseId, "string");
    assert.equal(typeof review.lessonId, "string");
    assert.equal(typeof review.unit, "number");
    assert.ok(decisions.has(review.decision));
    assert.ok(Array.isArray(review.tags));
    assert.ok(review.tags.every((tag) => typeof tag === "string"));
    assert.equal(typeof review.note, "string");
    assert.equal(typeof review.reviewedAt, "string");
  }
});
