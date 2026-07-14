import { fromEvent, switchMap, map, takeUntil, Subscription } from 'rxjs';

// Define the HTML and CSS template
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      position: absolute;
      width: 250px;
      height: 200px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      cursor: grab;
      box-sizing: border-box;
    }
    :host(:active) {
      cursor: grabbing;
    }
    .widget-header {
      padding: 12px;
      background: #333;
      color: white;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      user-select: none;
    }
    .widget-content {
      padding: 16px;
      flex: 1;
      overflow: auto;
    }
  </style>
  <div class="widget-header">
    <slot name="header">Widget Header</slot>
  </div>
  <div class="widget-content">
    <slot name="content">Widget Content</slot>
  </div>
`;

export class DashboardWidget extends HTMLElement {
  private dragSubscription?: Subscription;

  constructor() {
    super();
    // Attach Shadow DOM for style and DOM encapsulation
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  // Lifecycle hook: Component is inserted into the DOM
  connectedCallback() {
    this.initDragAndDrop();
  }

  // Lifecycle hook: Component is removed from the DOM (Prevent Memory Leaks!)
  disconnectedCallback() {
    if (this.dragSubscription) {
      this.dragSubscription.unsubscribe();
    }
  }

  private initDragAndDrop() {
    const header = this.shadowRoot?.querySelector('.widget-header') as HTMLElement;
    if (!header) return;

    const mouseDown$ = fromEvent<MouseEvent>(header, 'mousedown');
    const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
    const mouseUp$ = fromEvent<MouseEvent>(document, 'mouseup');

    const drag$ = mouseDown$.pipe(
      map((startEvent) => {
        startEvent.preventDefault();
        // 'this' refers to the custom element itself
        const rect = this.getBoundingClientRect();
        return {
          offsetX: startEvent.clientX - rect.left,
          offsetY: startEvent.clientY - rect.top,
        };
      }),
      switchMap((offset) =>
        mouseMove$.pipe(
          map((moveEvent) => ({
            left: moveEvent.clientX - offset.offsetX,
            top: moveEvent.clientY - offset.offsetY,
          })),
          takeUntil(mouseUp$)
        )
      )
    );

    this.dragSubscription = drag$.subscribe(({ left, top }) => {
      const boundedLeft = Math.max(0, Math.min(left, window.innerWidth - this.offsetWidth));
      const boundedTop = Math.max(0, Math.min(top, window.innerHeight - this.offsetHeight));

      this.style.left = `${boundedLeft}px`;
      this.style.top = `${boundedTop}px`;
    });
  }
}

customElements.define('dashboard-widget', DashboardWidget);