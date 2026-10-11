import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const feedbackPath = resolve(process.cwd(), "language/exercise-review-feedback.json");
const decisions = new Set(["accepted", "needs-revision", "rejected"]);

async function readRequestBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function isFeedbackDataset(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const dataset = value as { formatVersion?: unknown; reviews?: unknown };
  return dataset.formatVersion === "1" && Array.isArray(dataset.reviews);
}

function reviewFeedbackPlugin() {
  return {
    name: "tadlam-review-feedback",
    configureServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use(
        "/__tadlam-review-feedback",
        async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
          try {
            if (request.method === "GET") {
              const dataset = JSON.parse(await readFile(feedbackPath, "utf8"));
              return sendJson(response, 200, dataset);
            }
            if (request.method !== "PUT") return next();

            const body = JSON.parse(await readRequestBody(request));
            if (!isFeedbackDataset(body)) {
              return sendJson(response, 400, { error: "Ungültiges Feedback-Format." });
            }

            const reviews = body.reviews as Array<Record<string, unknown>>;
            const valid = reviews.every(
              (review) =>
                typeof review.exerciseId === "string" &&
                typeof review.lessonId === "string" &&
                typeof review.unit === "number" &&
                typeof review.decision === "string" &&
                decisions.has(review.decision) &&
                Array.isArray(review.tags) &&
                review.tags.every((tag) => typeof tag === "string") &&
                typeof review.note === "string" &&
                typeof review.reviewedAt === "string",
            );
            if (!valid) {
              return sendJson(response, 400, { error: "Ungültiger Bewertungseintrag." });
            }

            const dataset = { ...body, updatedAt: new Date().toISOString() };
            await writeFile(feedbackPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
            return sendJson(response, 200, dataset);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unbekannter Fehler";
            return sendJson(response, 500, { error: message });
          }
        },
      );
    },
  };
}

export default defineConfig({
  // Relative asset paths keep the compiled PWA portable on GitHub Pages,
  // including project pages such as /account/tadlam/.
  base: "./",
  plugins: [vue(), reviewFeedbackPlugin()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
