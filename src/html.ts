export default function htmlTemplatePlugin() {
  return {
    name: "vite-plugin-html-template",
    transform(code: any, id: string) {
      if (id.endsWith(".html")) {
        return {
          code: `
            const template = document.createElement('template');
            template.innerHTML = ${JSON.stringify(code)};
            export default template;
          `,
          map: null,
        };
      }
    },
  };
}
