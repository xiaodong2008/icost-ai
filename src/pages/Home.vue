<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import axios from "axios";
import { getRequestUrl, showToast } from "../utils";
import type { Account } from "../types";
import { copy } from "jsfast";

const operationType = ref("Record");
const operationTypeOptions = ref([
  "Record",
  "Compare-and-Record",
  "Update-Balance",
]);

const toast = useToast();
const src = ref<string | null>(null);
const processing = ref(false);
const results = ref<any[]>([]);
const selectedResults = ref<any[]>([]);
const customPrompt = ref(localStorage.getItem("customPrompt") || "");

// Dialog state for editing results
const editDialogVisible = ref(false);
const editingResultIndex = ref(-1);
const editResultForm = ref({
  type: "expense",
  amount: "0",
  account: "",
  date: "",
  time: "",
  category: "",
  note: "",
  transfer_to: "",
  warning: "",
});

function onFileSelect(event: any) {
  const file = event.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    src.value = e.target?.result as string;
    console.log(src.value);
  };

  reader.readAsDataURL(file);
}

// Save custom prompt to localStorage when it changes
const saveCustomPrompt = () => {
  localStorage.setItem("customPrompt", customPrompt.value);
};

const onProcess = async () => {
  if (!src.value) {
    showToast.error(toast, "Error", "Please select an image first");
    return;
  }

  processing.value = true;

  try {
    // Get categories and accounts from localStorage
    const categories = localStorage.getItem("category")?.split(",") || [];
    const accounts: Account[] = JSON.parse(
      localStorage.getItem("account") || "[]"
    );

    if (categories.length === 0) {
      showToast.error(toast, "Error", "Please add some categories first");
      processing.value = false;
      return;
    }

    if (accounts.length === 0) {
      showToast.error(toast, "Error", "Please add some accounts first");
      processing.value = false;
      return;
    }

    // Prepare API request data
    const requestData = {
      category: categories,
      account: accounts,
      image: src.value,
      mode: "record" as const,
      // Add API key from localStorage if available
      api_key: localStorage.getItem("openaiApiKey") || undefined,
      secret: localStorage.getItem("backendSecret") || undefined,
      custom_prompt: customPrompt.value.trim() || undefined,
    };

    console.log("Sending request to API...", {
      categories: requestData.category,
      accounts: requestData.account,
      mode: requestData.mode,
    });

    const response = await axios.post(
      getRequestUrl("/processImage"),
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60 second timeout for image processing
      }
    );

    if (response.data.success) {
      // Add unique IDs and account field to each result for DataTable selection
      const accounts = getAccounts();
      results.value = response.data.result.map((item: any, index: number) => {
        // Find account name from currency
        const matchingAccount = accounts.find(
          (account) => account.currency === item.currency
        );
        return {
          ...item,
          id: `result-${Date.now()}-${index}`,
          account: matchingAccount?.name || null,
        };
      });
      selectedResults.value = []; // Clear previous selections
      showToast.success(
        toast,
        "Success",
        `Processed ${results.value.length} expense record(s)`
      );
      console.log("Processing results:", results.value);
    } else {
      showToast.error(
        toast,
        "Error",
        response.data.error || "Failed to process image"
      );
    }
  } catch (error: any) {
    console.error("API Error:", error);

    if (error.response?.status === 401) {
      showToast.error(
        toast,
        "Authentication Error",
        error.response?.data?.error || "API key required"
      );
    } else if (error.response?.status === 400) {
      showToast.error(
        toast,
        "Invalid Request",
        error.response?.data?.error || "Invalid request data"
      );
    } else if (error.code === "ECONNABORTED") {
      showToast.error(
        toast,
        "Timeout Error",
        "Request timed out. Please try again."
      );
    } else if (error.code === "ERR_NETWORK") {
      showToast.error(
        toast,
        "Network Error",
        "Your network or server might be down, please try again later."
      );
    } else {
      showToast.error(
        toast,
        "Failed to process image",
        error.response?.data?.error || "Unknown error"
      );
    }
  } finally {
    processing.value = false;
  }
};

const copyToClipboard = (text: string) => {
  copy(text);
};

const copySelectedToClipboard = () => {
  if (selectedResults.value.length === 0) {
    showToast.error(
      toast,
      "Error",
      "Please select at least one record to copy"
    );
    return;
  }

  const textToCopy = selectedResults.value
    .map((item) => JSON.stringify(item))
    .join("\n");
  copyToClipboard(textToCopy);
  showToast.success(
    toast,
    "Success",
    `Copied ${selectedResults.value.length} record(s) to clipboard`
  );
};

const clearResults = () => {
  results.value = [];
  selectedResults.value = [];
};

const getAccountDisplay = (currency: string) => {
  // Get accounts from localStorage
  const accounts: Account[] = JSON.parse(
    localStorage.getItem("account") || "[]"
  );

  // Find account with matching currency
  const matchingAccount = accounts.find(
    (account) => account.currency === currency
  );

  if (matchingAccount) {
    return `${matchingAccount.name}(${currency})`;
  }

  // If no matching account found, just show currency
  return `Unknown(${currency})`;
};

const getAccounts = () => {
  return JSON.parse(localStorage.getItem("account") || "[]") as Account[];
};

const getCategories = () => {
  return localStorage.getItem("category")?.split(",") || [];
};

const getAccountOptions = (accounts: Account[]) => {
  return accounts.map((account) => ({
    label: `${account.name} (${account.currency})`,
    value: account.name,
  }));
};

const getCategoryOptions = (categories: string[]) => {
  return categories.map((category) => ({
    label: category,
    value: category,
  }));
};

const getSelectedAccountCurrency = (accountName: string) => {
  const accounts = getAccounts();
  const account = accounts.find((acc) => acc.name === accountName);
  return account?.currency || "";
};

const onEditResult = (result: any) => {
  editingResultIndex.value = results.value.findIndex((r) => r.id === result.id);

  editResultForm.value = {
    type: result.type || "expense",
    amount: result.amount || "0",
    account: result.account || "",
    date: result.date || "",
    time: result.time || "",
    category: result.category || "",
    note: result.note || "",
    transfer_to: result.transfer_to || "",
    warning: result.warning || "",
  };
  editDialogVisible.value = true;
};

const onSaveEditedResult = () => {
  if (
    !editResultForm.value.amount ||
    parseFloat(editResultForm.value.amount) <= 0
  ) {
    showToast.error(toast, "Error", "Amount must be greater than 0");
    return;
  }

  if (!editResultForm.value.date) {
    showToast.error(toast, "Error", "Date is required");
    return;
  }

  if (!editResultForm.value.time) {
    showToast.error(toast, "Error", "Time is required");
    return;
  }

  if (!editResultForm.value.account) {
    showToast.error(toast, "Error", "Account is required");
    return;
  }

  // Update the result in the array
  const updatedResult = {
    ...results.value[editingResultIndex.value],
    type: editResultForm.value.type,
    amount: parseFloat(editResultForm.value.amount),
    account: editResultForm.value.account,
    date: editResultForm.value.date,
    time: editResultForm.value.time,
    category: editResultForm.value.category.trim() || null,
    note: editResultForm.value.note.trim() || null,
    transfer_to: editResultForm.value.transfer_to.trim() || null,
    warning: editResultForm.value.warning.trim() || null,
  };

  results.value[editingResultIndex.value] = updatedResult;

  // Close dialog and show success message
  editDialogVisible.value = false;
  showToast.success(toast, "Success", "Result updated successfully");
};

const onCancelEditResult = () => {
  editDialogVisible.value = false;
  editResultForm.value = {
    type: "expense",
    amount: "0",
    account: "",
    date: "",
    time: "",
    category: "",
    note: "",
    transfer_to: "",
    warning: "",
  };
  editingResultIndex.value = -1;
};
</script>

<template>
  <div class="home-container">
    <Toast />
    <Card>
      <template #title> Auto Account </template>
      <template #content>
        <div class="card-inside">
          <div class="label-container">
            <label for="idea-region">Type</label>
            <SelectButton
              id="operation-type"
              v-model="operationType"
              :options="operationTypeOptions"
            />
          </div>
          <div class="label-container">
            <label for="idea-region">File</label>
          </div>
          <FileUpload
            mode="basic"
            @select="onFileSelect"
            customUpload
            auto
            severity="secondary"
            class="upload-button"
          />
          <img
            v-if="src"
            :src="src"
            alt="Image"
            class="image"
            style="filter: grayscale(100%)"
          />

          <div class="label-container">
            <label for="custom-prompt">Custom Instructions (Optional)</label>
            <Textarea
              id="custom-prompt"
              v-model="customPrompt"
              placeholder="Add any specific instructions for processing this image, e.g., 'This is a restaurant bill' or 'Focus on the items in the receipt'"
              :autoResize="true"
              rows="3"
              @input="saveCustomPrompt"
            />
          </div>

          <Button
            label="Process"
            variant="outlined"
            :loading="processing"
            :disabled="!src"
            @click="onProcess"
          />
        </div>
      </template>
    </Card>

    <!-- Results Section -->
    <Card v-if="results.length > 0">
      <template #title> Processed Results </template>
      <template #content>
        <div class="card-inside">
          <DataTable
            v-model:selection="selectedResults"
            :value="results"
            dataKey="id"
            tableStyle="min-width: 50rem"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="type" header="Type">
              <template #body="slotProps">
                <span
                  :class="{
                    'text-green-600': slotProps.data.type === 'income',
                    'text-red-600': slotProps.data.type === 'expense',
                    'text-blue-600': slotProps.data.type === 'transfer',
                  }"
                >
                  {{
                    slotProps.data.type === "income"
                      ? "Income"
                      : slotProps.data.type === "expense"
                      ? "Expense"
                      : "Transfer"
                  }}
                </span>
              </template>
            </Column>
            <Column field="currency" header="Account">
              <template #body="slotProps">
                <span class="text-gray-700 font-medium">
                  {{
                    slotProps.data.account
                      ? `${slotProps.data.account}(${getSelectedAccountCurrency(
                          slotProps.data.account
                        )})`
                      : getAccountDisplay(slotProps.data.currency)
                  }}
                </span>
              </template>
            </Column>
            <Column field="amount" header="Amount">
              <template #body="slotProps">
                <span
                  :class="{
                    'text-green-600': slotProps.data.type === 'income',
                    'text-red-600': slotProps.data.type === 'expense',
                    'text-blue-600': slotProps.data.type === 'transfer',
                  }"
                >
                  {{
                    slotProps.data.type === "income"
                      ? "+"
                      : slotProps.data.type === "expense"
                      ? "-"
                      : ""
                  }}{{ slotProps.data.amount }}
                </span>
              </template>
            </Column>
            <Column field="date" header="Date"></Column>
            <Column field="time" header="Time"></Column>
            <Column field="category" header="Category">
              <template #body="slotProps">
                <span v-if="slotProps.data.category">{{
                  slotProps.data.category
                }}</span>
                <span v-else class="text-gray-500 italic">N/A</span>
              </template>
            </Column>
            <Column field="transfer_to" header="Transfer To">
              <template #body="slotProps">
                <span v-if="slotProps.data.transfer_to" class="text-blue-600">
                  {{ slotProps.data.transfer_to }}
                </span>
                <span v-else class="text-gray-500">-</span>
              </template>
            </Column>
            <Column field="note" header="Note">
              <template #body="slotProps">
                <span v-if="slotProps.data.note">{{
                  slotProps.data.note
                }}</span>
                <span v-else class="text-gray-500">-</span>
              </template>
            </Column>
            <Column field="warning" header="Warning">
              <template #body="slotProps">
                <span v-if="slotProps.data.warning" class="text-orange-600">
                  {{ slotProps.data.warning }}
                </span>
                <span v-else class="text-gray-500">-</span>
              </template>
            </Column>
            <Column field="action" header="Action">
              <template #body="slotProps">
                <Button
                  label="Edit"
                  variant="outlined"
                  severity="info"
                  size="small"
                  @click="onEditResult(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
          <div class="results-actions">
            <span class="selection-info">
              {{ selectedResults.length }} of {{ results.length }} selected
            </span>
            <Button
              label="Clear Results"
              variant="outlined"
              severity="secondary"
              @click="clearResults"
            />
            <Button
              label="Copy Selected"
              variant="outlined"
              severity="info"
              :disabled="selectedResults.length === 0"
              @click="copySelectedToClipboard"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Edit Result Dialog -->
    <Dialog
      v-model:visible="editDialogVisible"
      header="Edit Result"
      :style="{ width: '600px' }"
      modal
    >
      <div class="dialog-content">
        <div class="form-grid">
          <div class="field">
            <label for="result-type">Type *</label>
            <SelectButton
              id="result-type"
              v-model="editResultForm.type"
              :options="[
                { label: 'Expense', value: 'expense' },
                { label: 'Income', value: 'income' },
                { label: 'Transfer', value: 'transfer' },
              ]"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <div class="field">
            <label for="result-amount">Amount *</label>
            <InputText
              id="result-amount"
              v-model="editResultForm.amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter amount"
              class="w-full"
            />
          </div>

          <div class="field">
            <label for="result-account">Account *</label>
            <Select
              id="result-account"
              v-model="editResultForm.account"
              :options="getAccountOptions(getAccounts())"
              optionLabel="label"
              optionValue="value"
              placeholder="Select an account"
              class="w-full"
            />
            <small v-if="editResultForm.account" class="account-currency">
              Currency: {{ getSelectedAccountCurrency(editResultForm.account) }}
            </small>
          </div>

          <div class="field">
            <label for="result-date">Date *</label>
            <InputText
              id="result-date"
              v-model="editResultForm.date"
              type="date"
              class="w-full"
            />
          </div>

          <div class="field">
            <label for="result-time">Time *</label>
            <InputText
              id="result-time"
              v-model="editResultForm.time"
              type="time"
              class="w-full"
            />
          </div>

          <div class="field">
            <label for="result-category">Category</label>
            <Select
              id="result-category"
              v-model="editResultForm.category"
              :options="getCategoryOptions(getCategories())"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a category"
              class="w-full"
              :clearable="true"
            />
          </div>

          <div class="field full-width">
            <label for="result-transfer-to">Transfer To</label>
            <Select
              id="result-transfer-to"
              v-model="editResultForm.transfer_to"
              :options="getAccountOptions(getAccounts())"
              optionLabel="label"
              optionValue="value"
              placeholder="Select destination account"
              class="w-full"
              :clearable="true"
            />
          </div>

          <div class="field full-width">
            <label for="result-note">Note</label>
            <Textarea
              id="result-note"
              v-model="editResultForm.note"
              placeholder="Enter note"
              class="w-full"
              :autoResize="true"
              rows="2"
            />
          </div>

          <div class="field full-width">
            <label for="result-warning">Warning</label>
            <Textarea
              id="result-warning"
              v-model="editResultForm.warning"
              placeholder="Enter warning message"
              class="w-full"
              :autoResize="true"
              rows="2"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" variant="outlined" @click="onCancelEditResult" />
        <Button label="Save" @click="onSaveEditedResult" />
      </template>
    </Dialog>
  </div>
</template>

<style lang="scss">
.home-container {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .image {
    height: 200px;
    width: auto;
    margin-right: auto;
    // object-fit: contain;
  }

  .upload-button {
    margin-right: auto;
  }
}

.results-actions {
  display: flex;
  gap: 10px;
  margin-top: 1rem;
  justify-content: flex-end;
  align-items: center;

  .selection-info {
    margin-right: auto;
    font-size: 0.9rem;
    color: var(--p-text-color-secondary);
    font-weight: 500;
  }
}

.text-green-600 {
  color: #16a34a;
}

.text-red-600 {
  color: #dc2626;
}

.text-blue-600 {
  color: #2563eb;
}

.text-orange-600 {
  color: #ea580c;
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-700 {
  color: #374151;
}

.dialog-content {
  .field {
    margin-bottom: 1rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--p-text-color);
    }

    .w-full {
      width: 100%;
    }
  }

  .field:last-child {
    margin-bottom: 0;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    .field.full-width {
      grid-column: 1 / -1;
    }
  }

  .account-currency {
    margin-top: 0.25rem;
    color: var(--p-text-color-secondary);
    font-style: italic;
  }
}
</style>
