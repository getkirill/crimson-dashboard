import { filter, fromEvent, map, Subscription, takeWhile } from "rxjs";
import type { NtValueElement } from "../nt-value";
import nt from "../ntInstance";

export class NtCheckbox extends HTMLElement {
  static observedAttributes = ["label"];
  ntValue: NtValueElement<boolean> | undefined;
  checkbox: HTMLInputElement;
  publishSubscription: Subscription | undefined;
  clickSubscription: Subscription | undefined;
  labelEl: HTMLLabelElement;
  get label(): string | null {
    return this.getAttribute("label");
  }
  set label(label: string | null) {
    if (!label) this.removeAttribute("label");
    else this.setAttribute("label", label);
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const label = document.createElement("label");
    this.labelEl = label;
    this.shadowRoot!.appendChild(label);
    const checkbox = document.createElement("input");
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode("nt-value"));
    checkbox.type = "checkbox";
    this.checkbox = checkbox;
  }
  connectedCallback() {
    if (this.parentElement?.localName != "nt-value") {
      throw new Error("nt-checkbox parent must be nt-value");
    }
    this.ntValue = this.parentElement as NtValueElement<boolean>;
    nt.connectionState$
      .pipe(filter((it) => it == "connected"))
      .subscribe(() => {
        this.clickSubscription = fromEvent(this.checkbox, "click")
          .pipe(
            takeWhile(() => this.ntValue != undefined),
            map(() => this.checkbox.checked),
          )
          .subscribe(this.ntValue!.publisher$);
        this.publishSubscription = this.ntValue!.subscriber$!.subscribe(
          (newValue) => (this.checkbox.checked = newValue),
        );
      });

    this.labelEl.firstElementChild!.nextSibling!.textContent =
      this.label ?? this.ntValue.name;
  }
  attributeChangedCallback(name: string) {
    if (name == "label") {
      this.labelEl.firstElementChild!.nextSibling!.textContent =
        this.label ?? this.ntValue!.name;
    }
  }
  disconnectedCallback() {
    this.clickSubscription?.unsubscribe();
    this.publishSubscription?.unsubscribe();
    this.ntValue = undefined;
  }
}

customElements.define("nt-checkbox", NtCheckbox);
declare global {
  interface HTMLElementTagNameMap {
    "nt-checkbox": NtCheckbox;
  }
}
