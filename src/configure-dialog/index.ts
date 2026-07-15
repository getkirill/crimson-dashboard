import { NtCheckbox } from "../nt-checkbox";
import { NtInput } from "../nt-input/index.ts";
import { NtChart } from "../nt-chart";
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
    template.content
      .cloneNode(true)
      .childNodes.forEach((it) => this.shadowRoot!.appendChild(it));
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
    const variantSel =
      this.shadowRoot!.querySelector<HTMLSelectElement>("#variant")!;
    const settings =
      this.shadowRoot!.querySelector<HTMLDivElement>("#settings")!;
    if (this.target instanceof NtValueElement) {
      const widget = this.target.children.item(0);
      if (
        widget instanceof NtCheckbox ||
        widget instanceof NtInput ||
        widget instanceof NtChart
      ) {
        settings.replaceChildren();

        variantSel.disabled = false;
        variantSel.replaceChildren();

        const type = this.target.type;
        const options: Array<{ value: string; text: string }> = [];
        if (type === "boolean") {
          options.push({ value: "nt-checkbox", text: "Checkbox" });
        } else if (type === "int" || type === "float" || type === "double") {
          options.push({ value: "nt-input", text: "Input" });
          options.push({ value: "nt-chart", text: "Graph" });
        } else {
          options.push({ value: "nt-input", text: "Input" });
        }

        for (const opt of options) {
          const o = document.createElement("option");
          o.value = opt.value;
          o.textContent = opt.text;
          variantSel.appendChild(o);
        }

        if (widget) variantSel.value = widget.localName;

        const label = appendField(settings, "Label: ", "input");
        settings.appendChild(label);
        label.value = (widget as any).label ?? widget?.ntValue!.name;
        label.addEventListener("input", () => {
          if ((widget as any).label !== undefined)
            (widget as any).label = label.value;
        });

        variantSel.addEventListener("change", () => {
          const sel = variantSel.value;
          if (!this.target) return;
          const current = this.target.children.item(0);
          if (current && current.localName === sel) return;
          const newEl = document.createElement(sel);
          if (
            (current as any)?.getAttribute &&
            (current as any).getAttribute("label")
          ) {
            const lab = (current as any).getAttribute("label");
            if (lab) newEl.setAttribute("label", lab);
          }
          this.target.replaceChildren();
          this.target.appendChild(newEl);
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
    } else if (this.target && this.target.localName === "custom-styles") {
      settings.replaceChildren();
      const cssArea = document.createElement("textarea");
      const current = (this.target.textContent ?? "").trim();
      cssArea.value = current;
      cssArea.placeholder = "Enter CSS rules (e.g. .my-class { color: red; })";
      cssArea.addEventListener("input", () => {
        this.target!.textContent = cssArea.value;
        this.target!.setAttribute("styles", cssArea.value);
      });
      settings.appendChild(cssArea);
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
