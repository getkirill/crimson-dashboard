import { filter, fromEvent, map, merge, switchMap, takeUntil } from "rxjs";
import templateRaw from "./template.html?raw";
import $template from "../template.ts";
const template = $template(templateRaw);
export function drag(el: HTMLElement) {
  const mousedown$ = fromEvent<MouseEvent>(el, "mousedown").pipe(
    filter((e) => e.button == 0),
  );
  const mousemove$ = fromEvent<MouseEvent>(document, "mousemove").pipe(
    filter((e) => e.button == 0),
  );
  const mouseup$ = fromEvent<MouseEvent>(document, "mouseup").pipe(
    filter((e) => e.button == 0),
  );
  return mousedown$.pipe(
    switchMap((start) => {
      return mousemove$.pipe(
        map((move) => {
          move.preventDefault();
          return {
            left: move.clientX - start.offsetX,
            top: move.clientY - start.offsetY,
          };
        }),
        takeUntil(mouseup$),
      );
    }),
  );
}
export class DragAndDropElement extends HTMLElement {
  get gridSnap(): number | undefined {
    const attr = this.getAttribute("grid-snap");
    return attr ? +attr : undefined;
  }
  set gridSnap(snap: number | undefined) {
    if (!snap) this.removeAttribute("grid-snap");
    else this.setAttribute("grid-snap", `${snap}`);
  }
  enableDragging: boolean = true;
  knownElements = new Set<HTMLElement>();
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    template.content
      .cloneNode(true)
      .childNodes.forEach((it) => this.shadowRoot!.appendChild(it));
    const slot = this.shadowRoot!.querySelector("slot")!;
    slot.addEventListener("slotchange", () => {
      const els = slot.assignedElements();
      els
        .filter((it) => !this.knownElements.has(it as HTMLElement))
        .forEach((it) => {
          this.makeDraggable(it as HTMLElement);
          this.knownElements.add(it as HTMLElement);
        });
      [...this.knownElements.keys()]
        .filter((it) => !els.includes(it))
        .forEach((it) => this.knownElements.delete(it));
    });
  }
  private makeDraggable(el: HTMLElement) {
    console.log("Making", el, "draggable");
    const drag$ = drag(el);
    merge(
      fromEvent(el, "mouseup"),
      fromEvent(el, "mousedown"),
      fromEvent(el, "click"),
    )
      .pipe(filter(() => this.enableDragging))
      .subscribe((it) => it.preventDefault());
    drag$.pipe(filter(() => this.enableDragging)).subscribe((pos) => {
      const left = this.gridSnap
        ? Math.round(pos.left / this.gridSnap) * this.gridSnap
        : pos.left;
      const top = this.gridSnap
        ? Math.round(pos.top / this.gridSnap) * this.gridSnap
        : pos.top;
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    });
  }
}

customElements.define("drag-and-drop", DragAndDropElement);
declare global {
  interface HTMLElementTagNameMap {
    "drag-and-drop": DragAndDropElement;
  }
}
