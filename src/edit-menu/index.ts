import template from "./template.html";
export class EditMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    document.addEventListener("click", (e) => {
      if (!this.contains(e.target as HTMLElement)) this.close();
    });
    this.shadowRoot!.querySelector("#delete")!.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("menu-delete"));
      this.close();
    });
    this.shadowRoot!.querySelector("#configure")!.addEventListener(
      "click",
      () => {
        this.dispatchEvent(new CustomEvent("menu-configure"));
        this.close();
      },
    );
  }
  close() {
    this.remove();
  }
  connectedCallback() {
    this.shadowRoot!.querySelector("small")!.textContent =
      this.getAttribute("element");
  }
}

customElements.define("edit-menu", EditMenu);
declare global {
  interface HTMLElementTagNameMap {
    "edit-menu": EditMenu;
  }
  interface EditMenuEventMap {
    "menu-delete": CustomEvent;
    "menu-configure": CustomEvent;
  }
  interface HTMLElementEventMap extends AddDialogEventMap {}
}
