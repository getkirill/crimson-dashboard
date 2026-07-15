import { defineConfig } from "vite";
import htmlTemplatePlugin from "./html-template-plugin";
import Inspect from "vite-plugin-inspect";
export default defineConfig({
  devtools: true,
  plugins: [htmlTemplatePlugin(), Inspect()],
});
