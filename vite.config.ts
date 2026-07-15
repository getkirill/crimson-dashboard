import { defineConfig } from "vite";
import { htmlTemplatePlugin } from "./html";

export default defineConfig({
  plugins: [htmlTemplatePlugin()],
  logLevel: "info",
});
