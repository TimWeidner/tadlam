import type { Exercise } from "../domain";

export type StudyMode = "recognition" | "productive";
export interface StudyLexeme {
  id: string;
  surface: string;
  gloss: string;
  mode: StudyMode;
  /** A Neo bridge is visibly labelled even where individual source words exist. */
  status?: Exercise["status"];
  source?: string;
  grammarIds?: string[];
}
export interface FormPair {
  id: string;
  lexemeId: string;
  singular: string;
  plural: string;
  gloss: string;
  grammarIds?: string[];
}

const source = "Eldamo · kuratierter Kursinhalt";
const neoSource = "Neo-Sindarin · kuratierte Brücke";
const target = 15;

const statusFor = (...words: StudyLexeme[]) =>
  words.some((word) => word.status === "neo") ? "neo" : "attested";
const sourceFor = (...words: StudyLexeme[]) =>
  words.find((word) => word.source)?.source ??
  (statusFor(...words) === "neo" ? neoSource : source);
const conceptsFor = (...words: StudyLexeme[]) => ({
  lexemeIds: [...new Set(words.map((word) => word.id))],
  grammarIds: [...new Set(words.flatMap((word) => word.grammarIds ?? []))],
});

const choice = (id: string, prompt: string, choices: string[], answer: string, _hint: string, words: StudyLexeme[] = []): Exercise =>
  ({ id, kind: "choice", prompt, choices, answer, status: statusFor(...words), source: sourceFor(...words), ...conceptsFor(...words) });
const cloze = (id: string, prompt: string, choices: string[], answer: string, _hint: string, words: StudyLexeme[] = []): Exercise =>
  ({ id, kind: "cloze", prompt, choices, answer, status: statusFor(...words), source: sourceFor(...words), ...conceptsFor(...words) });
const type = (id: string, prompt: string, answer: string, _hint: string, words: StudyLexeme[] = []): Exercise =>
  ({ id, kind: "type", prompt, answer, status: statusFor(...words), source: sourceFor(...words), ...conceptsFor(...words) });
const match = (id: string, prompt: string, pairs: Array<{ left: string; right: string }>, _hint: string, words: StudyLexeme[] = []): Exercise =>
  ({ id, kind: "match", prompt, pairs, answer: "match", status: statusFor(...words), source: sourceFor(...words), ...conceptsFor(...words) });

const rotated = <T,>(values: T[], index: number, count = 3) =>
  Array.from({ length: Math.min(count, values.length) }, (_, offset) =>
    values[(index + offset) % values.length],
  );

/** Creates fifteen distinct lexical tasks without building unapproved syntax. */
export function vocabularyExercises(
  prefix: string,
  words: StudyLexeme[],
  scene: string,
  reviewWords: StudyLexeme[] = [],
): Exercise[] {
  const exercises: Exercise[] = [];
  const productive = words.filter((word) => word.mode === "productive");
  const choicesForGloss = (word: StudyLexeme, index: number) =>
    [word.gloss, ...rotated(words.filter((candidate) => candidate.id !== word.id).map((candidate) => candidate.gloss), index, 2)];
  const choicesForSurface = (word: StudyLexeme, index: number) =>
    [word.surface, ...rotated(words.filter((candidate) => candidate.id !== word.id).map((candidate) => candidate.surface), index, 2)];

  for (const [index, word] of words.slice(0, 6).entries()) {
    exercises.push(choice(`${prefix}-meaning-${index}`, `Was bedeutet „${word.surface}“?`, choicesForGloss(word, index), word.gloss, `${scene}: erst Bedeutung erkennen.`, [word]));
  }
  for (let index = 0; index < words.length; index += 3) {
    const group = words.slice(index, index + 3);
    if (group.length >= 2) exercises.push(match(`${prefix}-match-${index}`, `Ordne Wortkarten, Runde ${Math.floor(index / 3) + 1}, zu.`, group.map((word) => ({ left: word.surface, right: word.gloss })), "Richtige Paare bleiben sichtbar.", group));
  }
  for (const [index, word] of words.entries()) {
    exercises.push(cloze(`${prefix}-cloze-${index}`, `Das Sindarin-Wort für „${word.gloss}“ ist ___.`, choicesForSurface(word, index), word.surface, "Nutze nur die bereits eingeführten Karten.", [word]));
  }
  for (const [index, word] of productive.entries()) {
    exercises.push(type(`${prefix}-type-${index}`, `Tippe das Wort für „${word.gloss}“.`, word.surface, "Jetzt ohne Auswahlhilfe.", [word]));
  }
  for (let index = 0; exercises.length < target; index += 1) {
    const word = words[index % words.length];
    const round = Math.floor(index / words.length) + 1;
    if (index % 2 === 0) {
      exercises.push(choice(`${prefix}-recall-${index}`, `Welche Wortkarte passt in die Szene „${scene}“ für „${word.gloss}“? Runde ${round}.`, choicesForSurface(word, index + 1), word.surface, "Der Szenenrahmen hilft, aber die Wortkarte ist das Lernziel.", [word]));
    } else {
      exercises.push(choice(`${prefix}-reverse-${index}`, `Welche Bedeutung gehört zu „${word.surface}“? Runde ${round}.`, choicesForGloss(word, index + 1), word.gloss, "Prüfe die Bedeutung noch einmal aus der anderen Richtung.", [word]));
    }
  }
  const reviews = reviewWords.slice(0, 3).map((word, index) => {
    if (index === 0) {
      return cloze(
        `${prefix}-review-${index}`,
        `Wiederholung: Das Sindarin-Wort für „${word.gloss}“ ist ___.`,
        choicesForSurface(word, index + 2),
        word.surface,
        "Ein bekanntes Wort aus einer früheren Unit.",
        [word],
      );
    }
    return choice(
      `${prefix}-review-${index}`,
      `Wiederholung: Was bedeutet „${word.surface}“?`,
      choicesForGloss(word, index + 2),
      word.gloss,
      "Ein bekanntes Wort aus einer früheren Unit.",
      [word],
    );
  });

  return [...exercises.slice(0, target - reviews.length), ...reviews];
}

/** Pair-only plural practice: it never pretends to derive a general rule. */
export function pairExercises(
  prefix: string,
  pairs: FormPair[],
  scene: string,
  reviewPairs: FormPair[] = [],
): Exercise[] {
  const exercises: Exercise[] = [];
  const pairConcepts = (...selected: FormPair[]) => ({
    lexemeIds: [...new Set(selected.map((pair) => pair.lexemeId))],
    grammarIds: [...new Set(selected.flatMap((pair) => pair.grammarIds ?? ["singular-plural"]))],
  });
  const pluralChoices = (pair: FormPair, index: number) =>
    [pair.plural, ...rotated(pairs.filter((candidate) => candidate.id !== pair.id).map((candidate) => candidate.plural), index, 2)];

  for (const [index, pair] of pairs.slice(0, 6).entries()) {
    exercises.push({ ...choice(`${prefix}-plural-${index}`, `Welche Mehrzahl gehört zu „${pair.singular}“ (${pair.gloss})?`, pluralChoices(pair, index), pair.plural, "Dieses Paar wird einzeln gelernt, nicht aus einer Lautregel erraten."), ...pairConcepts(pair) });
  }
  for (let index = 0; index < pairs.length; index += 3) {
    const group = pairs.slice(index, index + 3);
    if (group.length >= 2) exercises.push({ ...match(`${prefix}-match-${index}`, `Ordne Einzahl und Mehrzahl, Runde ${Math.floor(index / 3) + 1}, zu.`, group.map((pair) => ({ left: pair.singular, right: pair.plural })), "Alle Formen sind einzeln belegte Paare."), ...pairConcepts(...group) });
  }
  for (const [index, pair] of pairs.entries()) {
    exercises.push({ ...cloze(`${prefix}-cloze-${index}`, `Mehrere ${pair.gloss}: ___.`, pluralChoices(pair, index + 1), pair.plural, `${scene}: nur diese freigegebene Form.`), ...pairConcepts(pair) });
  }
  for (const [index, pair] of pairs.entries()) {
    exercises.push({ ...type(`${prefix}-type-${index}`, `Tippe die Mehrzahl zu „${pair.singular}“.`, pair.plural, "Die Form ist ein kuratiertes Paar."), ...pairConcepts(pair) });
  }
  for (let index = 0; exercises.length < target; index += 1) {
    const pair = pairs[index % pairs.length];
    exercises.push({ ...choice(`${prefix}-reverse-${index}`, `„${pair.plural}“ bezeichnet mehrere …`, [pair.gloss, ...rotated(pairs.filter((candidate) => candidate.id !== pair.id).map((candidate) => candidate.gloss), index, 2)], pair.gloss, "Lies die Form auch in der Rückrichtung."), ...pairConcepts(pair) });
  }
  const reviews = reviewPairs.slice(0, 3).map((pair, index) =>
    ({ ...cloze(
      `${prefix}-review-${index}`,
      `Wiederholung: Mehrere ${pair.gloss}: ___.`,
      pluralChoices(pair, index + 2),
      pair.plural,
      "Ein bereits bekanntes, einzeln belegtes Formenpaar.",
    ), ...pairConcepts(pair) }),
  );
  return [...exercises.slice(0, target - reviews.length), ...reviews];
}
