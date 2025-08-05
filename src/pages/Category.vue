<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import { showToast } from "../utils";

const toast = useToast();
const selectedCategories = ref<{ id: string; name: string }[]>([]);
const categories = ref<{ id: string; name: string }[]>(
  (localStorage.getItem("category")?.split(",") || []).map((item) => ({
    id: item,
    name: item,
  }))
);
const newCategory = ref("");

// Dialog state and form data
const dialogVisible = ref(false);
const editingCategoryIndex = ref(-1);
const editForm = ref({
  name: "",
});

const onDeleteSelected = () => {
  if (selectedCategories.value.length === 0) {
    showToast.error(toast, "Error", "Please select at least one category");
    return;
  }
  console.log(selectedCategories.value, categories.value);
  const newCategories = categories.value.filter(
    (item) => !selectedCategories.value.includes(item)
  );
  localStorage.setItem(
    "category",
    newCategories.map((item) => item.id).join(",")
  );
  categories.value = newCategories;
  selectedCategories.value = [];
  showToast.success(toast, "Success", "Categories updated");
};

const onAddCategory = () => {
  const newCategories = newCategory.value.split(/[\n,]+/);
  categories.value = [
    ...categories.value,
    ...newCategories.map((item) => ({
      id: item,
      name: item,
    })),
  ];
  localStorage.setItem(
    "category",
    categories.value.map((item) => item.id).join(",")
  );
  newCategory.value = "";
  showToast.success(toast, "Success", "Categories updated");
};

const onEditCategory = (category: { id: string; name: string }) => {
  editingCategoryIndex.value = categories.value.indexOf(category);
  editForm.value = {
    name: category.name,
  };
  dialogVisible.value = true;
};

const onSaveCategory = () => {
  if (!editForm.value.name.trim()) {
    showToast.error(toast, "Error", "Category name is required");
    return;
  }

  const trimmedName = editForm.value.name.trim();

  // Update the category in the array
  categories.value[editingCategoryIndex.value] = {
    id: trimmedName,
    name: trimmedName,
  };

  // Save to localStorage
  localStorage.setItem(
    "category",
    categories.value.map((item) => item.id).join(",")
  );

  // Close dialog and show success message
  dialogVisible.value = false;
  showToast.success(toast, "Success", "Category updated successfully");
};

const onCancelEdit = () => {
  dialogVisible.value = false;
  editForm.value = { name: "" };
  editingCategoryIndex.value = -1;
};
</script>

<template>
  <div class="home-container">
    <Toast />

    <!-- Edit Category Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      header="Edit Category"
      :style="{ width: '400px' }"
      modal
    >
      <div class="dialog-content">
        <div class="field">
          <label for="category-name">Category Name *</label>
          <InputText
            id="category-name"
            v-model="editForm.name"
            placeholder="Enter category name"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" variant="outlined" @click="onCancelEdit" />
        <Button label="Save" @click="onSaveCategory" />
      </template>
    </Dialog>

    <Card>
      <template #title> Categories </template>
      <template #content>
        <div class="card-inside">
          <DataTable
            v-model:selection="selectedCategories"
            :value="categories"
            dataKey="id"
            tableStyle="min-width: 50rem"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="name" header="Name"></Column>
            <Column field="action" header="Action">
              <template #body="slotProps">
                <Button
                  label="Edit"
                  variant="outlined"
                  severity="info"
                  @click="onEditCategory(slotProps.data)"
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
            <label for="new-category">
              New Category (Separate by comma or break line)
            </label>
            <Textarea v-model="newCategory" autoResize />
          </div>
          <Button
            label="Add Category"
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
