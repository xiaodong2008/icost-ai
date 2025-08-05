import config from "./config";
import { useToast } from "primevue/usetoast";

export function getRequestUrl(path: string) {
  if (import.meta.env.DEV) {
    return `http://localhost:7524${path}`;
  }
  return `${localStorage.getItem("backendUrl") || config.defaultBackendUrl}${path}`;
}

export const showToast = {
  success: (toast: ReturnType<typeof useToast>, summary: string, detail: string, life: number = 3000) => {
    toast.add({
      severity: "success",
      summary,
      detail,
      life,
    });
  },
  error: (toast: ReturnType<typeof useToast>, summary: string, detail: string, life: number = 3000) => {
    toast.add({
      severity: "error",
      summary,
      detail,
      life,
    });
  },
  warning: (toast: ReturnType<typeof useToast>, summary: string, detail: string, life: number = 3000) => {
    toast.add({
      severity: "warn",
      summary,
      detail,
      life,
    });
  },
  info: (toast: ReturnType<typeof useToast>, summary: string, detail: string, life: number = 3000) => {
    toast.add({
      severity: "info",
      summary,
      detail,
      life,
    });
  },
};