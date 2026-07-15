import { filter, fromEvent, map, Subscription, takeWhile } from "rxjs";
import nt from "../ntInstance";

export class ConnectionState extends HTMLElement {
  label: HTMLParagraphElement;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.label = document.createElement("p");
    this.label.style.margin = "0";
    this.label.style.padding = "0";
    this.shadowRoot!.appendChild(this.label);
    nt.connectionState$.subscribe(
      (state) =>
        (this.label.textContent =
          state.slice(0, 1).toUpperCase() + state.slice(1).replace("_", " ")),
    );
  }
}

customElements.define("connection-state", ConnectionState);
declare global {
  interface HTMLElementTagNameMap {
    "connection-state": ConnectionState;
  }
}
