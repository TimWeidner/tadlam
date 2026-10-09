import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  // Relative asset paths keep the compiled PWA portable on GitHub Pages,
  // including project pages such as /account/tadlam/.
  base: "./",
  plugins: [vue()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
