<script setup lang="ts">
import { ref } from "vue";
import config from "../config";
import { showToast } from "../utils";
import { useToast } from "primevue/usetoast";

const toast = useToast();

let backendUrl = ref(
  localStorage.getItem("backendUrl") || config.defaultBackendUrl
);
let openaiApiKey = ref(localStorage.getItem("openaiApiKey") || "");
let backendSecret = ref(localStorage.getItem("backendSecret") || "");

const onBackendUrlChange = () => {
  localStorage.setItem("backendUrl", backendUrl.value);
  showToast.success(toast, "Success", "Backend URL updated");
};

const onOpenaiApiKeyChange = () => {
  localStorage.setItem("openaiApiKey", openaiApiKey.value);
  showToast.success(toast, "Success", "OpenAI API Key updated");
};

const onBackendSecretChange = () => {
  localStorage.setItem("backendSecret", backendSecret.value);
  showToast.success(toast, "Success", "Backend Secret updated");
};

const onSave = () => {
  let matched = 0;
  const datas: [() => boolean, () => void][] = [
    [
      () => backendUrl.value !== localStorage.getItem("backendUrl"),
      onBackendUrlChange,
    ],
    [
      () => openaiApiKey.value !== localStorage.getItem("openaiApiKey"),
      onOpenaiApiKeyChange,
    ],
    [
      () => backendSecret.value !== localStorage.getItem("backendSecret"),
      onBackendSecretChange,
    ],
  ];

  for (const [condition, callback] of datas) {
    if (condition()) {
      callback();
      ++matched;
    }
  }

  if (matched === 0) {
    showToast.warning(toast, "No changes", "No changes were made");
  }
};
</script>

<template>
  <div class="container">
    <Toast />
    <Card>
      <template #title> Settings </template>
      <template #content>
        <div class="card-inside">
          <div class="label-container">
            <label for="backend-url">Backend URL</label>
            <InputText id="backend-url" v-model="backendUrl" />
          </div>
          <div class="label-container">
            <label for="backend-secret">Backend Secret</label>
            <InputText id="backend-secret" v-model="backendSecret" />
          </div>
          <div class="label-container">
            <label for="openai-api-key">OpenAI API Key</label>
            <InputText id="openai-api-key" v-model="openaiApiKey" />
          </div>
          <Button variant="outlined" label="Save" @click="onSave" />
        </div>
      </template>
    </Card>
  </div>
</template>
