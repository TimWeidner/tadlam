import { readFile } from "node:fs/promises";

const file = new URL("../language/exercise-review-feedback.json", import.meta.url);
const dataset = JSON.parse(await readFile(file, "utf8"));
const counts = dataset.reviews.reduce((result, review) => {
  result[review.decision] = (result[review.decision] ?? 0) + 1;
  return result;
}, {});

console.log("Tadlam · Übungsredaktion");
console.log(`Akzeptiert: ${counts.accepted ?? 0}`);
console.log(`Überarbeiten: ${counts["needs-revision"] ?? 0}`);
console.log(`Abgelehnt: ${counts.rejected ?? 0}`);
console.log(`Gesamt: ${dataset.reviews.length}`);
