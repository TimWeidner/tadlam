<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  awardProgress,
  defaultProgress,
  findExercise,
  isAnswerCorrect,
  isLessonUnlocked,
  lessons,
  migrateProgress,
  queueForReview,
  recordExerciseMiss,
  recordExerciseSuccess,
  statusLabel,
  type Exercise,
  type Lesson,
  type Progress,
} from "./domain";
import { lessonExerciseSet } from "./language/lesson-exercises";
import {
  grammarCards,
  learnerVocabulary,
  sourceLabel,
  sourceUrl,
} from "./language/learner-content";
import { generateSentence } from "./language/syntax";

type Screen = "learn" | "words" | "grammar" | "profile" | "library";
type CompletionPhase = "flip" | "path" | "next";
const STORAGE_KEY = "tadlam-progress-v2";
const readProgress = (): Progress => {
  try {
    return migrateProgress(
      JSON.parse(
        localStorage.getItem(STORAGE_KEY) ||
          localStorage.getItem("tadlam-progress-v1") ||
          "{}",
      ),
    );
  } catch {
    return defaultProgress();
  }
};
const progress = ref<Progress>(readProgress());
const screen = ref<Screen>("learn");
const isDevelopment = import.meta.env.DEV;
const darkMode = ref(localStorage.getItem("tadlam-dark") === "true");
const activeTitle = ref("");
const activeLesson = ref<Lesson | null>(null);
const queue = ref<Exercise[]>([]);
const exerciseIndex = ref(0);
const answer = ref("");
const ordered = ref<string[]>([]);
const checked = ref(false);
const showWhy = ref(false);
const result = ref(false);
const reviewMode = ref(false);
const correctFirst = ref(0);
const originalCount = ref(0);
const requeued = ref<Set<string>>(new Set());
const resolvedReviews = ref<Set<string>>(new Set());
const matchLeft = ref("");
const matchRight = ref("");
const matched = ref<string[]>([]);
const matchMistakes = ref(0);
const matchMessage = ref("");
const matchMismatch = ref(false);
const showReset = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const importError = ref("");
const pendingCompletionLessonId = ref<string | null>(null);
const completionAnimation = ref<{
  lessonId: string;
  phase: CompletionPhase;
} | null>(null);
const completionColorRevealed = ref(false);
const nextBubbleColorRevealed = ref(false);
const animationRuns = ref<Record<string, number>>({
  flip: 0,
  next: 0,
  trail: 0,
  fog: 0,
  shake: 0,
  journey: 0,
  lesson: 0,
});
const libraryCoinLanded = ref(false);
const libraryNextLanded = ref(false);
const libraryJourneyPhase = ref<"idle" | CompletionPhase | "unit">("idle");
const libraryJourneyCompleted = ref(false);
const libraryLessonPhase = ref<"idle" | CompletionPhase>("idle");
const libraryLessonCompleted = ref(false);
watch(
  progress,
  (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)),
  { deep: true },
);
watch(darkMode, (value) => localStorage.setItem("tadlam-dark", String(value)));
const current = computed(() => queue.value[exerciseIndex.value]);
const percent = computed(() =>
  Math.min(
    100,
    Math.round((progress.value.todayXp / progress.value.goal) * 100),
  ),
);
const score = computed(() =>
  originalCount.value
    ? Math.round((correctFirst.value / originalCount.value) * 100)
    : 0,
);
const currentCorrect = computed(() =>
  current.value?.kind === "match"
    ? matched.value.length === (current.value.pairs?.length ?? 0)
    : isAnswerCorrect(current.value!, answer.value),
);
const currentEngineSentence = computed(() =>
  current.value?.engine ? generateSentence(current.value.engine.frame) : null,
);
const availableGrammarCards = computed(() =>
  grammarCards.filter((card) =>
    progress.value.completedLessonIds.includes(card.availableAfterLessonId),
  ),
);
const canCheck = computed(() =>
  current.value?.kind === "order"
    ? ordered.value.length === (current.value.tokens?.length ?? 0)
    : Boolean(answer.value),
);
const vocabulary = learnerVocabulary;
function introductionLabel(word: (typeof vocabulary)[number]) {
  const introduction = word.uses.find((use) => use.role === "introduced");
  return introduction
    ? `Eingeführt in Einheit ${introduction.unit}`
    : "Noch nicht im Kurs eingeführt";
}
const pathNodes = ref<Record<string, HTMLElement | null>>({});
const unitHeaderNodes = ref<Record<number, HTMLElement | null>>({});
const selectedPathLessonId = ref<string | null>(null);
const showReviewCard = ref(false);
const previewCompletedUnit =
  Number(new URLSearchParams(window.location.search).get("previewUnit")) ||
  null;
const activePathUnit = ref(1);
const nextPathLesson = computed(
  () =>
    lessons.find(
      (lesson) =>
        isLessonUnlocked(lesson, progress.value) &&
        !progress.value.completedLessonIds.includes(lesson.id),
    ) ?? lessons.at(-1),
);
// Mitte → zwei Schritte nach links → vier nach rechts → wieder zurück: fünf Spuren insgesamt.
const pathPositions = [
  "translate-x-0",
  "-translate-x-[90px]",
  "-translate-x-32",
  "-translate-x-[90px]",
  "translate-x-0",
  "translate-x-[90px]",
  "translate-x-32",
  "translate-x-[90px]",
];
const phaseLabels = {
  new: "Neue Wörter",
  practice: "Anwenden",
  review: "Wiederholen",
  grammar: "Grammatik",
  ramp: "Ramp-up",
};
const unitDetails: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Am Lagerfeuer", subtitle: "Begrüßen, danken und ankommen" },
  2: { title: "Menschen & Ausrüstung", subtitle: "Rollen, Gepäck und Versorgung" },
  3: { title: "Im Wald", subtitle: "Orte, Artikel und feste Formen" },
  4: { title: "Vor dem Tor", subtitle: "Einzahl, Mehrzahl und Gruppen" },
  5: { title: "Richtung und Ort", subtitle: "Wege, Karten und feste Formen" },
};
const activeUnitDetails = computed(
  () => unitDetails[activePathUnit.value] ?? unitDetails[1],
);
const futurePathLessons: Lesson[] = [
  {
    id: "road-words",
    unit: 2,
    title: "Unterwegs",
    subtitle: "Weg und Richtung",
    icon: "➜",
    phase: "new",
    exercises: [],
  },
  {
    id: "road-practice",
    unit: 2,
    title: "Den Weg weisen",
    subtitle: "Neue Wörter anwenden",
    icon: "↗",
    phase: "practice",
    exercises: [],
  },
  {
    id: "road-camp",
    unit: 2,
    title: "Am Wegesrand",
    subtitle: "Begegnungen unterwegs",
    icon: "⌂",
    phase: "new",
    exercises: [],
  },
  {
    id: "road-review",
    unit: 2,
    title: "Unterwegs-Mix",
    subtitle: "Bekanntes festigen",
    icon: "↻",
    phase: "review",
    exercises: [],
  },
  {
    id: "road-grammar",
    unit: 2,
    title: "Richtung zeigen",
    subtitle: "Grammatik im Spiel",
    icon: "❋",
    phase: "grammar",
    exercises: [],
  },
  {
    id: "road-ramp",
    unit: 2,
    title: "Ramp-up: Begegnung",
    subtitle: "Alles zusammenbringen",
    icon: "✦",
    phase: "ramp",
    exercises: [],
  },
  {
    id: "forest-words",
    unit: 3,
    title: "Im Wald",
    subtitle: "Wald und Wetter",
    icon: "♣",
    phase: "new",
    exercises: [],
  },
  {
    id: "forest-practice",
    unit: 3,
    title: "Den Wald beschreiben",
    subtitle: "Neue Wörter anwenden",
    icon: "◌",
    phase: "practice",
    exercises: [],
  },
  {
    id: "forest-camp",
    unit: 3,
    title: "Am Waldrand",
    subtitle: "Spuren und Orte",
    icon: "⌁",
    phase: "new",
    exercises: [],
  },
  {
    id: "forest-review",
    unit: 3,
    title: "Waldpfad-Mix",
    subtitle: "Bekanntes festigen",
    icon: "↻",
    phase: "review",
    exercises: [],
  },
  {
    id: "forest-grammar",
    unit: 3,
    title: "Mutationen",
    subtitle: "Grammatik im Spiel",
    icon: "❋",
    phase: "grammar",
    exercises: [],
  },
  {
    id: "forest-ramp",
    unit: 3,
    title: "Ramp-up: Waldgespräch",
    subtitle: "Alles zusammenbringen",
    icon: "✦",
    phase: "ramp",
    exercises: [],
  },
  {
    id: "gate-words",
    unit: 4,
    title: "Vor dem Tor",
    subtitle: "Wache und Ankunft",
    icon: "⌑",
    phase: "new",
    exercises: [],
  },
  {
    id: "gate-practice",
    unit: 4,
    title: "Einlass erbitten",
    subtitle: "Neue Wörter anwenden",
    icon: "◍",
    phase: "practice",
    exercises: [],
  },
  {
    id: "gate-camp",
    unit: 4,
    title: "Die Wache",
    subtitle: "Fragen und Antworten",
    icon: "⚑",
    phase: "new",
    exercises: [],
  },
  {
    id: "gate-review",
    unit: 4,
    title: "Tor-Mix",
    subtitle: "Bekanntes festigen",
    icon: "↻",
    phase: "review",
    exercises: [],
  },
  {
    id: "gate-grammar",
    unit: 4,
    title: "Höflich fragen",
    subtitle: "Grammatik im Spiel",
    icon: "❋",
    phase: "grammar",
    exercises: [],
  },
  {
    id: "gate-ramp",
    unit: 4,
    title: "Ramp-up: Am Tor",
    subtitle: "Alles zusammenbringen",
    icon: "✦",
    phase: "ramp",
    exercises: [],
  },
];
const pathLessons = lessons;
const pathYPositions = pathLessons.reduce<number[]>(
  (positions, lesson, index) => {
    if (!index) return [40];
    const previous = pathLessons[index - 1];
    const unitBreak = previous.unit !== lesson.unit ? 160 : 0;
    return [...positions, positions.at(-1)! + 128 + unitBreak];
  },
  [],
);
const pathTrailHeight = Math.max(720, pathYPositions.at(-1)! + 40);
const unitSections = [...new Set(pathLessons.map((lesson) => lesson.unit))].map(
  (unit) => {
    const indices = pathLessons
      .map((lesson, index) => (lesson.unit === unit ? index : -1))
      .filter((index) => index >= 0);
    return { unit, start: indices[0], end: indices.at(-1)! };
  },
);
function makeTrail(startIndex: number, endIndex: number) {
  const points: string[] = [];
  for (let segment = startIndex; segment < endIndex; segment += 1) {
    const startY = pathYPositions[segment];
    const endY = pathYPositions[segment + 1];
    const steps = Math.ceil((endY - startY) / 8);
    for (let step = 0; step <= steps; step += 1) {
      if (segment > startIndex && step === 0) continue;
      const progress = step / steps;
      const y = startY + (endY - startY) * progress;
      const x = 160 - 128 * Math.sin((segment + progress) * (Math.PI / 4));
      points.push(
        `${points.length ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`,
      );
    }
  }
  return points.join(" ");
}
const lessonBridges = pathLessons.slice(0, -1).map((lesson, index) => ({
  fromLessonId: lesson.id,
  toLessonId: pathLessons[index + 1].id,
  path: makeTrail(index, index + 1),
}));
function isUnitUnlocked(unit: number) {
  if (previewCompletedUnit === unit - 1) return true;
  const firstLessonIndex = pathLessons.findIndex(
    (lesson) => lesson.unit === unit,
  );
  return (
    firstLessonIndex <= 0 ||
    pathLessons
      .slice(0, firstLessonIndex)
      .every((lesson) => progress.value.completedLessonIds.includes(lesson.id))
  );
}
function shouldRevealUnit(unit: number) {
  return unit > 1 && isUnitUnlocked(unit) && isUnitComplete(unit - 1);
}
function isUnitComplete(unit: number) {
  if (previewCompletedUnit === unit) return true;
  const unitLessons = lessons.filter((lesson) => lesson.unit === unit);
  return (
    unitLessons.length > 0 &&
    unitLessons.every((lesson) =>
      progress.value.completedLessonIds.includes(lesson.id),
    )
  );
}
function isAnimatingLesson(lesson: Lesson) {
  return completionAnimation.value?.lessonId === lesson.id;
}
function isAnimationNext(lesson: Lesson) {
  const finishedIndex = pathLessons.findIndex(
    (item) => item.id === completionAnimation.value?.lessonId,
  );
  return finishedIndex >= 0 && pathLessons[finishedIndex + 1]?.id === lesson.id;
}
function isVisuallyCompleted(lesson: Lesson) {
  return (
    progress.value.completedLessonIds.includes(lesson.id) &&
    !(
      isAnimatingLesson(lesson) &&
      completionAnimation.value?.phase === "flip" &&
      !completionColorRevealed.value
    )
  );
}
function isVisualCurrentLesson(lesson: Lesson) {
  if (
    isAnimatingLesson(lesson) &&
    completionAnimation.value?.phase === "flip" &&
    !completionColorRevealed.value
  )
    return true;
  if (isAnimationNext(lesson))
    return (
      completionAnimation.value?.phase === "next" &&
      nextBubbleColorRevealed.value
    );
  return (
    lesson.id === nextPathLesson.value?.id &&
    !progress.value.completedLessonIds.includes(lesson.id)
  );
}
function isPathNodeDisabled(lesson: Lesson) {
  return (
    !isPathLessonUnlocked(lesson) ||
    (isAnimationNext(lesson) && completionAnimation.value?.phase !== "next")
  );
}
function isPerfectLesson(lesson: Lesson) {
  return progress.value.perfectLessonIds.includes(lesson.id);
}
function shouldShowUnitX(lesson: Lesson, index: number) {
  const isUnitFinal =
    !pathLessons[index + 1] || pathLessons[index + 1].unit !== lesson.unit;
  return (
    isUnitFinal &&
    (isVisuallyCompleted(lesson) || isVisualCurrentLesson(lesson))
  );
}
function shouldShowBridge(bridge: (typeof lessonBridges)[number]) {
  if (!progress.value.completedLessonIds.includes(bridge.fromLessonId))
    return false;
  return (
    completionAnimation.value?.lessonId !== bridge.fromLessonId ||
    completionAnimation.value.phase !== "flip"
  );
}
function shouldAnimateBridge(bridge: (typeof lessonBridges)[number]) {
  return (
    completionAnimation.value?.lessonId === bridge.fromLessonId &&
    completionAnimation.value.phase === "path"
  );
}
function isPathLessonUnlocked(lesson: Lesson) {
  return isLessonUnlocked(lesson, progress.value);
}
const pathFocusLesson = computed(() =>
  previewCompletedUnit
    ? pathLessons
        .filter((lesson) => lesson.unit === previewCompletedUnit)
        .at(-1)
    : nextPathLesson.value,
);
function centerPath() {
  nextTick(() =>
    pathNodes.value[pathFocusLesson.value?.id ?? ""]?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    }),
  );
}
function updateActivePathUnit() {
  const threshold = 150;
  const active = unitSections
    .filter(
      (section) =>
        section.unit === 1 ||
        (unitHeaderNodes.value[section.unit]?.getBoundingClientRect().top ??
          Infinity) <= threshold,
    )
    .at(-1);
  activePathUnit.value = active?.unit ?? 1;
}
onMounted(() => {
  progress.value = migrateProgress(progress.value);
  centerPath();
  window.addEventListener("scroll", updateActivePathUnit, { passive: true });
  nextTick(updateActivePathUnit);
});
onUnmounted(() => window.removeEventListener("scroll", updateActivePathUnit));
function selectPathLesson(lesson: Lesson) {
  if (isPathLessonUnlocked(lesson)) {
    showReviewCard.value = false;
    selectedPathLessonId.value = lesson.id;
  }
}
function begin(
  title: string,
  exercises: Exercise[],
  lesson: Lesson | null,
  isReview = false,
) {
  activeTitle.value = title;
  activeLesson.value = lesson;
  queue.value = [...exercises];
  exerciseIndex.value = 0;
  reviewMode.value = isReview;
  correctFirst.value = 0;
  originalCount.value = exercises.length;
  requeued.value = new Set();
  resolvedReviews.value = new Set();
  result.value = false;
  resetExercise();
}
function startLesson(lesson: Lesson) {
  if (isLessonUnlocked(lesson, progress.value))
    begin(
      lesson.title,
      lessonExerciseSet(lesson, progress.value.practiceSignals),
      lesson,
    );
}
function startReview() {
  const items = progress.value.reviewExerciseIds
    .map(findExercise)
    .filter((item): item is Exercise => Boolean(item));
  if (items.length) begin("Wiederholung", items, null, true);
}
function resetExercise() {
  answer.value = "";
  ordered.value = [];
  checked.value = false;
  showWhy.value = false;
  matchLeft.value = "";
  matchRight.value = "";
  matched.value = [];
  matchMistakes.value = 0;
  matchMessage.value = "";
  matchMismatch.value = false;
}
function selectAnswer(value: string) {
  if (!checked.value) answer.value = value;
}
function addToken(token: string) {
  if (!checked.value && !ordered.value.includes(token))
    ordered.value.push(token);
  answer.value = ordered.value.join(" ");
}
function removeToken(index: number) {
  if (!checked.value) {
    ordered.value.splice(index, 1);
    answer.value = ordered.value.join(" ");
  }
}
function recordOutcome(correct: boolean) {
  if (!current.value) return;
  if (correct) {
    progress.value = recordExerciseSuccess(progress.value, current.value);
    if (reviewMode.value) resolvedReviews.value.add(current.value.id);
    else if (!requeued.value.has(current.value.id)) correctFirst.value += 1;
  } else if (!requeued.value.has(current.value.id)) {
    requeued.value.add(current.value.id);
    queue.value.push(current.value);
    progress.value = queueForReview(progress.value, current.value.id);
    progress.value = recordExerciseMiss(progress.value, current.value);
  }
}
function checkAnswer() {
  if (!canCheck.value || checked.value) return;
  checked.value = true;
  recordOutcome(currentCorrect.value);
}
function chooseMatch(side: "left" | "right", value: string) {
  if (checked.value || matchMismatch.value) return;
  if (side === "left") matchLeft.value = value;
  else matchRight.value = value;
  if (!matchLeft.value || !matchRight.value) return;
  const pair = current.value?.pairs?.find(
    (item) => item.left === matchLeft.value,
  );
  if (pair?.right === matchRight.value) {
    matched.value.push(matchLeft.value);
    matchMessage.value = "Passt!";
    matchLeft.value = "";
    matchRight.value = "";
    if (matched.value.length === (current.value?.pairs?.length ?? 0)) {
      checked.value = true;
      recordOutcome(true);
    }
  } else {
    const exerciseId = current.value?.id;
    matchMistakes.value += 1;
    matchMessage.value = `Nicht ganz – noch ${Math.max(0, 3 - matchMistakes.value)} Versuche.`;
    matchMismatch.value = true;
    window.setTimeout(() => {
      if (current.value?.id !== exerciseId) return;
      matchMismatch.value = false;
      matchLeft.value = "";
      matchRight.value = "";
      if (matchMistakes.value >= 3) {
        checked.value = true;
        recordOutcome(false);
      }
    }, 420);
  }
}
function next() {
  if (exerciseIndex.value + 1 < queue.value.length) {
    exerciseIndex.value += 1;
    resetExercise();
  } else finish();
}
function finish() {
  if (reviewMode.value)
    progress.value.reviewExerciseIds = progress.value.reviewExerciseIds.filter(
      (id) => !resolvedReviews.value.has(id),
    );
  else if (activeLesson.value && score.value >= 80) {
    const isNewCompletion = !progress.value.completedLessonIds.includes(
      activeLesson.value.id,
    );
    if (isNewCompletion)
      progress.value.completedLessonIds.push(activeLesson.value.id);
    if (
      score.value === 100 &&
      !progress.value.perfectLessonIds.includes(activeLesson.value.id)
    )
      progress.value.perfectLessonIds.push(activeLesson.value.id);
    progress.value = awardProgress(progress.value, correctFirst.value * 10);
    if (isNewCompletion)
      pendingCompletionLessonId.value = activeLesson.value.id;
  }
  result.value = true;
}
function playCompletionAnimation(lessonId: string) {
  completionColorRevealed.value = false;
  completionAnimation.value = { lessonId, phase: "flip" };
  window.setTimeout(() => {
    if (completionAnimation.value?.lessonId === lessonId)
      completionColorRevealed.value = true;
  }, 450);
  window.setTimeout(() => {
    if (completionAnimation.value?.lessonId === lessonId)
      completionAnimation.value = { lessonId, phase: "path" };
  }, 900);
  window.setTimeout(() => {
    if (completionAnimation.value?.lessonId === lessonId) {
      nextBubbleColorRevealed.value = false;
      completionAnimation.value = { lessonId, phase: "next" };
      window.setTimeout(() => {
        if (completionAnimation.value?.lessonId === lessonId)
          nextBubbleColorRevealed.value = true;
      }, 450);
    }
  }, 2300);
  window.setTimeout(() => {
    if (completionAnimation.value?.lessonId === lessonId)
      completionAnimation.value = null;
  }, 3200);
}
function leave() {
  const completedLessonId = pendingCompletionLessonId.value;
  pendingCompletionLessonId.value = null;
  activeLesson.value = null;
  queue.value = [];
  result.value = false;
  selectedPathLessonId.value = null;
  showReviewCard.value = false;
  screen.value = "learn";
  if (!completedLessonId) {
    centerPath();
    return;
  }
  nextTick(() => {
    pathNodes.value[completedLessonId]?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
    window.setTimeout(() => playCompletionAnimation(completedLessonId), 300);
  });
}
function exportProgress() {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(progress.value, null, 2)], {
      type: "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "tadlam-fortschritt.json";
  a.click();
  URL.revokeObjectURL(url);
}
function importProgress(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const value = JSON.parse(String(reader.result));
      if (
        !Array.isArray(value.completedLessonIds) ||
        typeof value.xp !== "number"
      )
        throw Error();
      progress.value = migrateProgress(value);
      importError.value = "";
    } catch {
      importError.value = "Diese Datei ist kein Tadlam-Fortschritt.";
    }
  };
  reader.readAsText(file);
}
function resetProgress() {
  progress.value = defaultProgress();
  showReset.value = false;
}
function playLibraryAnimation(
  name: "flip" | "next" | "trail" | "fog" | "shake" | "journey" | "lesson",
) {
  animationRuns.value[name] += 1;
  if (name === "flip") {
    libraryCoinLanded.value = false;
    window.setTimeout(() => {
      libraryCoinLanded.value = true;
    }, 450);
  }
  if (name === "next") {
    libraryNextLanded.value = false;
    window.setTimeout(() => {
      libraryNextLanded.value = true;
    }, 450);
  }
  if (name === "journey") {
    libraryJourneyCompleted.value = false;
    libraryJourneyPhase.value = "flip";
    window.setTimeout(() => {
      libraryJourneyCompleted.value = true;
    }, 450);
    window.setTimeout(() => {
      libraryJourneyPhase.value = "path";
    }, 900);
    window.setTimeout(() => {
      libraryJourneyPhase.value = "next";
    }, 2700);
    window.setTimeout(() => {
      libraryJourneyPhase.value = "unit";
    }, 3600);
  }
  if (name === "lesson") {
    libraryLessonCompleted.value = false;
    libraryLessonPhase.value = "flip";
    window.setTimeout(() => {
      libraryLessonCompleted.value = true;
    }, 450);
    window.setTimeout(() => {
      libraryLessonPhase.value = "path";
    }, 900);
    window.setTimeout(() => {
      libraryLessonPhase.value = "next";
    }, 2700);
  }
}
</script>

<template>
  <main
    class="grain min-h-screen transition-colors"
    :class="
      darkMode ? 'dark bg-[#10251f] text-[#edf4e9]' : 'bg-parchment text-ink'
    "
  >
    <div class="mx-auto min-h-screen max-w-xl px-4 pb-10 pt-5 sm:px-6">
      <header class="mb-6 flex items-center justify-between">
        <button
          class="flex items-center gap-3 text-left"
          aria-label="Zum Lernpfad"
          @click="leave"
        >
          <span
            class="grid h-11 w-11 place-items-center rounded-2xl bg-forest text-xl text-[#f9e7a8] shadow-float"
            >✦</span
          ><strong
            class="font-display text-2xl tracking-wide text-forest dark:text-[#ddf3d5]"
            >Tadlam</strong
          >
        </button>
        <div class="flex gap-2 text-sm font-bold">
          <span
            class="rounded-xl bg-white px-3 py-2 text-orange-500 shadow-sm dark:bg-[#1f3b32]"
            >🔥 {{ progress.streak }}</span
          ><span
            class="rounded-xl bg-white px-3 py-2 text-moss shadow-sm dark:bg-[#1f3b32] dark:text-[#d8eecb]"
            title="Erfahrungspunkte"
            >XP {{ progress.xp }}</span
          >
        </div>
      </header>
      <section v-if="current && !result" class="space-y-4">
        <div class="flex items-center gap-3">
          <button
            class="text-xl text-moss dark:text-[#b4d6b7]"
            aria-label="Lektion verlassen"
            @click="leave"
          >
            ×
          </button>
          <div
            class="h-3 flex-1 overflow-hidden rounded-full bg-[#dce6db] dark:bg-[#315244]"
          >
            <div
              class="h-full rounded-full bg-leaf"
              :style="{
                width: `${((exerciseIndex + 1) / queue.length) * 100}%`,
              }"
            />
          </div>
          <span class="text-sm font-bold text-moss dark:text-[#b4d6b7]"
            >{{ exerciseIndex + 1 }}/{{ queue.length }}</span
          >
        </div>
        <article
          class="rounded-[2rem] bg-white p-6 shadow-float dark:bg-[#18362c] sm:p-8"
        >
          <div class="mb-5 flex items-center gap-2">
            <span
              class="rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
              :class="
                current.status === 'neo'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-[#e5f7d5] text-[#367700]'
              "
              >{{ statusLabel(current.status) }}</span
            ><span
              class="text-xs font-semibold text-[#728078] dark:text-[#adc4b1]"
              >{{ activeTitle }}</span
            >
          </div>
          <h1
            class="font-display text-3xl font-bold leading-tight text-forest dark:text-[#edf4e9]"
          >
            {{ current.prompt }}
          </h1>
          <p
            v-if="current.pronunciation"
            class="mt-3 text-sm font-bold tracking-wide text-moss dark:text-[#b4d6b7]"
          >
            Aussprache: {{ current.pronunciation }}
          </p>
          <div
            v-if="current.kind === 'choice' || current.kind === 'cloze'"
            class="mt-7 grid gap-3"
          >
            <button
              v-for="choice in current.choices"
              :key="choice"
              class="choice dark:border-[#3c5e50] dark:bg-[#1d3d32] dark:text-white"
              :class="{
                selected: answer === choice,
                correct: checked && choice === current.answer && currentCorrect,
                incorrect: checked && answer === choice && !currentCorrect,
                '!border-[#e6b84d] !bg-[#5d4b26] !text-[#fff8dc] ring-4 ring-[#e6b84d]/25':
                  answer === choice && !checked,
                '!border-[#75d643] !bg-[#245c38] !text-white ring-4 ring-[#75d643]/25':
                  checked && choice === current.answer && currentCorrect,
                '!border-[#9acb78] !border-dashed !bg-transparent !text-[#d8eecb]':
                  checked && choice === current.answer && !currentCorrect,
                '!border-red-400 !bg-[#5a2929] !text-white ring-4 ring-red-400/20':
                  checked && answer === choice && !currentCorrect,
              }"
              :disabled="checked"
              @click="selectAnswer(choice)"
            >
              <span>{{ choice }}</span
              ><span
                v-if="answer === choice && !checked"
                class="float-right rounded-full bg-[#e6b84d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3b2c0e]"
                >Ausgewählt</span
              ><span
                v-else-if="
                  checked && choice === current.answer && currentCorrect
                "
                class="float-right rounded-full bg-[#75d643] px-1.5 py-0.5 text-xs text-[#143322]"
                >✓</span
              ><span
                v-else-if="checked && choice === current.answer"
                class="float-right rounded-full border border-dashed border-[#9acb78] px-1.5 py-0.5 text-[10px] font-bold text-[#d8eecb]"
                >Richtig</span
              ><span
                v-else-if="checked && answer === choice"
                class="float-right rounded-full bg-red-300 px-1.5 py-0.5 text-xs text-red-900"
                >×</span
              >
            </button>
          </div>
          <div v-else-if="current.kind === 'type'" class="mt-7">
            <label class="sr-only" for="answer">Antwort</label
            ><input
              id="answer"
              v-model="answer"
              :disabled="checked"
              class="w-full rounded-2xl border-2 border-[#dbe4dc] bg-white px-5 py-4 text-xl font-semibold outline-none focus:border-moss focus:ring-4 focus:ring-leaf/25 dark:border-[#3c5e50] dark:bg-[#1d3d32]"
              :class="{
                '!border-[#75d643] !bg-[#245c38] !text-white ring-4 ring-[#75d643]/25':
                  checked && currentCorrect,
                '!border-red-400 !bg-[#5a2929] !text-white ring-4 ring-red-400/20':
                  checked && !currentCorrect,
              }"
              placeholder="Deine Antwort …"
              @keyup.enter="checkAnswer"
            />
          </div>
          <div v-else-if="current.kind === 'order'" class="mt-7">
            <div
              class="min-h-16 rounded-2xl border-2 border-dashed border-[#c9d9ca] p-3 dark:border-[#486859]"
              :class="{
                '!border-[#75d643] !bg-[#245c38] ring-4 ring-[#75d643]/25':
                  checked && currentCorrect,
                '!border-red-400 !bg-[#5a2929] ring-4 ring-red-400/20':
                  checked && !currentCorrect,
              }"
            >
              <button
                v-for="(token, index) in ordered"
                :key="`${token}-${index}`"
                class="m-1 rounded-xl px-3 py-2 font-bold"
                :class="
                  checked
                    ? currentCorrect
                      ? 'bg-[#75d643] text-[#143322]'
                      : 'bg-red-300 text-red-900'
                    : 'bg-[#e5f7d5] text-forest'
                "
                :disabled="checked"
                @click="removeToken(index)"
              >
                {{ token }}</button
              ><span v-if="!ordered.length" class="p-2 text-sm text-[#849087]"
                >Tippe die Wörter in der richtigen Reihenfolge an.</span
              >
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-for="token in current.tokens"
                :key="token"
                class="rounded-xl border-2 border-[#d6e2d6] px-3 py-2 font-bold dark:border-[#486859]"
                :disabled="checked || ordered.includes(token)"
                @click="addToken(token)"
              >
                {{ token }}
              </button>
            </div>
          </div>
          <div v-else-if="current.kind === 'match'" class="mt-7">
            <p class="mb-3 text-sm text-[#68766e] dark:text-[#b4c9b8]">
              {{
                matchMessage ||
                "Wähle links ein Wort und rechts seine Bedeutung."
              }}
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div class="grid gap-2">
                <button
                  v-for="pair in current.pairs"
                  :key="pair.left"
                  class="choice !px-3 !py-3 dark:border-[#3c5e50] dark:bg-[#1d3d32]"
                  :class="{
                    selected: matchLeft === pair.left,
                    correct: matched.includes(pair.left),
                    '!border-[#75d643] !bg-[#245c38] !text-white ring-2 ring-[#75d643]/30':
                      matched.includes(pair.left),
                    '!border-red-400 !bg-[#5a2929] !text-white animate-[tadlam-shake_.42s_ease-in-out]':
                      matchMismatch && matchLeft === pair.left,
                  }"
                  :disabled="checked || matched.includes(pair.left)"
                  @click="chooseMatch('left', pair.left)"
                >
                  <span>{{ pair.left }}</span
                  ><span
                    v-if="matched.includes(pair.left)"
                    class="float-right rounded-full bg-[#75d643] px-1.5 py-0.5 text-xs text-[#143322]"
                    >✓</span
                  >
                </button>
              </div>
              <div class="grid gap-2">
                <button
                  v-for="pair in current.pairs"
                  :key="pair.right"
                  class="choice !px-3 !py-3 dark:border-[#3c5e50] dark:bg-[#1d3d32]"
                  :class="{
                    selected: matchRight === pair.right,
                    correct: matched.includes(
                      current.pairs?.find((item) => item.right === pair.right)
                        ?.left || '',
                    ),
                    '!border-[#75d643] !bg-[#245c38] !text-white ring-2 ring-[#75d643]/30':
                      matched.includes(
                        current.pairs?.find((item) => item.right === pair.right)
                          ?.left || '',
                      ),
                    '!border-red-400 !bg-[#5a2929] !text-white animate-[tadlam-shake_.42s_ease-in-out]':
                      matchMismatch && matchRight === pair.right,
                  }"
                  :disabled="
                    checked ||
                    matched.includes(
                      current.pairs?.find((item) => item.right === pair.right)
                        ?.left || '',
                    )
                  "
                  @click="chooseMatch('right', pair.right)"
                >
                  <span>{{ pair.right }}</span
                  ><span
                    v-if="
                      matched.includes(
                        current.pairs?.find((item) => item.right === pair.right)
                          ?.left || '',
                      )
                    "
                    class="float-right rounded-full bg-[#75d643] px-1.5 py-0.5 text-xs text-[#143322]"
                    >✓</span
                  >
                </button>
              </div>
            </div>
          </div>
          <button
            class="mt-6 text-sm font-bold text-moss underline underline-offset-4 dark:text-[#b4d6b7]"
            @click="showWhy = !showWhy"
          >
            {{ showWhy ? "Erklärung schließen" : "Warum?" }}
          </button>
          <div
            v-if="showWhy"
            class="mt-3 rounded-2xl bg-[#f1f7ef] p-4 text-sm text-[#42534a] dark:bg-[#224438] dark:text-[#d5e6d7]"
          >
            <strong
              >{{ statusLabel(current.status) }} · {{ current.source }}</strong
            >
            <p class="mt-1">{{ current.hint }}</p>
            <template v-if="currentEngineSentence">
              <div class="mt-4 border-t border-[#c9dbc9] pt-3 dark:border-[#4c6f5d]">
                <p class="text-xs font-bold uppercase tracking-[.14em] text-moss dark:text-[#b4d6b7]">
                  Regelspur
                </p>
                <ul class="mt-2 space-y-2">
                  <li
                    v-for="step in currentEngineSentence.derivation"
                    :key="`${step.ruleId}-${step.to}`"
                  >
                    <strong>{{ step.from }} → {{ step.to }}</strong>
                    <span class="block text-xs leading-5">{{ step.explanation }}</span>
                    <a
                      v-if="sourceUrl(step.sourceRefId)"
                      :href="sourceUrl(step.sourceRefId) ?? undefined"
                      target="_blank"
                      rel="noreferrer"
                      class="mt-1 inline-block text-xs font-bold text-moss underline underline-offset-2 dark:text-[#b4d6b7]"
                      >{{ sourceLabel(step.sourceRefId) }}</a
                    >
                  </li>
                </ul>
              </div>
            </template>
          </div>
        </article>
        <div
          class="rounded-[1.5rem] p-4"
          :class="[
            checked
              ? currentCorrect
                ? 'bg-[#e6f7d6] text-[#286600]'
                : 'bg-[#fff0ef] text-red-700'
              : 'bg-white/70 dark:bg-[#18362c]',
            { invisible: !checked && current.kind === 'match' },
          ]"
        >
          <p v-if="checked" class="mb-3 font-bold">
            {{
              currentCorrect
                ? "Richtig – gut gemacht!"
                : `Noch nicht. Richtig ist: ${current.answer}`
            }}
          </p>
          <button
            v-if="current.kind !== 'match' && !checked"
            class="w-full rounded-2xl px-5 py-4 font-bold transition"
            :class="
              canCheck
                ? 'bg-forest text-white shadow-sm hover:bg-moss'
                : 'cursor-not-allowed bg-[#d8e2d7] text-[#768178] dark:bg-[#29493d] dark:text-[#94aa99]'
            "
            :disabled="!canCheck"
            @click="checkAnswer"
          >
            Prüfen</button
          ><button
            v-else-if="checked"
            class="w-full rounded-2xl bg-forest px-5 py-4 font-bold text-white"
            @click="next"
          >
            {{
              exerciseIndex + 1 === queue.length ? "Ergebnis ansehen" : "Weiter"
            }}
          </button>
        </div>
      </section>
      <section v-else-if="result" class="pt-10 text-center">
        <article
          class="rounded-[2rem] bg-white p-8 shadow-float dark:bg-[#18362c]"
        >
          <div class="text-6xl">
            {{ reviewMode ? "↻" : score >= 80 ? "✦" : "☾" }}
          </div>
          <p
            class="mt-4 text-sm font-bold uppercase tracking-[.18em] text-moss dark:text-[#b4d6b7]"
          >
            {{ reviewMode ? "Wiederholung beendet" : "Lektion beendet" }}
          </p>
          <h1
            class="mt-2 font-display text-4xl font-bold text-forest dark:text-[#edf4e9]"
          >
            {{
              reviewMode
                ? "Gut aufgefrischt!"
                : score >= 80
                  ? "Weg frei!"
                  : "Noch eine Runde"
            }}
          </h1>
          <p class="mt-4 text-[#596960] dark:text-[#c3d7c5]">
            {{
              reviewMode
                ? "Richtig gelöste Karten verlassen den Wiederholungsstapel."
                : score >= 80
                  ? `Du hast ${correctFirst} von ${originalCount} Aufgaben beim ersten Versuch gelöst.`
                  : "Zum Freischalten brauchst du mindestens 80 %. Fehlerkarten liegen in deiner Wiederholung bereit."
            }}
          </p>
          <div
            v-if="!reviewMode"
            class="my-7 rounded-2xl bg-[#eef8ed] p-4 text-forest dark:bg-[#224438]"
          >
            <strong class="text-3xl">{{ score }} %</strong
            ><span class="ml-2 text-sm font-bold">Trefferquote</span>
          </div>
          <button
            class="mt-6 w-full rounded-2xl bg-leaf px-5 py-4 font-bold text-[#173b2b]"
            @click="leave"
          >
            Zum Lernpfad
          </button>
        </article>
      </section>
      <template v-else
        ><nav
          class="mb-6 flex gap-2 rounded-2xl bg-white/80 p-2 text-sm font-bold text-moss shadow-sm dark:bg-[#18362c] dark:text-[#b4d6b7]"
        >
          <button
            class="flex-1 rounded-xl px-2 py-2"
            :class="screen === 'learn' ? 'bg-forest text-white' : ''"
            @click="screen = 'learn'"
          >
            Lernen</button
          ><button
            class="flex-1 rounded-xl px-2 py-2"
            :class="screen === 'words' ? 'bg-forest text-white' : ''"
            @click="screen = 'words'"
          >
            Wörter</button
          ><button
            class="flex-1 rounded-xl px-2 py-2"
            :class="screen === 'grammar' ? 'bg-forest text-white' : ''"
            @click="screen = 'grammar'"
          >
            Regeln</button
          ><button
            v-if="isDevelopment"
            class="flex-1 rounded-xl px-2 py-2"
            :class="screen === 'library' ? 'bg-forest text-white' : ''"
            @click="screen = 'library'"
          >
            Bewegung</button
          ><button
            class="flex-1 rounded-xl px-2 py-2"
            :class="screen === 'profile' ? 'bg-forest text-white' : ''"
            @click="screen = 'profile'"
          >
            Du
          </button>
        </nav>
        <section
          v-if="screen === 'learn'"
          class="-mx-4 overflow-x-clip sm:-mx-6"
        >
          <div class="sticky top-0 z-30 mx-auto max-w-xl px-4 pt-2 sm:px-6">
            <div
              class="rounded-2xl border border-[#6c9671]/50 bg-[#15382c]/95 px-5 py-4 text-white shadow-float backdrop-blur"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p
                    class="text-[10px] font-bold uppercase tracking-[.18em] text-[#bde8a1]"
                  >
                    Grundkurs · Einheit {{ activePathUnit }}
                  </p>
                  <h1
                    class="mt-1 font-display text-2xl font-bold"
                    :class="{
                      'tadlam-fog-reveal': shouldRevealUnit(activePathUnit),
                    }"
                  >
                    {{
                      isUnitUnlocked(activePathUnit)
                        ? activeUnitDetails.title
                        : "???"
                    }}
                  </h1>
                  <p
                    class="mt-1 text-xs text-[#d8e5d7]"
                    :class="{
                      'tadlam-fog-reveal tadlam-fog-reveal-delayed':
                        shouldRevealUnit(activePathUnit),
                    }"
                  >
                    {{
                      isUnitUnlocked(activePathUnit)
                        ? activeUnitDetails.subtitle
                        : "Noch nicht freigeschaltet"
                    }}
                  </p>
                </div>
                <span
                  class="rounded-xl bg-[#244c3d] px-3 py-2 text-right text-xs font-bold text-[#d8e5d7]"
                  >{{ progress.todayXp }}/{{ progress.goal }}<br /><span
                    class="text-[10px] uppercase tracking-wide text-[#bde8a1]"
                    >Tagesziel</span
                  ></span
                >
              </div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  class="h-full rounded-full bg-leaf"
                  :style="{ width: `${percent}%` }"
                />
              </div>
            </div>
          </div>
          <div
            class="relative mx-auto flex max-w-xl flex-col items-center gap-12 px-12 pb-[35vh] pt-24"
          >
            <button
              v-if="selectedPathLessonId"
              class="fixed inset-0 z-20 cursor-default"
              aria-label="Detailkarte schließen"
              @click="selectedPathLessonId = null"
            />
            <svg
              class="pointer-events-none absolute left-1/2 top-24 z-0 w-80 -translate-x-1/2 overflow-visible"
              :style="{ height: `${pathTrailHeight}px` }"
              :viewBox="`0 0 320 ${pathTrailHeight}`"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <template
                  v-for="bridge in lessonBridges"
                  :key="bridge.fromLessonId"
                >
                  <mask
                    v-if="shouldAnimateBridge(bridge)"
                    :id="`lesson-bridge-${bridge.fromLessonId}`"
                  >
                    <path
                      :d="bridge.path"
                      class="tadlam-bridge-mask"
                      pathLength="100"
                      stroke="white"
                      stroke-width="14"
                    />
                  </mask>
                </template>
              </defs>
              <path
                v-for="bridge in lessonBridges.filter(shouldShowBridge)"
                :key="bridge.fromLessonId"
                :d="bridge.path"
                :mask="
                  shouldAnimateBridge(bridge)
                    ? `url(#lesson-bridge-${bridge.fromLessonId})`
                    : undefined
                "
                class="tadlam-bridge-path"
                stroke="#a3c987"
                stroke-width="4"
                stroke-linecap="round"
                stroke-dasharray="3 13"
              />
            </svg>
            <article
              v-if="progress.reviewExerciseIds.length"
              class="relative z-10 -translate-x-20"
            >
              <button
                class="grid h-20 w-20 place-items-center rounded-full border-4 border-[#f5d96a] bg-[#fff2ba] text-3xl text-[#5b4716] shadow-float transition active:scale-95"
                title="Persönliche Wiederholung"
                @click="
                  selectedPathLessonId = null;
                  showReviewCard = true;
                "
              >
                ↻
              </button>
              <div
                v-if="showReviewCard"
                class="relative mt-5 w-64 rounded-2xl border-2 border-[#e5c95b] bg-[#4d401d] p-4 text-left shadow-float"
              >
                <span
                  class="absolute -top-2 left-10 h-4 w-4 rotate-45 border-l-2 border-t-2 border-[#e5c95b] bg-[#4d401d]"
                />
                <div class="relative">
                  <p
                    class="text-[10px] font-bold uppercase tracking-[.16em] text-[#fff0a7]"
                  >
                    Wiederholen
                  </p>
                  <h2 class="mt-1 font-display text-2xl font-bold text-white">
                    Deine Wiederholung
                  </h2>
                  <p class="mt-1 text-sm text-[#fff3ca]">
                    Karten, die dir zuletzt schwergefallen sind.
                  </p>
                  <button
                    class="mt-4 w-full rounded-xl bg-[#f5d96a] px-4 py-3 font-bold text-[#44370e]"
                    @click="startReview"
                  >
                    Loslegen
                  </button>
                </div>
              </div>
            </article>
            <template v-for="(lesson, index) in pathLessons" :key="lesson.id">
              <div
                v-if="index && pathLessons[index - 1].unit !== lesson.unit"
                :ref="
                  (element) => {
                    unitHeaderNodes[lesson.unit] =
                      element as HTMLElement | null;
                  }
                "
                class="relative z-10 flex h-28 w-full items-center justify-center text-center"
              >
                <div class="max-w-64 px-5">
                  <p
                    class="text-[10px] font-bold uppercase tracking-[.2em] text-[#bde8a1]"
                  >
                    Grundkurs · Einheit {{ lesson.unit }}
                  </p>
                  <h2
                    class="mt-1 font-display text-2xl font-bold text-white"
                    :class="{
                      'tadlam-fog-reveal': shouldRevealUnit(lesson.unit),
                    }"
                  >
                    {{
                      isUnitUnlocked(lesson.unit)
                        ? unitDetails[lesson.unit].title
                        : "???"
                    }}
                  </h2>
                  <p
                    class="mt-1 text-xs text-[#d8e5d7]"
                    :class="{
                      'tadlam-fog-reveal tadlam-fog-reveal-delayed':
                        shouldRevealUnit(lesson.unit),
                    }"
                  >
                    {{
                      isUnitUnlocked(lesson.unit)
                        ? unitDetails[lesson.unit].subtitle
                        : "Noch nicht freigeschaltet"
                    }}
                  </p>
                </div>
              </div>
              <article
                :ref="
                  (element) => {
                    pathNodes[lesson.id] = element as HTMLElement | null;
                  }
                "
                class="relative flex flex-col items-center transition-transform"
                :class="[
                  pathPositions[index % pathPositions.length],
                  selectedPathLessonId === lesson.id ? 'z-30' : 'z-10',
                ]"
              >
                <svg
                  v-if="shouldShowUnitX(lesson, index)"
                  class="pointer-events-none absolute left-1/2 top-10 -z-10 h-36 w-36 -translate-x-1/2 -translate-y-1/2"
                  :class="
                    isUnitComplete(lesson.unit)
                      ? 'text-[#9b7040]/45'
                      : 'text-[#c8514c]'
                  "
                  viewBox="0 0 144 144"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M30 30 L114 114 M114 30 L30 114"
                    stroke="currentColor"
                    stroke-width="16"
                    stroke-linecap="round"
                  />
                </svg>
                <button
                  class="relative grid h-20 w-20 place-items-center rounded-full border-4 text-3xl shadow-float transition active:scale-95"
                  :class="[
                    isVisuallyCompleted(lesson)
                      ? isPerfectLesson(lesson)
                        ? 'border-[#f6dc79] bg-[#d4b557] text-[#40300d]'
                        : 'border-[#9be071] bg-[#357b4a] text-[#efffe8]'
                      : isVisualCurrentLesson(lesson)
                        ? 'border-[#fff0a1] bg-[#e2b94c] text-[#473608] ring-8 ring-[#e2b94c]/25'
                        : 'border-[#6b7770] bg-[#48564e] text-[#b7c1b8]',
                    {
                      'tadlam-coin-flip':
                        (isAnimatingLesson(lesson) &&
                          completionAnimation?.phase === 'flip') ||
                        (isAnimationNext(lesson) &&
                          completionAnimation?.phase === 'next'),
                    },
                  ]"
                  :disabled="isPathNodeDisabled(lesson)"
                  :aria-label="lesson.title"
                  @click="selectPathLesson(lesson)"
                >
                  <span class="tadlam-coin-front">{{
                    isVisuallyCompleted(lesson) ? "✓" : lesson.icon
                  }}</span
                  ><span
                    v-if="
                      (isAnimatingLesson(lesson) &&
                        completionAnimation?.phase === 'flip') ||
                      (isAnimationNext(lesson) &&
                        completionAnimation?.phase === 'next')
                    "
                    class="tadlam-coin-back"
                    >{{ isVisuallyCompleted(lesson) ? "✓" : lesson.icon }}</span
                  >
                </button>
                <div
                  v-if="selectedPathLessonId === lesson.id"
                  class="absolute left-1/2 top-24 z-30 w-64 -translate-x-1/2 rounded-2xl border-2 border-[#9bc680] bg-[#183d2e] p-4 text-left shadow-float"
                >
                  <span
                    class="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-[#9bc680] bg-[#183d2e]"
                  />
                  <div class="relative">
                    <button
                      class="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-lg text-xl text-[#d8e5d7] transition hover:bg-white/10 hover:text-white"
                      aria-label="Detailkarte schließen"
                      @click="selectedPathLessonId = null"
                    >
                      ×
                    </button>
                    <p
                      class="text-[10px] font-bold uppercase tracking-[.16em] text-[#bde8a1]"
                    >
                      {{ phaseLabels[lesson.phase] }}
                    </p>
                    <h2
                      class="mt-1 pr-8 font-display text-2xl font-bold text-white"
                    >
                      {{ lesson.title }}
                    </h2>
                    <p class="mt-1 text-sm text-[#d8e5d7]">
                      {{ lesson.subtitle }}
                    </p>
                    <p
                      v-if="lesson.id === nextPathLesson?.id"
                      class="mt-3 text-xs font-bold text-[#d5efc7]"
                    >
                      Hier weitermachen
                    </p>
                    <button
                      class="mt-4 w-full rounded-xl bg-leaf px-4 py-3 font-bold text-[#173b2b] transition hover:brightness-105"
                      @click="startLesson(lesson)"
                    >
                      Loslegen
                    </button>
                  </div>
                </div>
              </article>
            </template>
          </div>
        </section>
        <section v-else-if="screen === 'words'">
          <p
            class="text-xs font-bold uppercase tracking-[.18em] text-moss dark:text-[#b4d6b7]"
          >
            Dein Begleiter
          </p>
          <h1
            class="font-display text-3xl font-bold text-forest dark:text-[#edf4e9]"
          >
            Wörter im Gepäck
          </h1>
          <div class="mt-5 grid gap-3">
            <article
              v-for="word in vocabulary"
              :key="word.lexemeId"
              class="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
            >
              <div class="flex justify-between gap-3">
                <strong
                  class="font-display text-2xl text-forest dark:text-[#edf4e9]"
                  >{{ word.surface }}</strong
                ><span
                  class="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase leading-none"
                  :class="
                    word.status === 'neo'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-[#e5f7d5] text-[#367700]'
                  "
                  >{{ statusLabel(word.status) }}</span
                >
              </div>
              <p class="mt-2 text-[#5a6c61] dark:text-[#c3d7c5]">
                {{ word.translation }}
              </p>
              <p
                class="mt-2 text-xs font-bold tracking-wide text-moss dark:text-[#b4d6b7]"
              >
                {{ word.pronunciation }}
              </p>
              <p v-if="word.note" class="mt-3 text-sm text-[#5a6c61] dark:text-[#c3d7c5]">
                {{ word.note }}
              </p>
              <div class="mt-4 border-t border-[#e1ebe0] pt-3 text-xs dark:border-[#315445]">
                <p class="font-bold text-[#5a6c61] dark:text-[#c3d7c5]">
                  {{ introductionLabel(word) }}
                </p>
                <a
                  v-if="sourceUrl(word.sourceRefId)"
                  :href="sourceUrl(word.sourceRefId) ?? undefined"
                  target="_blank"
                  rel="noreferrer"
                  class="mt-2 inline-block font-bold text-moss underline underline-offset-2 dark:text-[#b4d6b7]"
                  >{{ word.surface }} bei Eldamo</a
                >
              </div>
            </article>
          </div>
        </section>
        <section v-else-if="screen === 'grammar'">
          <p
            class="text-xs font-bold uppercase tracking-[.18em] text-moss dark:text-[#b4d6b7]"
          >
            Schritt für Schritt
          </p>
          <h1
            class="font-display text-3xl font-bold text-forest dark:text-[#edf4e9]"
          >
            Regeln im Spiel
          </h1>
          <p class="mt-2 text-sm text-[#5a6c61] dark:text-[#c3d7c5]">
            Regeln werden erst sichtbar, nachdem sie im Lernpfad eingeführt wurden.
          </p>
          <div v-if="availableGrammarCards.length" class="mt-5 grid gap-3">
            <article
              v-for="card in availableGrammarCards"
              :key="card.id"
              class="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
            >
              <p class="text-[10px] font-bold uppercase tracking-[.16em] text-moss dark:text-[#b4d6b7]">
                {{ card.shortLabel }}
              </p>
              <h2 class="mt-1 font-display text-2xl font-bold text-forest dark:text-[#edf4e9]">
                {{ card.title }}
              </h2>
              <p class="mt-3 text-sm leading-6 text-[#5a6c61] dark:text-[#c3d7c5]">
                {{ card.explanation }}
              </p>
              <p class="mt-4 rounded-xl bg-[#f1f7ef] px-3 py-2 font-bold text-forest dark:bg-[#224438] dark:text-[#e8f3e8]">
                {{ card.example }}
              </p>
              <div class="mt-4 flex flex-wrap gap-x-3 gap-y-1">
                <a
                  v-for="sourceRefId in card.sourceRefIds"
                  :key="sourceRefId"
                  :href="sourceUrl(sourceRefId) ?? undefined"
                  target="_blank"
                  rel="noreferrer"
                  class="text-xs font-bold text-moss underline underline-offset-2 dark:text-[#b4d6b7]"
                  >{{ sourceLabel(sourceRefId) }}</a
                >
              </div>
            </article>
          </div>
          <article
            v-else
            class="mt-5 rounded-2xl bg-white p-5 text-sm text-[#5a6c61] shadow-sm dark:bg-[#18362c] dark:text-[#c3d7c5]"
          >
            Schließe die nächste Grammatik-Lektion ab. Danach erscheint ihre Regel hier mit Beispielen und Quellen.
          </article>
        </section>
        <section v-else-if="screen === 'library' && isDevelopment">
          <p
            class="text-xs font-bold uppercase tracking-[.18em] text-moss dark:text-[#b4d6b7]"
          >
            Komponentenbibliothek
          </p>
          <h1
            class="font-display text-3xl font-bold text-forest dark:text-[#edf4e9]"
          >
            Bewegungswerkstatt
          </h1>
          <p class="mt-2 text-sm text-[#5a6c61] dark:text-[#c3d7c5]">
            Jede Animation läuft hier unabhängig vom Lernstand erneut ab.
          </p>
          <div class="mt-5 grid gap-4">
            <article
              class="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
            >
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p
                    class="text-[10px] font-bold uppercase tracking-[.16em] text-moss dark:text-[#b4d6b7]"
                  >
                    Bubble · Abschluss
                  </p>
                  <h2
                    class="font-display text-xl font-bold text-forest dark:text-[#edf4e9]"
                  >
                    Münz-Flip
                  </h2>
                </div>
                <button
                  :key="`flip-${animationRuns.flip}`"
                  class="relative grid h-16 w-16 place-items-center rounded-full border-4 text-2xl shadow-float"
                  :class="[
                    libraryCoinLanded
                      ? 'border-[#9be071] bg-[#357b4a] text-[#efffe8]'
                      : 'border-[#fff0a1] bg-[#e2b94c] text-[#473608]',
                    { 'tadlam-coin-flip': animationRuns.flip > 0 },
                  ]"
                >
                  <span class="tadlam-coin-front">{{
                    libraryCoinLanded ? "✓" : "◎"
                  }}</span
                  ><span
                    v-if="animationRuns.flip > 0"
                    class="tadlam-coin-back"
                    >{{ libraryCoinLanded ? "✓" : "◎" }}</span
                  >
                </button>
              </div>
              <button
                class="mt-4 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white"
                @click="playLibraryAnimation('flip')"
              >
                Abspielen
              </button>
            </article>
            <article
              class="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
            >
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p
                    class="text-[10px] font-bold uppercase tracking-[.16em] text-moss dark:text-[#b4d6b7]"
                  >
                    Bubble · Freischalten
                  </p>
                  <h2
                    class="font-display text-xl font-bold text-forest dark:text-[#edf4e9]"
                  >
                    Nächster Knoten
                  </h2>
                </div>
                <button
                  :key="`next-${animationRuns.next}`"
                  class="relative grid h-16 w-16 place-items-center rounded-full border-4 text-2xl shadow-float"
                  :class="[
                    libraryNextLanded
                      ? 'border-[#fff0a1] bg-[#e2b94c] text-[#473608]'
                      : 'border-[#6b7770] bg-[#48564e] text-[#b7c1b8]',
                    { 'tadlam-coin-flip': animationRuns.next > 0 },
                  ]"
                >
                  <span class="tadlam-coin-front">◎</span
                  ><span v-if="animationRuns.next > 0" class="tadlam-coin-back"
                    >◎</span
                  >
                </button>
              </div>
              <button
                class="mt-4 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white"
                @click="playLibraryAnimation('next')"
              >
                Abspielen
              </button>
            </article>
            <article
              class="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
            >
              <p
                class="text-[10px] font-bold uppercase tracking-[.16em] text-moss dark:text-[#b4d6b7]"
              >
                Pfad · Freischalten
              </p>
              <h2
                class="font-display text-xl font-bold text-forest dark:text-[#edf4e9]"
              >
                Punktspur
              </h2>
              <svg
                :key="`trail-${animationRuns.trail}`"
                class="mt-3 h-20 w-full"
                viewBox="0 0 280 80"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <mask :id="`library-trail-${animationRuns.trail}`">
                    <path
                      d="M12 58 C72 5 112 76 178 27 S246 24 268 14"
                      :class="{ 'tadlam-bridge-mask': animationRuns.trail > 0 }"
                      pathLength="100"
                      stroke="white"
                      stroke-width="12"
                    />
                  </mask>
                </defs>
                <path
                  d="M12 58 C72 5 112 76 178 27 S246 24 268 14"
                  :mask="`url(#library-trail-${animationRuns.trail})`"
                  stroke="#79b45f"
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-dasharray="3 13"
                /></svg
              ><button
                class="mt-2 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white"
                @click="playLibraryAnimation('trail')"
              >
                Abspielen
              </button>
            </article>
            <article
              class="overflow-hidden rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p
                    class="text-[10px] font-bold uppercase tracking-[.16em] text-moss dark:text-[#b4d6b7]"
                  >
                    Pfad · Unitübergang
                  </p>
                  <h2
                    class="font-display text-xl font-bold text-forest dark:text-[#edf4e9]"
                  >
                    Vollständiger Ablauf
                  </h2>
                  <p class="mt-1 text-sm text-[#5a6c61] dark:text-[#c3d7c5]">
                    Abschluss, X, Punktspur und die erste Bubble der neuen Unit.
                  </p>
                </div>
                <span
                  class="shrink-0 rounded-lg bg-[#f4eedc] px-2 py-1 text-xs font-bold text-[#665529] dark:bg-[#294437] dark:text-[#dbe8ce]"
                  >5 Bubbles</span
                >
              </div>
              <div
                :key="`journey-${animationRuns.journey}`"
                class="relative mx-auto mt-5 h-[540px] max-w-[320px]"
              >
                <svg
                  class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                  viewBox="0 0 320 540"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M160 52 C160 100 84 104 84 158 S130 205 160 238"
                    class="tadlam-bridge-path"
                    stroke="#a3c987"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-dasharray="3 13"
                  />
                  <defs>
                    <mask id="library-journey-bridge">
                      <path
                        d="M160 238 C210 286 230 328 190 390"
                        :class="{
                          'tadlam-bridge-mask': libraryJourneyPhase === 'path',
                        }"
                        pathLength="100"
                        stroke="white"
                        stroke-width="14"
                      />
                    </mask>
                  </defs>
                  <path
                    v-if="
                      libraryJourneyPhase === 'path' ||
                      libraryJourneyPhase === 'next' ||
                      libraryJourneyPhase === 'unit'
                    "
                    d="M160 238 C210 286 230 328 190 390"
                    :mask="
                      libraryJourneyPhase === 'path'
                        ? 'url(#library-journey-bridge)'
                        : undefined
                    "
                    class="tadlam-bridge-path"
                    stroke="#a3c987"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-dasharray="3 13"
                  />
                </svg>

                <svg
                  class="pointer-events-none absolute left-1/2 top-[190px] z-0 h-24 w-24 -translate-x-1/2"
                  :class="
                    libraryJourneyCompleted
                      ? 'text-[#9b7040]/50'
                      : 'text-[#c8514c]'
                  "
                  viewBox="0 0 144 144"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M30 30 L114 114 M114 30 L30 114"
                    stroke="currentColor"
                    stroke-width="16"
                    stroke-linecap="round"
                  />
                </svg>

                <div class="absolute left-1/2 top-5 z-10 -translate-x-1/2">
                  <span
                    class="grid h-16 w-16 place-items-center rounded-full border-4 border-[#f6dc79] bg-[#d4b557] text-2xl font-bold text-[#40300d] shadow-float"
                    >✓</span
                  >
                </div>
                <div class="absolute left-[52px] top-[126px] z-10">
                  <span
                    class="grid h-16 w-16 place-items-center rounded-full border-4 border-[#9be071] bg-[#357b4a] text-2xl font-bold text-[#efffe8] shadow-float"
                    >✓</span
                  >
                </div>
                <div
                  class="absolute left-1/2 top-[206px] z-10 -translate-x-1/2"
                >
                  <span
                    class="relative grid h-16 w-16 place-items-center rounded-full border-4 text-2xl font-bold shadow-float"
                    :class="[
                      libraryJourneyCompleted
                        ? 'border-[#9be071] bg-[#357b4a] text-[#efffe8]'
                        : 'border-[#fff0a1] bg-[#e2b94c] text-[#473608] ring-8 ring-[#e2b94c]/25',
                      {
                        'tadlam-coin-flip': libraryJourneyPhase === 'flip',
                      },
                    ]"
                    ><span class="tadlam-coin-front">{{
                      libraryJourneyCompleted ? "✓" : "✦"
                    }}</span
                    ><span
                      v-if="libraryJourneyPhase === 'flip'"
                      class="tadlam-coin-back"
                      >{{ libraryJourneyCompleted ? "✓" : "✦" }}</span
                    ></span
                  >
                </div>

                <div
                  class="absolute left-1/2 top-[305px] z-10 w-60 -translate-x-1/2 text-center"
                >
                  <div
                    :class="
                      libraryJourneyPhase === 'unit'
                        ? 'tadlam-fog-reveal'
                        : 'blur-md opacity-55'
                    "
                  >
                    <p
                      class="text-[10px] font-bold uppercase tracking-[.16em] text-moss dark:text-[#b4d6b7]"
                    >
                      Einheit 2
                    </p>
                    <p
                      class="mt-1 font-display text-lg font-bold text-forest dark:text-[#edf4e9]"
                    >
                      {{ libraryJourneyPhase === "unit" ? "Unterwegs" : "???" }}
                    </p>
                  </div>
                </div>
                <div class="absolute left-[158px] top-[358px] z-10">
                  <span
                    class="relative grid h-16 w-16 place-items-center rounded-full border-4 text-2xl shadow-float"
                    :class="[
                      libraryJourneyPhase === 'next' ||
                      libraryJourneyPhase === 'unit'
                        ? 'border-[#fff0a1] bg-[#e2b94c] text-[#473608] ring-8 ring-[#e2b94c]/25'
                        : 'border-[#6b7770] bg-[#48564e] text-[#b7c1b8]',
                      {
                        'tadlam-coin-flip': libraryJourneyPhase === 'next',
                      },
                    ]"
                    ><span class="tadlam-coin-front">➜</span
                    ><span
                      v-if="libraryJourneyPhase === 'next'"
                      class="tadlam-coin-back"
                      >➜</span
                    ></span
                  >
                </div>
                <div class="absolute left-[70px] top-[468px] z-10">
                  <span
                    class="grid h-16 w-16 place-items-center rounded-full border-4 border-[#6b7770] bg-[#48564e] text-2xl text-[#b7c1b8] shadow-float"
                    >↗</span
                  >
                </div>
              </div>
              <button
                class="mt-4 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white"
                @click="playLibraryAnimation('journey')"
              >
                Ablauf abspielen
              </button>
            </article>
            <article
              class="overflow-hidden rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
            >
              <p
                class="text-[10px] font-bold uppercase tracking-[.16em] text-moss dark:text-[#b4d6b7]"
              >
                Pfad · Lektion zu Lektion
              </p>
              <h2
                class="font-display text-xl font-bold text-forest dark:text-[#edf4e9]"
              >
                Normaler Übergang
              </h2>
              <p class="mt-1 text-sm text-[#5a6c61] dark:text-[#c3d7c5]">
                Derselbe Ablauf innerhalb einer Unit – ohne Abschluss-X und
                Header.
              </p>
              <div
                :key="`lesson-${animationRuns.lesson}`"
                class="relative mx-auto mt-3 h-52 max-w-[280px]"
              >
                <svg
                  class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                  viewBox="0 0 280 208"
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <mask id="library-lesson-bridge">
                      <path
                        d="M70 56 C70 112 190 104 190 152"
                        :class="{
                          'tadlam-bridge-mask': libraryLessonPhase === 'path',
                        }"
                        pathLength="100"
                        stroke="white"
                        stroke-width="14"
                      />
                    </mask>
                  </defs>
                  <path
                    v-if="
                      libraryLessonPhase === 'path' ||
                      libraryLessonPhase === 'next'
                    "
                    d="M70 56 C70 112 190 104 190 152"
                    :mask="
                      libraryLessonPhase === 'path'
                        ? 'url(#library-lesson-bridge)'
                        : undefined
                    "
                    class="tadlam-bridge-path"
                    stroke="#a3c987"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-dasharray="3 13"
                  />
                </svg>
                <div class="absolute left-[38px] top-6 z-10">
                  <span
                    class="relative grid h-16 w-16 place-items-center rounded-full border-4 text-2xl shadow-float"
                    :class="[
                      libraryLessonCompleted
                        ? 'border-[#9be071] bg-[#357b4a] text-[#efffe8]'
                        : 'border-[#fff0a1] bg-[#e2b94c] text-[#473608] ring-8 ring-[#e2b94c]/25',
                      { 'tadlam-coin-flip': libraryLessonPhase === 'flip' },
                    ]"
                    ><span class="tadlam-coin-front">{{
                      libraryLessonCompleted ? "✓" : "✦"
                    }}</span
                    ><span
                      v-if="libraryLessonPhase === 'flip'"
                      class="tadlam-coin-back"
                      >{{ libraryLessonCompleted ? "✓" : "✦" }}</span
                    ></span
                  >
                </div>
                <div class="absolute left-[158px] top-[120px] z-10">
                  <span
                    class="relative grid h-16 w-16 place-items-center rounded-full border-4 text-2xl shadow-float"
                    :class="[
                      libraryLessonPhase === 'next'
                        ? 'border-[#fff0a1] bg-[#e2b94c] text-[#473608] ring-8 ring-[#e2b94c]/25'
                        : 'border-[#6b7770] bg-[#48564e] text-[#b7c1b8]',
                      { 'tadlam-coin-flip': libraryLessonPhase === 'next' },
                    ]"
                    ><span class="tadlam-coin-front">◎</span
                    ><span
                      v-if="libraryLessonPhase === 'next'"
                      class="tadlam-coin-back"
                      >◎</span
                    ></span
                  >
                </div>
              </div>
              <button
                class="mt-2 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white"
                @click="playLibraryAnimation('lesson')"
              >
                Ablauf abspielen
              </button>
            </article>
            <article
              class="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
            >
              <div :key="`fog-${animationRuns.fog}`">
                <p
                  class="text-[10px] font-bold uppercase tracking-[.16em] text-moss dark:text-[#b4d6b7]"
                >
                  Einheit · Freischalten
                </p>
                <h2
                  class="mt-1 font-display text-2xl font-bold text-forest dark:text-[#edf4e9]"
                  :class="{ 'tadlam-fog-reveal': animationRuns.fog > 0 }"
                >
                  Unterwegs
                </h2>
                <p
                  class="mt-1 text-sm text-[#5a6c61] dark:text-[#c3d7c5]"
                  :class="{
                    'tadlam-fog-reveal tadlam-fog-reveal-delayed':
                      animationRuns.fog > 0,
                  }"
                >
                  Weg, Richtung und Begegnung
                </p>
              </div>
              <button
                class="mt-4 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white"
                @click="playLibraryAnimation('fog')"
              >
                Abspielen
              </button>
            </article>
            <article
              class="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
            >
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p
                    class="text-[10px] font-bold uppercase tracking-[.16em] text-moss dark:text-[#b4d6b7]"
                  >
                    Antwort · Fehler
                  </p>
                  <h2
                    class="font-display text-xl font-bold text-forest dark:text-[#edf4e9]"
                  >
                    Kurzes Wackeln
                  </h2>
                </div>
                <span
                  :key="`shake-${animationRuns.shake}`"
                  class="rounded-xl border-2 border-red-400 bg-[#5a2929] px-4 py-3 font-bold text-white"
                  :class="{
                    'animate-[tadlam-shake_.42s_ease-in-out]':
                      animationRuns.shake > 0,
                  }"
                  >Nicht ganz</span
                >
              </div>
              <button
                class="mt-4 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white"
                @click="playLibraryAnimation('shake')"
              >
                Abspielen
              </button>
            </article>
          </div>
        </section>
        <section v-else>
          <p
            class="text-xs font-bold uppercase tracking-[.18em] text-moss dark:text-[#b4d6b7]"
          >
            Dein Pfad
          </p>
          <h1
            class="font-display text-3xl font-bold text-forest dark:text-[#edf4e9]"
          >
            Lerne in deinem Tempo
          </h1>
          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]">
              <strong class="block text-3xl text-forest dark:text-[#edf4e9]">{{
                progress.xp
              }}</strong
              ><span class="text-sm text-[#69796f] dark:text-[#b4c9b8]"
                >XP gesammelt</span
              >
            </div>
            <div class="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]">
              <strong class="block text-3xl text-forest dark:text-[#edf4e9]">{{
                progress.streak
              }}</strong
              ><span class="text-sm text-[#69796f] dark:text-[#b4c9b8]"
                >Tage am Stück</span
              >
            </div>
          </div>
          <div
            class="mt-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
          >
            <h2
              class="font-display text-xl font-bold text-forest dark:text-[#edf4e9]"
            >
              Tagesziel
            </h2>
            <div class="mt-3 flex gap-2">
              <button
                v-for="amount in [5, 8, 12]"
                :key="amount"
                class="flex-1 rounded-xl border-2 px-3 py-3 font-bold"
                :class="
                  progress.goal === amount
                    ? 'border-leaf bg-[#eef8ed] text-[#367700]'
                    : 'border-[#dce6db] text-moss dark:border-[#486859] dark:text-[#b4d6b7]'
                "
                @click="progress.goal = amount"
              >
                {{ amount }}
              </button>
            </div>
          </div>
          <div
            class="mt-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
          >
            <div class="flex items-center justify-between">
              <div>
                <h2
                  class="font-display text-xl font-bold text-forest dark:text-[#edf4e9]"
                >
                  Dunkler Wald
                </h2>
                <p class="text-sm text-[#69796f] dark:text-[#b4c9b8]">
                  Dunkles Farbschema
                </p>
              </div>
              <button
                class="rounded-xl px-4 py-2 font-bold"
                :class="
                  darkMode ? 'bg-leaf text-white' : 'bg-[#edf3ed] text-moss'
                "
                @click="darkMode = !darkMode"
              >
                {{ darkMode ? "An" : "Aus" }}
              </button>
            </div>
          </div>
          <div
            class="mt-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-[#18362c]"
          >
            <h2
              class="font-display text-xl font-bold text-forest dark:text-[#edf4e9]"
            >
              Deine Daten
            </h2>
            <div class="mt-3 grid gap-2">
              <button
                class="rounded-xl border-2 border-moss px-4 py-3 font-bold text-moss dark:border-[#79a67b] dark:text-[#b4d6b7]"
                @click="exportProgress"
              >
                Fortschritt exportieren</button
              ><button
                class="rounded-xl border-2 border-moss px-4 py-3 font-bold text-moss dark:border-[#79a67b] dark:text-[#b4d6b7]"
                @click="fileInput?.click()"
              >
                Fortschritt importieren</button
              ><input
                ref="fileInput"
                class="hidden"
                type="file"
                accept="application/json"
                @change="importProgress"
              />
              <p v-if="importError" class="text-sm font-bold text-red-600">
                {{ importError }}
              </p>
              <button
                v-if="!showReset"
                class="mt-2 text-sm font-bold text-red-600"
                @click="showReset = true"
              >
                Lernstand zurücksetzen
              </button>
              <div v-else class="flex gap-2">
                <button
                  class="rounded-xl bg-red-600 px-3 py-2 font-bold text-white"
                  @click="resetProgress"
                >
                  Wirklich löschen</button
                ><button
                  class="rounded-xl px-3 py-2 font-bold text-moss dark:text-[#b4d6b7]"
                  @click="showReset = false"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>
