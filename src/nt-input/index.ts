import { debounceTime, filter, fromEvent, map, Subscription, takeWhile } from "rxjs";
import type { NtValueElement } from "../nt-value";
import nt from "../ntInstance";

export class NtInput extends HTMLElement {
  static observedAttributes = ["label"];
  ntValue: NtValueElement<any> | undefined;
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
  }
  connectedCallback() {
    if (this.parentElement?.localName != "nt-value") {
      throw new Error("nt-input parent must be nt-value");
    }
    this.ntValue = this.parentElement as NtValueElement<any>;
    switch (this.ntValue.type) {
      case "float":
      // @ts-ignore 7029
      case "double":
        this.input.step = 'any'
      case "int":
        this.input.type = "number"
    }
    nt.connectionState$
      .pipe(filter((it) => it == "connected"))
      .subscribe(() => {
        this.inputSubscription = fromEvent(this.input, "input")
          .pipe(
            takeWhile(() => this.ntValue != undefined),
            debounceTime(500),
            map(() => this.getInputValue()),
          )
          .subscribe(this.ntValue!.publisher$);
        this.publishSubscription = this.ntValue!.subscriber$!.subscribe(
          (newValue) => this.setInputValue(newValue),
        );
      });

    this.labelEl.firstChild!.textContent = this.label ?? this.ntValue.name;
  }
  setInputValue(newValue: any): void {
    console.log('Set', this, 'to', newValue)
    switch (this.ntValue!.type) {
      case "string":
        this.input.value = newValue as string
        break
      case "double":
      case "float":
      case "int":
        this.input.valueAsNumber = newValue
        break
      case "json":
        this.input.value = JSON.stringify(newValue)
        break
      case "boolean":
      case "raw":
      case "rpc":
      case "msgpack":
      case "protobuf":
      case "boolean[]":
      case "double[]":
      case "int[]":
      case "float[]":
      case "string[]":
        throw new Error(`Unsupported nt-input type: ${this.ntValue!.type}`)
    }
  }
  getInputValue(): any {
    switch (this.ntValue!.type) {
      case "string":
        return this.input.value
      case "double":
      case "float":
      case "int":
        return this.input.valueAsNumber
      case "json":
        return JSON.parse(this.input.value)
      case "boolean":
      case "raw":
      case "rpc":
      case "msgpack":
      case "protobuf":
      case "boolean[]":
      case "double[]":
      case "int[]":
      case "float[]":
      case "string[]":
        throw new Error(`Unsupported nt-input type: ${this.ntValue!.type}`)
    }
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

customElements.define("nt-input", NtInput);
declare global {
  interface HTMLElementTagNameMap {
    "nt-input": NtInput;
  }
}
