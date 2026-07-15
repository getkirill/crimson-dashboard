import { filter, type Observable, type Observer } from "rxjs";
import nt from "../ntInstance";
import type { NTTopicType } from "../nt";

export class NtValueElement<T> extends HTMLElement {
  publisher$: Observer<T> | undefined;
  subscriber$: Observable<T> | undefined;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(document.createElement("slot"));
  }
  get name() {
    if (!this.getAttribute("name")) {
      throw new Error("nt-value must have a name attribute to be operational");
    }
    return this.getAttribute("name")!;
  }
  get type(): NTTopicType {
    if (!this.getAttribute("type")) {
      throw new Error("nt-value must have a type attribute to be operational");
    }
    return this.getAttribute("type")! as NTTopicType;
  }
  connectedCallback() {
    console.log(this, "subscribed");
    nt.connectionState$
      .pipe(filter((it) => it == "connected"))
      .subscribe(() => {
        this.subscriber$ = nt.subscribe<T>(this.name);
        this.publisher$ = nt.publish<T>(this.name, this.type);
      });
  }
  disconnectedCallback() {
    console.log(this, "unsubscribed");
    this.subscriber$ = undefined;
    this.publisher$?.complete();
    this.publisher$ = undefined;
  }
}
export function createNtValue(
  name: string,
  type: NTTopicType,
  element: keyof HTMLElementTagNameMap,
) {
  const ntValue = document.createElement("nt-value");
  ntValue.setAttribute("name", name);
  ntValue.setAttribute("type", type);
  const el = document.createElement(element);
  ntValue.appendChild(el);
  return ntValue;
}

customElements.define("nt-value", NtValueElement);
declare global {
  interface HTMLElementTagNameMap {
    "nt-value": NtValueElement<any>;
  }
}
