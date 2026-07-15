import { filter, fromEvent, map, Subscription, takeWhile } from "rxjs";
import type { NtValueElement } from "../nt-value";
import nt from "../ntInstance";

export class NtInt extends HTMLElement {
  static observedAttributes = ["label"];
  ntValue: NtValueElement<number> | undefined;
  publishSubscription: Subscription | undefined;
  inputSubscription: Subscription | undefined;
  labelEl: HTMLLabelElement;
  input: HTMLInputElement;
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
    label.appendChild(document.createTextNode("nt-value"));
    this.input = label.appendChild(document.createElement("input"));
    this.input.type = "number";
    this.input.step = "1";
  }
  connectedCallback() {
    if (this.parentElement?.localName != "nt-value") {
      throw new Error("nt-checkbox parent must be nt-value");
    }
    this.ntValue = this.parentElement as NtValueElement<number>;
    nt.connectionState$
      .pipe(filter((it) => it == "connected"))
      .subscribe(() => {
        this.inputSubscription = fromEvent(this.input, "input")
          .pipe(
            takeWhile(() => this.ntValue != undefined),
            map(() => +this.input.value),
          )
          .subscribe(this.ntValue!.publisher$);
        this.publishSubscription = this.ntValue!.subscriber$!.subscribe(
          (newValue) => (this.input.value = `${newValue}`),
        );
      });

    this.labelEl.firstChild!.textContent = this.label ?? this.ntValue.name;
  }
  attributeChangedCallback(name: string) {
    if (name == "label") {
      this.labelEl.firstChild!.textContent = this.label ?? this.ntValue!.name;
    }
  }
  disconnectedCallback() {
    this.inputSubscription?.unsubscribe();
    this.publishSubscription?.unsubscribe();
    this.ntValue = undefined;
  }
}

customElements.define("nt-int", NtInt);
declare global {
  interface HTMLElementTagNameMap {
    "nt-int": NtInt;
  }
}
