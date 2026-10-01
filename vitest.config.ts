import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mesmo alias do tsconfig ("@/*" → "src/*"), usado pelas rotas de API.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
