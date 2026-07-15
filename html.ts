import { createLogger, type Plugin } from "vite";
import { readFile } from "node:fs/promises";

const TEMPLATE_QUERY = "?as-template";

export function htmlTemplatePlugin(): Plugin {
  return {
    name: "vite-plugin-html-template",

    enforce: "pre",

    async resolveId(source, importer) {
      if (!source.endsWith(".html") || !importer) {
        return null;
      }

      const resolved = await this.resolve(source, importer, {
        skipSelf: true,
      });

      if (!resolved) {
        return null;
      }

      return resolved.id + TEMPLATE_QUERY;
    },

    async load(id) {
      if (!id.endsWith(TEMPLATE_QUERY)) {
        return null;
      }

      const file = id.slice(0, -TEMPLATE_QUERY.length);
      const html = await readFile(file, "utf8");

      return {
        code: `
const html = ${JSON.stringify(html)};

const template =
  typeof document === "undefined"
    ? undefined
    : (() => {
        const t = document.createElement("template");
        t.innerHTML = html;
        return t;
      })();

export default template;
`,
        map: null,
      };
    },
  };
}
