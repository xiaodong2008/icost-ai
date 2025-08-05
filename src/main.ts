import "./style.less";
import 'primeicons/primeicons.css'

import { InputText, Textarea } from "primevue";
import { createRouter, createWebHistory } from "vue-router";

import App from "./App.vue";
import Button from "primevue/button";
import Card from "primevue/card";
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import Lura from "@primeuix/themes/aura";
import PrimeVue from "primevue/config";
import Select from 'primevue/select';
import SelectButton from "primevue/selectbutton";
import Toast from "primevue/toast";
import ToastService from "primevue/toastservice";
import { createApp } from "vue";
import { definePreset } from "@primeuix/themes";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("./pages/Home.vue"),
    },
    {
      path: "/category",
      component: () => import("./pages/Category.vue"),
    },
    {
      path: "/account",
      component: () => import("./pages/Account.vue"),
    },
    {
      path: "/settings",
      component: () => import("./pages/Setting.vue"),
    },
  ],
});

const stylePreset = definePreset(Lura);

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: stylePreset,
    options: {
      prefix: "p",
      darkModeSelector: "system",
      cssLayer: false,
    },
  },
});
app.use(ToastService);
app.component("Button", Button);
app.component("Select", Select);
app.component("Card", Card);
app.component("InputText", InputText);
app.component("Textarea", Textarea);
app.component("SelectButton", SelectButton);
app.component("FileUpload", FileUpload);
app.component("Toast", Toast);
app.component("DataTable", DataTable);
app.component("Column", Column);
app.component("Dialog", Dialog);
app.mount("#app");
