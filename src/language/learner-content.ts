import { curriculumMap, type CurriculumUse } from "./curriculum";

export interface LearnerWord {
  lexemeId: string;
  surface: string;
  translation: string;
  pronunciation: string;
  status: "attested" | "neo";
  sourceRefId: string;
  note?: string;
  uses: CurriculumUse[];
}

const wordSeed: Omit<LearnerWord, "uses">[] = [
  {
    lexemeId: "eldamo:3420722951",
    surface: "Mae",
    translation: "gut, wohl",
    pronunciation: "MAI",
    status: "attested",
    sourceRefId: "Eldamo:word-3420722951",
  },
  {
    lexemeId: "eldamo:2372353107",
    surface: "suilad",
    translation: "Gruß",
    pronunciation: "SUI-lad",
    status: "attested",
    sourceRefId: "Eldamo:word-2372353107",
    note: "Ein belegtes Wort für einen Gruß; in Unit 1 nur zum Erkennen.",
  },
  {
    lexemeId: "eldamo:2338511755",
    surface: "Mae govannen",
    translation: "Sei gegrüßt!",
    pronunciation: "MAI go-VAN-nen",
    status: "attested",
    sourceRefId: "Eldamo:word-2338511755",
    note: "Feste Begrüßungsformel.",
  },
  {
    lexemeId: "eldamo:2964964287",
    surface: "mellon",
    translation: "Freund",
    pronunciation: "MEL-lon",
    status: "attested",
    sourceRefId: "Eldamo:word-2964964287",
  },
  {
    lexemeId: "tadlam:hannon-le",
    surface: "Hannon le",
    translation: "Danke dir",
    pronunciation: "HAN-non leh",
    status: "neo",
    sourceRefId: "Eldamo:word-2772556329",
    note: "Filmgeprägte Neo-Sindarin-Formel.",
  },
  {
    lexemeId: "eldamo:3606114301",
    surface: "annon",
    translation: "(großes) Tor",
    pronunciation: "AN-non",
    status: "attested",
    sourceRefId: "Eldamo:word-3606114301",
  },
  {
    lexemeId: "eldamo:2544797639",
    surface: "echad",
    translation: "Lager",
    pronunciation: "E-chad",
    status: "attested",
    sourceRefId: "Eldamo:word-2544797639",
  },
  {
    lexemeId: "eldamo:3001223523",
    surface: "naur",
    translation: "Feuer",
    pronunciation: "NA-ur",
    status: "attested",
    sourceRefId: "Eldamo:word-3001223523",
  },
  {
    lexemeId: "eldamo:809570117",
    surface: "taur",
    translation: "Wald",
    pronunciation: "TAUR",
    status: "attested",
    sourceRefId: "Eldamo:word-809570117",
  },
  {
    lexemeId: "eldamo:599418975",
    surface: "ped-",
    translation: "sprechen",
    pronunciation: "PED",
    status: "attested",
    sourceRefId: "Eldamo:word-3326716807",
  },
  {
    lexemeId: "eldamo:2086508063",
    surface: "minna-",
    translation: "eintreten",
    pronunciation: "MIN-na",
    status: "attested",
    sourceRefId: "Eldamo:word-2086508063",
  },
  {
    lexemeId: "eldamo:1590244863",
    surface: "cen-",
    translation: "sehen, wahrnehmen",
    pronunciation: "KEN",
    status: "attested",
    sourceRefId: "Eldamo:word-1590244863",
    note: "In Unit 1 nur zum Erkennen.",
  },
  {
    lexemeId: "eldamo:2756894593",
    surface: "tol-",
    translation: "kommen",
    pronunciation: "TOL",
    status: "attested",
    sourceRefId: "Eldamo:word-2756894593",
    note: "In Unit 1 nur zum Erkennen.",
  },
  {
    lexemeId: "eldamo:235290361",
    surface: "elia-",
    translation: "einem Werk zum Gedeihen verhelfen",
    pronunciation: "E-li-a",
    status: "attested",
    sourceRefId: "Eldamo:word-235290361",
    note: "In Unit 1 nur zum Erkennen.",
  },
  {
    lexemeId: "eldamo:209902113",
    surface: "edra-",
    translation: "sich öffnen",
    pronunciation: "ED-ra",
    status: "attested",
    sourceRefId: "Eldamo:word-209902113",
    note: "In Unit 1 nur zum Erkennen.",
  },
];

const usesByLexeme = new Map(
  curriculumMap.entries.map((entry) => [entry.lexemeId, entry.uses]),
);

export const learnerVocabulary: LearnerWord[] = wordSeed.map((word) => ({
  ...word,
  uses: usesByLexeme.get(word.lexemeId) ?? [],
}));

export interface GrammarCard {
  id: string;
  title: string;
  shortLabel: string;
  availableAfterLessonId: string;
  explanation: string;
  example: string;
  sourceRefIds: string[];
}

export const grammarCards: GrammarCard[] = [
  {
    id: "imperative-o",
    title: "Imperative mit -o",
    shortLabel: "Aufforderungen",
    availableAfterLessonId: "gate",
    explanation:
      "Für die im Kurs kuratierten Verben bildet Tadlam den Imperativ mit -o. Im Wortschatz steht immer die Grundform; die sichtbare Aufforderung wird hier daraus abgeleitet.",
    example: "ped- → pedo · minna- → minno",
    sourceRefIds: ["Eldamo:word-3326716807", "Eldamo:word-2086508063"],
  },
  {
    id: "soft-mutation-object",
    title: "Weiche Mutation beim direkten Objekt",
    shortLabel: "Mutation",
    availableAfterLessonId: "forest-grammar",
    explanation:
      "In einem kuratierten direkten Objektkontext kann eine weiche Mutation erscheinen. Tadlam zeigt sie nur dort, wo die Form und der Kontext ausdrücklich hinterlegt sind.",
    example: "peth → beth",
    sourceRefIds: ["Eldamo:word-184000497"],
  },
];

export function sourceUrl(sourceRefId: string): string | null {
  const match = sourceRefId.match(/^Eldamo:word-(\d+)$/);
  return match ? `https://www.eldamo.org/content/words/word-${match[1]}.html` : null;
}

export const sourceLabel = (_sourceRefId: string) => "Eldamo";
