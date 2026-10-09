import tadlamOverridesJson from "../../language/tadlam-overrides.json";

export type MorphologicalForm = "dictionary" | "imperative";
type InflectionClass =
  "a-stem-imperative-o" | "bare-stem-imperative-o" | "fixed";

interface MorphologyProfile {
  lexemeId: string;
  lemma: string;
  inflectionClass: InflectionClass;
  sourceRefId: string;
}

export interface DerivationStep {
  ruleId: string;
  from: string;
  to: string;
  explanation: string;
  sourceRefId: string;
}

export interface InflectionResult {
  lexemeId: string;
  form: MorphologicalForm;
  surface: string;
  derivation: DerivationStep[];
}

const profiles = tadlamOverridesJson.morphology as MorphologyProfile[];
const profilesById = new Map(
  profiles.map((profile) => [profile.lexemeId, profile]),
);

const stripStemMarker = (lemma: string) => lemma.replace(/-$/, "");
const normalizeSurface = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/[.!?,;:]/g, "")
    .normalize("NFC");

function imperative(profile: MorphologyProfile): InflectionResult | null {
  const stem = stripStemMarker(profile.lemma);
  if (profile.inflectionClass === "a-stem-imperative-o") {
    if (!stem.endsWith("a")) return null;
    const surface = `${stem.slice(0, -1)}o`;
    return {
      lexemeId: profile.lexemeId,
      form: "imperative",
      surface,
      derivation: [
        {
          ruleId: "imperative-a-stem-to-o",
          from: profile.lemma,
          to: surface,
          explanation:
            "Für diese kuratierte Verbklasse wird das finale -a der Stammform im Imperativ zu -o.",
          sourceRefId: profile.sourceRefId,
        },
      ],
    };
  }
  if (profile.inflectionClass === "bare-stem-imperative-o") {
    const surface = `${stem}o`;
    return {
      lexemeId: profile.lexemeId,
      form: "imperative",
      surface,
      derivation: [
        {
          ruleId: "imperative-bare-stem-plus-o",
          from: profile.lemma,
          to: surface,
          explanation:
            "Für diese kuratierte Verbklasse wird im Imperativ -o an den Stamm gesetzt.",
          sourceRefId: profile.sourceRefId,
        },
      ],
    };
  }
  return null;
}

export function inflect(
  lexemeId: string,
  form: MorphologicalForm = "dictionary",
): InflectionResult | null {
  const profile = profilesById.get(lexemeId);
  if (!profile) return null;
  if (form === "dictionary") {
    return {
      lexemeId,
      form,
      surface: profile.lemma,
      derivation: [
        {
          ruleId: "dictionary-form",
          from: profile.lemma,
          to: profile.lemma,
          explanation:
            "Die Grundform wird direkt aus dem kuratierten Lexikon verwendet.",
          sourceRefId: profile.sourceRefId,
        },
      ],
    };
  }
  return imperative(profile);
}

export function analyze(surface: string): InflectionResult[] {
  const normalized = normalizeSurface(surface);
  return profiles.flatMap((profile) => {
    const forms = [
      inflect(profile.lexemeId, "dictionary"),
      inflect(profile.lexemeId, "imperative"),
    ].filter((result): result is InflectionResult => Boolean(result));
    return forms.filter(
      (result) => normalizeSurface(result.surface) === normalized,
    );
  });
}
