import { BehaviorSubject } from "rxjs";
import template from "./template.html";
export type Tool = "interact" | "select" | "add";
export class ToolbarElement extends HTMLElement {
  tool$: BehaviorSubject<Tool> = new BehaviorSubject<Tool>("interact");
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
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
