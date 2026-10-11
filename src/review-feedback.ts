export type ReviewDecision = "accepted" | "needs-revision" | "rejected";

export interface ExerciseReview {
  exerciseId: string;
  lessonId: string;
  unit: number;
  decision: ReviewDecision;
  tags: string[];
  note: string;
  reviewedAt: string;
}

export interface ExerciseReviewDataset {
  formatVersion: "1";
  updatedAt: string | null;
  reviews: ExerciseReview[];
}

export const emptyExerciseReviewDataset = (): ExerciseReviewDataset => ({
  formatVersion: "1",
  updatedAt: null,
  reviews: [],
});
