export class CustomStylesElement extends HTMLElement {
  styleEl: HTMLStyleElement | undefined;
  mutationObserver: MutationObserver | undefined;
  constructor() {
    super();
  }
  connectedCallback() {
    this.styleEl = document.createElement("style");
    this.styleEl.type = "text/css";
    this.updateStyleContent();
    document.head.appendChild(this.styleEl);

    this.mutationObserver = new MutationObserver(() => this.updateStyleContent());
    this.mutationObserver.observe(this, { childList: true, characterData: true, subtree: true, attributes: true });

    const currentPosition = getComputedStyle(this).position;
    if (currentPosition === "static" || !currentPosition) {
      (this as HTMLElement).style.position = "relative";
    }
  }
  updateStyleContent() {
    if (!this.styleEl) return;
    const attr = this.getAttribute("styles");
    const content = attr !== null ? attr : (this.textContent ?? "");
    this.styleEl.textContent = content;
  }
  disconnectedCallback() {
    // remove style element
    if (this.styleEl) {
      try {
        this.styleEl.remove();
      } catch (e) {}
      this.styleEl = undefined;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = undefined;
    }
  }
}

customElements.define("custom-styles", CustomStylesElement);

declare global {
  interface HTMLElementTagNameMap {
    "custom-styles": CustomStylesElement;
  }
}
