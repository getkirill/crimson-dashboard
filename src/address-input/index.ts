import { debounceTime, fromEvent } from "rxjs";
import nt from "../ntInstance";

export class AddressInput extends HTMLElement {
  input: HTMLInputElement;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.input = document.createElement("input");
    fromEvent<InputEvent>(this.input, "input")
      .pipe(debounceTime(1000))
      .subscribe(() => {
        nt.address$.next(
          Number.isInteger(+this.input.value)
            ? +this.input.value
            : this.input.value,
        );
      });
    nt.address$.subscribe((address) => (this.input.value = `${address}`));
    this.shadowRoot!.appendChild(this.input);
  }
}

customElements.define("address-input", AddressInput);
declare global {
  interface HTMLElementTagNameMap {
    "address-input": AddressInput;
  }
}
