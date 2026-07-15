import { defineConfig } from "vite";
import htmlTemplatePlugin from "./src/html";

export default defineConfig({
  plugins: [htmlTemplatePlugin()],
});
