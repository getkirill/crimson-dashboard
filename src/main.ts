import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { NetworkTables } from "./nt.ts";
const nt = new NetworkTables(new URL("ws://127.0.0.1:5810"));
nt.waitReady().then(it => {
    nt.subscribe("/", () => {})
})
createApp(App).mount("#app");
