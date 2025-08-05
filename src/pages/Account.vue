<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import { showToast } from "../utils";
import type { Account } from "../types";

const toast = useToast();
const selectedAccounts = ref<Account[]>([]);
const accounts = ref<Account[]>(
  JSON.parse(localStorage.getItem("account") || "[]")
);
const newAccount = ref("");

// Dialog state and form data
const dialogVisible = ref(false);
const editingAccountIndex = ref(-1);
const editForm = ref({
  name: "",
  currency: "",
  note: "",
});

const onDeleteSelected = () => {
  if (selectedAccounts.value.length === 0) {
    showToast.error(toast, "Error", "Please select at least one account");
    return;
  }
  console.log(selectedAccounts.value, accounts.value);
  const newAccounts = accounts.value.filter(
    (item) => !selectedAccounts.value.includes(item)
  );
  localStorage.setItem("account", JSON.stringify(newAccounts));
  accounts.value = newAccounts;
  selectedAccounts.value = [];
  showToast.success(toast, "Success", "Categories updated");
};

const onAddCategory = () => {
  const newAccounts = newAccount.value.split(/[\n,]+/);
  accounts.value = [
    ...accounts.value,
    ...newAccounts.map((item) => ({
      name: item,
      currency: "CNY",
      note: "",
    })),
  ];
  localStorage.setItem("account", JSON.stringify(accounts.value));
  newAccount.value = "";
  showToast.success(toast, "Success", "Accounts updated");
};

const onEditAccount = (account: Account) => {
  editingAccountIndex.value = accounts.value.indexOf(account);
  editForm.value = {
    name: account.name,
    currency: account.currency,
    note: account.note || "",
  };
  dialogVisible.value = true;
};

const onSaveAccount = () => {
  if (!editForm.value.name.trim()) {
    showToast.error(toast, "Error", "Account name is required");
    return;
  }

  if (!editForm.value.currency.trim()) {
    showToast.error(toast, "Error", "Currency is required");
    return;
  }

  // Update the account in the array
  accounts.value[editingAccountIndex.value] = {
    name: editForm.value.name.trim(),
    currency: editForm.value.currency.trim(),
    note: editForm.value.note.trim(),
  };

  // Save to localStorage
  localStorage.setItem("account", JSON.stringify(accounts.value));

  // Close dialog and show success message
  dialogVisible.value = false;
  showToast.success(toast, "Success", "Account updated successfully");
};

const onCancelEdit = () => {
  dialogVisible.value = false;
  editForm.value = { name: "", currency: "", note: "" };
  editingAccountIndex.value = -1;
};
</script>

<template>
  <div class="home-container">
    <Toast />

    <!-- Edit Account Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      header="Edit Account"
      :style="{ width: '450px' }"
      modal
    >
      <div class="dialog-content">
        <div class="field">
          <label for="account-name">Account Name *</label>
          <InputText
            id="account-name"
            v-model="editForm.name"
            placeholder="Enter account name"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="account-currency">Currency *</label>
          <InputText
            id="account-currency"
            v-model="editForm.currency"
            placeholder="Enter currency (e.g., CNY, USD)"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="account-note">Note</label>
          <Textarea
            id="account-note"
            v-model="editForm.note"
            placeholder="Enter optional note"
            class="w-full"
            :autoResize="true"
            rows="3"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" variant="outlined" @click="onCancelEdit" />
        <Button label="Save" @click="onSaveAccount" />
      </template>
    </Dialog>

    <Card>
      <template #title> Accounts </template>
      <template #content>
        <div class="card-inside">
          <DataTable
            v-model:selection="selectedAccounts"
            :value="accounts"
            dataKey="id"
            tableStyle="min-width: 50rem"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="name" header="Name"></Column>
            <Column field="currency" header="Currency"></Column>
            <Column field="note" header="Note"></Column>
            <Column field="action" header="Action">
              <template #body="slotProps">
                <Button
                  label="Edit"
                  variant="outlined"
                  severity="info"
                  @click="onEditAccount(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
          <Button
            label="Delete Selected"
            variant="outlined"
            severity="danger"
            @click="onDeleteSelected"
          />
          <div class="label-container">
            <label for="new-account">
              New Account (Separate by comma or break line)
            </label>
            <Textarea v-model="newAccount" autoResize />
          </div>
          <Button
            label="Add Account"
            variant="outlined"
            @click="onAddCategory"
          />
        </div>
      </template>
    </Card>
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
}
</style>
