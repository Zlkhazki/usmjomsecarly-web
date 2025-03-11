import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";

import "./assets/tailwind.css";
import "./style.css";
import router from "./router";

const app = createApp(App);
app.use(PrimeVue, {
  theme: "none",
});
app.use(ToastService);
app.use(router);
app.mount("#app");