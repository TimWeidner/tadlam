<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { lessons, type Exercise, type Lesson } from "./domain";
import { learnerVocabulary } from "./language/learner-content";
import {
  emptyExerciseReviewDataset,
  type ExerciseReview,
  type ExerciseReviewDataset,
  type ReviewDecision,
} from "./review-feedback";

interface ReviewExercise {
  lesson: Lesson;
  exercise: Exercise;
}

interface ExerciseTitle {
  label: string;
  isGlossable: boolean;
  isElvish: boolean;
  pronunciation?: string;
  meaning?: string;
  popoverTerm?: string;
}

const feedbackTags = [
  "klar",
  "unklar",
  "zu schwer",
  "fehlender Kontext",
  "Antwortoptionen",
  "Sprache / Quelle",
  "Wiederholung",
];

const allReviewExercises: ReviewExercise[] = lessons.flatMap((lesson) =>
  lesson.exercises.map((exercise) => ({ lesson, exercise })),
);
const dataset = ref<ExerciseReviewDataset>(emptyExerciseReviewDataset());
const selectedUnit = ref("all");
const selectedState = ref<"all" | "open" | ReviewDecision>("open");
const currentIndex = ref(0);
const note = ref("");
const tags = ref<string[]>([]);
const message = ref("");
const saving = ref(false);

const reviewByExerciseId = computed(
  () => new Map(dataset.value.reviews.map((review) => [review.exerciseId, review])),
);
const filteredExercises = computed(() =>
  allReviewExercises.filter(({ lesson, exercise }) => {
    const review = reviewByExerciseId.value.get(exercise.id);
    const matchesUnit = selectedUnit.value === "all" || lesson.unit === Number(selectedUnit.value);
    const matchesState =
      selectedState.value === "all" ||
      (selectedState.value === "open" ? !review : review?.decision === selectedState.value);
    return matchesUnit && matchesState;
  }),
);
const current = computed(() => filteredExercises.value[currentIndex.value] ?? null);
const reviewedCount = computed(() => dataset.value.reviews.length);
const acceptedCount = computed(
  () => dataset.value.reviews.filter((review) => review.decision === "accepted").length,
);
const vocabularyBySurface = new Map(
  learnerVocabulary.map((word) => [word.surface.normalize("NFC").toLocaleLowerCase("de-DE"), word]),
);
const vocabularyByTranslation = new Map(
  learnerVocabulary.map((word) => [word.translation.normalize("NFC").toLocaleLowerCase("de-DE"), word]),
);
const titlePopoverOpen = ref(false);

function plain(value: string) {
  return value.replace(/[.!?,;:]/g, "").trim();
}

function exerciseTitle(exercise: Exercise): ExerciseTitle {
  const quoted = exercise.prompt.match(/„([^“]+)“/)?.[1];
  if (quoted) {
    const word = vocabularyBySurface.get(plain(quoted).normalize("NFC").toLocaleLowerCase("de-DE"));
    if (word) {
      return {
        label: quoted,
        isGlossable: true,
        isElvish: true,
        pronunciation: exercise.pronunciation ?? word.pronunciation,
        meaning: word.translation,
        popoverTerm: word.surface,
      };
    }
    const answerWord = vocabularyBySurface.get(plain(exercise.answer).normalize("NFC").toLocaleLowerCase("de-DE"));
    const germanWord = vocabularyByTranslation.get(plain(quoted).normalize("NFC").toLocaleLowerCase("de-DE")) ?? answerWord;
    if (germanWord) {
      return {
        label: quoted,
        isGlossable: true,
        isElvish: false,
        pronunciation: germanWord.pronunciation,
        meaning: germanWord.translation,
        popoverTerm: germanWord.surface,
      };
    }
    return { label: quoted, isGlossable: false, isElvish: false };
  }

  const afterColon = exercise.prompt.match(/:\s*([^?]+)$/)?.[1];
  if (afterColon && /[A-Za-zîûâêôáéíóú]/.test(afterColon)) {
    const word = vocabularyBySurface.get(plain(afterColon).normalize("NFC").toLocaleLowerCase("de-DE"));
    if (word) {
      return {
        label: plain(afterColon),
        isGlossable: true,
        isElvish: true,
        pronunciation: exercise.pronunciation ?? word.pronunciation,
        meaning: word.translation,
        popoverTerm: word.surface,
      };
    }
  }

  return { label: exercise.prompt, isGlossable: false, isElvish: false };
}

const currentTitle = computed(() => current.value && exerciseTitle(current.value.exercise));

function loadForm() {
  const review = current.value && reviewByExerciseId.value.get(current.value.exercise.id);
  note.value = review?.note ?? "";
  tags.value = review?.tags ?? [];
  message.value = "";
}

watch([current, selectedUnit, selectedState], () => {
  if (currentIndex.value >= filteredExercises.value.length) currentIndex.value = 0;
  titlePopoverOpen.value = false;
  loadForm();
}, { immediate: true });

function previous() {
  if (!filteredExercises.value.length) return;
  currentIndex.value = (currentIndex.value - 1 + filteredExercises.value.length) % filteredExercises.value.length;
}

function next() {
  if (!filteredExercises.value.length) return;
  currentIndex.value = (currentIndex.value + 1) % filteredExercises.value.length;
}

function toggleTag(tag: string) {
  tags.value = tags.value.includes(tag)
    ? tags.value.filter((item) => item !== tag)
    : [...tags.value, tag];
}

async function persist(nextDataset: ExerciseReviewDataset) {
  const response = await fetch("/__tadlam-review-feedback", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextDataset),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Speichern fehlgeschlagen.");
  dataset.value = result as ExerciseReviewDataset;
}

async function save(decision: ReviewDecision) {
  if (!current.value || saving.value) return;
  if (decision !== "accepted" && !note.value.trim()) {
    message.value = "Für Überarbeiten oder Ablehnen bitte kurz begründen.";
    return;
  }
  saving.value = true;
  message.value = "";
  const item = current.value;
  const review: ExerciseReview = {
    exerciseId: item.exercise.id,
    lessonId: item.lesson.id,
    unit: item.lesson.unit,
    decision,
    tags: tags.value,
    note: note.value.trim(),
    reviewedAt: new Date().toISOString(),
  };
  const reviews = dataset.value.reviews.filter((entry) => entry.exerciseId !== review.exerciseId);
  try {
    await persist({ ...dataset.value, reviews: [...reviews, review] });
    message.value = decision === "accepted" ? "Akzeptiert und gespeichert." : "Feedback gespeichert.";
    const nextOpen = filteredExercises.value.findIndex(
      ({ exercise }) => !reviewByExerciseId.value.has(exercise.id),
    );
    currentIndex.value = nextOpen >= 0 ? nextOpen : Math.min(currentIndex.value, filteredExercises.value.length - 1);
  } catch (error) {
    message.value = error instanceof Error ? error.message : "Speichern fehlgeschlagen.";
  } finally {
    saving.value = false;
  }
}

async function loadDataset() {
  try {
    const response = await fetch("/__tadlam-review-feedback");
    if (!response.ok) throw new Error("Feedback-Datei konnte nicht geladen werden.");
    dataset.value = (await response.json()) as ExerciseReviewDataset;
    loadForm();
  } catch (error) {
    message.value = error instanceof Error ? error.message : "Feedback-Datei konnte nicht geladen werden.";
  }
}

onMounted(loadDataset);
</script>

<template>
  <main class="review-shell grain min-h-screen bg-[#0d2c25] px-4 py-6 text-[#f7f2e8] sm:px-6">
    <div class="mx-auto max-w-3xl">
      <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[.2em] text-[#bcdf90]">Tadlam · Entwicklung</p>
          <h1 class="mt-1 font-display text-4xl font-bold">Übungsredaktion</h1>
          <p class="mt-2 max-w-xl text-sm text-[#d9e6d7]">Bewerte Kandidaten, bevor sie in eine veröffentlichte Einheit übernommen werden.</p>
        </div>
        <div class="rounded-2xl bg-[#184438] px-4 py-3 text-right text-sm shadow-float">
          <p><strong>{{ acceptedCount }}</strong> akzeptiert</p>
          <p class="text-[#bcdf90]">{{ reviewedCount }} / {{ allReviewExercises.length }} bewertet</p>
        </div>
      </header>

      <section class="mb-5 grid gap-3 rounded-2xl bg-[#163a32] p-4 sm:grid-cols-2">
        <label class="text-sm font-bold">Einheit
          <select v-model="selectedUnit" class="review-select mt-1">
            <option value="all">Alle Einheiten</option>
            <option v-for="unit in [1, 2, 3, 4, 5]" :key="unit" :value="String(unit)">Einheit {{ unit }}</option>
          </select>
        </label>
        <label class="text-sm font-bold">Status
          <select v-model="selectedState" class="review-select mt-1">
            <option value="open">Noch offen</option>
            <option value="all">Alle Bewertungen</option>
            <option value="accepted">Akzeptiert</option>
            <option value="needs-revision">Überarbeiten</option>
            <option value="rejected">Abgelehnt</option>
          </select>
        </label>
      </section>

      <section v-if="current" class="rounded-[2rem] bg-[#163a32] p-5 shadow-float sm:p-8">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#487366] pb-4">
          <div>
            <p class="text-xs font-black uppercase tracking-[.16em] text-[#bcdf90]">Einheit {{ current.lesson.unit }} · {{ current.lesson.phase }}</p>
            <h2 class="mt-1 font-display text-2xl font-bold">{{ current.lesson.title }}</h2>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-black uppercase" :class="current.exercise.status === 'neo' ? 'bg-violet-100 text-violet-800' : 'bg-[#e8f8d9] text-[#27661f]'">
            {{ current.exercise.status === 'neo' ? 'Neo' : 'belegt' }}
          </span>
        </div>

        <article class="mt-6 rounded-3xl bg-[#f7f2e8] p-5 text-[#26322f] sm:p-7">
          <p class="mb-2 text-xs font-black uppercase tracking-[.16em] text-[#557564]">{{ current.exercise.kind }} · Vorschau</p>
          <div class="relative">
            <button
              v-if="currentTitle?.isGlossable"
              type="button"
              class="review-gloss-trigger font-display text-2xl font-bold"
              :aria-expanded="titlePopoverOpen"
              @click="titlePopoverOpen = !titlePopoverOpen"
            >{{ currentTitle.label }}</button>
            <h3 v-else class="font-display text-2xl font-bold">{{ currentTitle?.label }}</h3>
            <p v-if="currentTitle?.isElvish && currentTitle.pronunciation" class="mt-2 text-sm font-bold text-[#426f59]">Aussprache: {{ currentTitle.pronunciation }}</p>
            <div v-if="titlePopoverOpen && currentTitle?.isGlossable" class="review-gloss-popover" role="status">
              <span class="font-bold">{{ currentTitle.popoverTerm }}</span> · {{ currentTitle.meaning }}
              <span v-if="!currentTitle.isElvish && currentTitle.pronunciation" class="block mt-1 text-xs font-bold">Aussprache: {{ currentTitle.pronunciation }}</span>
            </div>
          </div>

          <div v-if="current.exercise.kind === 'choice' || current.exercise.kind === 'cloze'" class="mt-6 grid gap-3">
            <button v-for="choice in current.exercise.choices" :key="choice" type="button" class="review-option">{{ choice }}</button>
          </div>
          <div v-else-if="current.exercise.kind === 'type'" class="mt-6 rounded-2xl border-2 border-dashed border-[#8ca99a] bg-white px-4 py-3 text-[#6b7f74]">Antwort eintippen …</div>
          <div v-else-if="current.exercise.kind === 'order'" class="mt-6 flex flex-wrap gap-2">
            <span v-for="token in current.exercise.tokens" :key="token" class="rounded-xl border-2 border-[#8ca99a] bg-white px-3 py-2 font-bold">{{ token }}</span>
          </div>
          <div v-else-if="current.exercise.kind === 'match'" class="mt-6 grid grid-cols-2 gap-3">
            <template v-for="pair in current.exercise.pairs" :key="pair.left">
              <span class="review-option">{{ pair.left }}</span>
              <span class="review-option">{{ pair.right }}</span>
            </template>
          </div>

          <details class="mt-6 border-t border-[#d2ddd4] pt-4 text-sm">
            <summary class="cursor-pointer font-bold text-[#315c4a]">Redaktionsdetails</summary>
            <dl class="mt-3 grid gap-2">
              <div><dt class="font-bold">Musterlösung</dt><dd>{{ current.exercise.answer }}</dd></div>
              <div><dt class="font-bold">Quelle</dt><dd>{{ current.exercise.source }}</dd></div>
            </dl>
          </details>
        </article>

        <section class="mt-6">
          <p class="text-sm font-bold">Was soll die Redaktion daraus lernen?</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button v-for="tag in feedbackTags" :key="tag" type="button" class="review-tag" :class="tags.includes(tag) ? 'review-tag-active' : ''" @click="toggleTag(tag)">{{ tag }}</button>
          </div>
          <label class="mt-4 block text-sm font-bold">Notiz <span class="font-normal text-[#b7cfbd]">(bei Überarbeiten/Ablehnen erforderlich)</span>
            <textarea v-model="note" rows="3" class="review-note mt-1" placeholder="z. B. Die Auswahl verrät die Lösung; bitte neue Distraktoren."></textarea>
          </label>
          <p v-if="message" class="mt-3 text-sm font-semibold text-[#f6dc8d]">{{ message }}</p>
        </section>

        <footer class="mt-6 flex flex-wrap gap-3 border-t border-[#487366] pt-5">
          <button type="button" class="review-action review-accept" :disabled="saving" @click="save('accepted')">Akzeptieren</button>
          <button type="button" class="review-action review-revise" :disabled="saving" @click="save('needs-revision')">Überarbeiten</button>
          <button type="button" class="review-action review-reject" :disabled="saving" @click="save('rejected')">Ablehnen</button>
          <div class="ml-auto flex gap-2">
            <button type="button" class="review-nav" @click="previous">←</button>
            <button type="button" class="review-nav" @click="next">→</button>
          </div>
        </footer>
      </section>

      <section v-else class="rounded-3xl bg-[#163a32] p-10 text-center shadow-float">
        <h2 class="font-display text-3xl font-bold">Hier ist alles bewertet.</h2>
        <p class="mt-2 text-[#d9e6d7]">Ändere den Filter, um frühere Bewertungen zu sehen oder zu überarbeiten.</p>
      </section>
    </div>
  </main>
</template>
