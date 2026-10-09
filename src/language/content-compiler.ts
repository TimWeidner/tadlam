import grammarRoadmapJson from "../../language/grammar-roadmap.json";
import type { LessonPhase } from "../domain";

export interface PlannedLexeme {
  lexemeId: string;
  lemma: string;
  gloss: string;
  mode: string;
}

export interface UnitContentPlan {
  formatVersion: string;
  unit: number;
  theme: string;
  communicationGoals: string[];
  grammarComponents: string[];
  newLexemes: PlannedLexeme[];
}

export interface PracticeSignal {
  misses: number;
  lastMissedAt: string;
}

export interface CourseCompilerInput {
  plan: UnitContentPlan;
  /** Words introduced before this Unit, in curriculum order. */
  knownLexemeIds: string[];
  /** Local learner data. This is optional so authored previews stay deterministic. */
  practiceSignals?: Record<string, PracticeSignal>;
}

export interface LessonBlueprint {
  id: string;
  unit: number;
  phase: LessonPhase;
  title: string;
  subtitle: string;
  lexemeIds: string[];
  grammarComponents: string[];
  exerciseCount: number;
  /** Human-readable reason this node exists. Useful in the authoring preview. */
  rationale: string;
}

const roadmap = grammarRoadmapJson as {
  components: Array<{ id: string; scope: "productive" | "reference" | "deferred" }>;
};

const productiveGrammar = new Set(
  roadmap.components
    .filter((component) => component.scope === "productive")
    .map((component) => component.id),
);

/** The visible learning rhythm: one compact lesson, fifteen questions. */
export const LESSON_EXERCISE_TARGET = 15;

const chunk = <T>(items: T[], maximum: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += maximum) {
    chunks.push(items.slice(index, index + maximum));
  }
  return chunks;
};

function reviewOrder(
  knownLexemeIds: string[],
  practiceSignals: Record<string, PracticeSignal>,
) {
  return [...knownLexemeIds].sort((left, right) => {
    const leftMisses = practiceSignals[`lexeme:${left}`]?.misses ?? 0;
    const rightMisses = practiceSignals[`lexeme:${right}`]?.misses ?? 0;
    return rightMisses - leftMisses;
  });
}

/**
 * Turns a curated Unit plan into the smallest useful sequence of lesson nodes.
 * It deliberately does not force a fixed lesson count: only new material, a
 * productive grammar opportunity, meaningful revision, and a playable ramp-up
 * earn their own node.
 */
export function compileUnitContent({
  plan,
  knownLexemeIds,
  practiceSignals = {},
}: CourseCompilerInput): LessonBlueprint[] {
  const prefix = `unit-${String(plan.unit).padStart(2, "0")}`;
  const newLexemeIds = plan.newLexemes.map((lexeme) => lexeme.lexemeId);
  const lexemeChunks = chunk(newLexemeIds, 8);
  const nodes: LessonBlueprint[] = lexemeChunks.map((lexemeIds, index) => ({
    id: `${prefix}-new-${index + 1}`,
    unit: plan.unit,
    phase: "new",
    title:
      index === 0
        ? "Neue Wörter entdecken"
        : "Neue Wörter vertiefen",
    subtitle: `${lexemeIds.length} neue Grundformen · ${plan.theme}`,
    lexemeIds,
    grammarComponents: [],
    exerciseCount: LESSON_EXERCISE_TARGET,
    rationale:
      index === 0
        ? "Die Unit beginnt mit ihrem neuen Wortschatz."
        : "Der neue Wortschatz wird in einer zweiten, noch überschaubaren Portion eingeführt.",
  }));

  const grammarComponents = plan.grammarComponents.filter((component) =>
    productiveGrammar.has(component),
  );
  if (grammarComponents.length > 0 && newLexemeIds.length >= 4) {
    nodes.push({
      id: `${prefix}-grammar`,
      unit: plan.unit,
      phase: "grammar",
      title: "Grammatik im Kontext",
      subtitle: "Mit den neuen Wörtern anwenden",
      lexemeIds: newLexemeIds,
      grammarComponents,
      exerciseCount: LESSON_EXERCISE_TARGET,
      rationale:
        "Die geplanten Regeln sind produktiv freigegeben und können mit dem Wortschatz dieser Unit sinnvoll geübt werden.",
    });
  }

  // A review is only worthwhile once there is an actual vocabulary base. It
  // prioritizes mistakes but still draws from all earlier words, so a learner
  // cannot avoid material that happens to be easy.
  if (knownLexemeIds.length >= 4) {
    const ordered = reviewOrder(knownLexemeIds, practiceSignals);
    const problemCount = ordered.filter(
      (id) => (practiceSignals[`lexeme:${id}`]?.misses ?? 0) > 0,
    ).length;
    nodes.push({
      id: `${prefix}-review`,
      unit: plan.unit,
      phase: "review",
      title: problemCount > 0 ? "Wiederholen, was wackelt" : "Gemischte Wiederholung",
      subtitle:
        problemCount > 0
          ? "Fehlerkarten zuerst, bekannte Wörter danach"
          : "Wörter aus früheren Units auffrischen",
      lexemeIds: ordered.slice(0, 12),
      grammarComponents: [],
      exerciseCount: LESSON_EXERCISE_TARGET,
      rationale:
        problemCount > 0
          ? "Es gibt lokale Fehlersignale; sie erhalten Vorrang in der Wiederholung."
          : "Es gibt genug ältere Wörter für eine abwechslungsreiche Wiederholung.",
    });
  }

  // A final application task stays small and only appears once the Unit has
  // enough lexical material to form a recognisable LARP moment.
  if (newLexemeIds.length >= 8) {
    nodes.push({
      id: `${prefix}-ramp`,
      unit: plan.unit,
      phase: "ramp",
      title: "Im Spiel anwenden",
      subtitle: plan.communicationGoals[0] ?? "Kurze Abschlussrunde",
      lexemeIds: [...newLexemeIds, ...knownLexemeIds.slice(-4)],
      grammarComponents,
      exerciseCount: LESSON_EXERCISE_TARGET,
      rationale:
        "Der Wortschatz trägt jetzt eine kurze, spielbare Anwendung statt einer weiteren isolierten Abfrage.",
    });
  }

  return nodes;
}
