function $template(src: string): HTMLTemplateElement {
  const el = document.createElement("template");
  el.innerHTML = src;
  return el;
}
export default $template;
