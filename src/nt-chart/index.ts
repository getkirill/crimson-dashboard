import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import type { NtValueElement } from "../nt-value";
import nt from "../ntInstance";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface TimeDataPoint {
  x: number;
  y: number;
}

export class NtChart extends HTMLElement {
  static observedAttributes = ["label", "duration"];

  ntValue: NtValueElement<any> | undefined;
  publishSubscription: Subscription | undefined;

  canvas: HTMLCanvasElement;
  chart!: Chart;

  private latestValue: number = 0;
  private timerId: any = null;

  private chartDataPoints: TimeDataPoint[] = [];

  get label(): string | null {
    return this.getAttribute("label");
  }
  set label(label: string | null) {
    if (!label) this.removeAttribute("label");
    else this.setAttribute("label", label);
  }

  get durationSeconds(): number {
    const val = this.getAttribute("duration");
    return val ? parseFloat(val) : 15;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = "100%";
    container.style.height = "300px";

    this.canvas = document.createElement("canvas");
    container.appendChild(this.canvas);
    this.shadowRoot!.appendChild(container);
  }

  connectedCallback() {
    if (this.parentElement?.localName !== "nt-value") {
      throw new Error("nt-chart parent must be nt-value");
    }
    this.ntValue = this.parentElement as NtValueElement<any>;

    const validTypes = ["double", "float", "int"];
    if (!validTypes.includes(this.ntValue.type)) {
      throw new Error(
        `nt-chart only supports numeric types. Current: ${this.ntValue.type}`,
      );
    }

    this.initializeChart();

    nt.connectionState$
      .pipe(filter((it) => it === "connected"))
      .subscribe(() => {
        this.publishSubscription = this.ntValue!.subscriber$!.subscribe(
          (newValue) => {
            const parsed = Number(newValue);
            if (!isNaN(parsed)) {
              this.latestValue = parsed;
            }
          },
        );

        this.startTimelineLoop();
      });
  }

  initializeChart() {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: this.label ?? this.ntValue?.name ?? "NT Value",
            data: this.chartDataPoints,
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.1)",
            tension: 0.15,
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "linear",
            display: true,
            title: {
              display: false,
            },
            ticks: {
              callback: (value) => {
                const secondsAgo = Math.round(
                  (Date.now() - Number(value)) / 1000,
                );
                const durationRounded = Math.round(this.durationSeconds);
                if (secondsAgo === 0) return "now";
                if (secondsAgo === durationRounded) return `-${secondsAgo}s`;
                return "";
              },
            },
          },
          y: {
            beginAtZero: false,
          },
        },
        plugins: {
          legend: {
            display: true,
          },
        },
      },
    });
  }

  private startTimelineLoop() {
    this.stopTimelineLoop();

    this.recordPoint();

    this.timerId = setInterval(() => {
      this.recordPoint();
      this.pruneAndRedraw();
    }, 100);
  }

  private recordPoint() {
    const now = Date.now();
    this.chartDataPoints.push({
      x: now,
      y: this.latestValue,
    });
  }

  private pruneAndRedraw() {
    const now = Date.now();
    const cutoffTime = now - this.durationSeconds * 1000;

    while (
      this.chartDataPoints.length > 0 &&
      this.chartDataPoints[0].x < cutoffTime
    ) {
      this.chartDataPoints.shift();
    }

    if (this.chart) {
      this.chart.options.scales!.x!.min = cutoffTime;
      this.chart.options.scales!.x!.max = now;

      this.chart.update("none");
    }
  }

  private stopTimelineLoop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (!this.chart) return;

    if (name === "label") {
      this.chart.data.datasets[0].label = newValue ?? this.ntValue?.name;
      this.chart.update();
    }
  }

  disconnectedCallback() {
    this.stopTimelineLoop();
    this.publishSubscription?.unsubscribe();
    this.chart?.destroy();
    this.ntValue = undefined;
  }
}

customElements.define("nt-chart", NtChart);

declare global {
  interface HTMLElementTagNameMap {
    "nt-chart": NtChart;
  }
}
