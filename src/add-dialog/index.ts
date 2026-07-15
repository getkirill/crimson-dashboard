import type { NTTopicType } from "../nt";
import nt from "../ntInstance";
import template from "./template.html";
export type CustomElementToAdd = {
  element:
    | "label"
    | "connection-state"
    | "address-input"
    | "force-reconnect"
    | "custom-styles";
};

export type ElementToAdd =
  | { topic: string; type: NTTopicType }
  | CustomElementToAdd;
export class AddDialog extends HTMLElement {
  dialog: HTMLDialogElement;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    template.content
      .cloneNode(true)
      .childNodes.forEach((it) => this.shadowRoot!.appendChild(it));
    this.dialog = this.shadowRoot!.querySelector("dialog")!;
    this.dialog.addEventListener("close", () => this.handleClosure());
    this.dialog
      .querySelector("#cancel")!
      .addEventListener("click", () => this.close());
    const topics = this.dialog.querySelector<HTMLDivElement>("div#topics")!;
    topics.replaceChildren();
    for (const [topic, type] of nt.topicTypes.entries()) {
      const button = document.createElement("button");
      button.innerText = `[${type}] ${topic}`;
      topics.appendChild(button);
      button.addEventListener("click", () => {
        this.confirm({ topic, type });
      });
    }
    this.dialog
      .querySelectorAll<HTMLButtonElement>("button.add-el")
      .forEach((addEl) => {
        const element = addEl.dataset["element"];
        addEl.addEventListener("click", () =>
          this.confirm({ element } as CustomElementToAdd),
        );
      });
    this.dialog
      .querySelector<HTMLFormElement>("#manual")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        const form = new FormData(e.target as HTMLFormElement);
        this.confirm({
          type: form.get("type")!.toString() as NTTopicType,
          topic: form.get("name")!.toString(),
        });
      });
  }
  confirm(el: ElementToAdd) {
    const ev = new CustomEvent<ElementToAdd>("add-element", {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: el,
    });
    this.dispatchEvent(ev);
    if (!ev.defaultPrevented) {
      this.close();
    }
  }
  connectedCallback() {
    this.dialog.showModal();
  }
  disconnectedCallback() {
    this.dialog.close();
  }
  close() {
    this.dialog.close();
  }
  handleClosure() {
    this.remove();
  }
}

customElements.define("add-dialog", AddDialog);
declare global {
  interface HTMLElementTagNameMap {
    "add-dialog": AddDialog;
  }
  interface AddDialogEventMap {
    "add-element": CustomEvent<ElementToAdd>;
  }
  interface HTMLElementEventMap extends AddDialogEventMap {}
}
