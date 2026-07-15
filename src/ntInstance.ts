import { filter } from "rxjs";
import { NetworkTables } from "./nt";

export const nt = new NetworkTables("127.0.0.1");
(window as unknown as any).nt = nt;
nt.connectionState$.subscribe((it) => console.log("[nt]", it));
nt.messages$
  .pipe(filter((it) => it.method == "announce" || it.method == "unannounce"))
  .subscribe((it) => console.log(`[nt] ${it.method}:`, it.params));
nt.connectionState$.pipe(filter((it) => it == "connected")).subscribe(() => {
  nt.sendFrame({
    method: "subscribe",
    params: {
      topics: ["/"],
      subuid: nt.subscriberCounter++,
      options: { prefix: true, topicsonly: true },
    },
  });
});
nt.connect();
export default nt;
