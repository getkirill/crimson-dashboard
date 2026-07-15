import { ViteDevServer, type Plugin } from "vite";
import fs from "node:fs/promises";

const TEMPLATE_SUFFIX = "?template";

export default (): Plugin => {
  return {
    enforce: "pre",
    name: "html-template",
    async resolveId(source, importer, options) {
      if (importer && /\.[jt]sx?$/.test(importer) && source.endsWith(".html")) {
        const resolved = await this.resolve(source, importer, {
          skipSelf: true,
          ...options,
        });
        if (resolved) {
          return { id: `${resolved.id}${TEMPLATE_SUFFIX}` };
        }
      }
      return null;
    },
    async load(id) {
      if (id.endsWith(TEMPLATE_SUFFIX)) {
        const filePath = id.slice(0, id.indexOf(TEMPLATE_SUFFIX));
        let html: string = await fs.readFile(filePath, "utf8");

        return `
const template = ${JSON.stringify(html)};
const el = document.createElement('template');
el.innerHTML = template;
export default el;
        `;
      }
      return null;
    },
  };
};
