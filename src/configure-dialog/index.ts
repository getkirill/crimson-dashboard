import { NtCheckbox } from "../nt-checkbox";
import { NtInt } from "../nt-int";
import { NtString } from "../nt-string";
import { NtValueElement } from "../nt-value";
import template from "./template.html";
function appendField<T extends keyof HTMLElementTagNameMap>(
  container: HTMLElement,
  label: string,
  is: T,
): HTMLElementTagNameMap[T] {
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  const el = document.createElement(is);
  labelEl.appendChild(el);
  container.appendChild(labelEl);
  return el;
}
export class ConfigureDialog extends HTMLElement {
  dialog: HTMLDialogElement;
  target: HTMLElement | undefined;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.dialog = this.shadowRoot!.querySelector("dialog")!;
    this.dialog.addEventListener("close", () => this.handleClosure());
    this.dialog
      .querySelector("#cancel")!
      .addEventListener("click", () => this.close());
  }
  confirm() {
    this.close();
  }
  connectedCallback() {
    this.populateSettings();
    this.dialog.showModal();
  }
  populateSettings() {
    if (!this.target) {
      console.error("target not set");
      return;
    }
    const settings =
      this.shadowRoot!.querySelector<HTMLDivElement>("#settings")!;
    if (this.target instanceof NtValueElement) {
      const widget = this.target.children.item(0);
      if (
        widget instanceof NtCheckbox ||
        widget instanceof NtString ||
        widget instanceof NtInt
      ) {
        settings.replaceChildren();
        const label = appendField(settings, "Label: ", "input");
        settings.appendChild(label);
        label.value = widget.label ?? widget.ntValue!.name;
        label.addEventListener("input", () => {
          (widget as NtCheckbox).label = label.value;
        });
      }
    } else if (this.target instanceof HTMLParagraphElement) {
      settings.replaceChildren();
      const textArea = document.createElement("textarea");
      textArea.value = this.target.innerText;
      textArea.placeholder = "Enter label...";
      textArea.addEventListener("input", () => {
        this.target!.innerText = textArea.value;
      });
      settings.appendChild(textArea);
    }
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

customElements.define("configure-dialog", ConfigureDialog);
declare global {
  interface HTMLElementTagNameMap {
    "configure-dialog": ConfigureDialog;
  }
}
