import { BehaviorSubject } from "rxjs";
import templateRaw from "./template.html?raw";
import $template from "../template.ts";
const template = $template(templateRaw);
export type Tool = "interact" | "select" | "add";
export class ToolbarElement extends HTMLElement {
  tool$: BehaviorSubject<Tool> = new BehaviorSubject<Tool>("interact");
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    template.content
      .cloneNode(true)
      .childNodes.forEach((it) => this.shadowRoot!.appendChild(it));
    this.shadowRoot!.querySelectorAll<HTMLButtonElement>(
      ".children button",
    ).forEach((it) => {
      it.addEventListener("click", () => this.tool$.next(it.id as Tool));
    });
    this.tool$.subscribe((tool) => {
      this.shadowRoot!.querySelectorAll<HTMLButtonElement>(
        ".children button",
      ).forEach((it) => it.classList.remove("active"));
      this.shadowRoot!.querySelector<HTMLButtonElement>(
        `.children button#${tool}`,
      )?.classList.add("active");
      this.shadowRoot!.querySelector(".handle")!.textContent =
        tool.slice(0, 1).toUpperCase() + tool.slice(1);
    });
  }
}

customElements.define("editor-toolbar", ToolbarElement);
declare global {
  interface HTMLElementTagNameMap {
    "editor-toolbar": ToolbarElement;
  }
}
