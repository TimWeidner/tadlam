import tadlamOverridesJson from "../../language/tadlam-overrides.json";

export type MutationKind = "soft";
export type MutationContext = "direct-object" | "vocative";

interface MutationProfile {
  lexemeId: string;
  kind: MutationKind;
  contexts: MutationContext[];
  base: string;
  surface: string;
  sourceRefId: string;
}

export interface MutationResult {
  lexemeId: string;
  kind: MutationKind;
  context: MutationContext;
  base: string;
  surface: string;
  explanation: string;
  sourceRefId: string;
}

const profiles = tadlamOverridesJson.mutations as MutationProfile[];

const normalizeSurface = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/[.!?,;:]/g, "")
    .normalize("NFC");

export function applyMutation(
  lexemeId: string,
  kind: MutationKind,
  context: MutationContext,
): MutationResult | null {
  const profile = profiles.find(
    (candidate) =>
      candidate.lexemeId === lexemeId &&
      candidate.kind === kind &&
      candidate.contexts.includes(context),
  );
  if (!profile) return null;
  return {
    lexemeId,
    kind,
    context,
    base: profile.base,
    surface: profile.surface,
    explanation:
      "Die weiche Mutation markiert dieses kuratierte Nomen in diesem Kontext als direktes Objekt.",
    sourceRefId: profile.sourceRefId,
  };
}

export function analyzeMutation(
  surface: string,
  kind: MutationKind = "soft",
): MutationResult[] {
  const normalized = normalizeSurface(surface);
  return profiles
    .filter(
      (profile) =>
        profile.kind === kind &&
        normalizeSurface(profile.surface) === normalized,
    )
    .flatMap((profile) =>
      profile.contexts.map((context) =>
        applyMutation(profile.lexemeId, profile.kind, context),
      ),
    )
    .filter((result): result is MutationResult => Boolean(result));
}
