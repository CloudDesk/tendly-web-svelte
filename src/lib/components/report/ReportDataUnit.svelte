<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable, get } from "svelte/store";
  import InfoTab from "./InfoTab.svelte";
  import FieldsTab from "./FieldsTab.svelte";
  import FiltersTab from "./FiltersTab.svelte";
  import SortLimitTab from "./SortLimitTab.svelte";
  import type { IReportDataUnit } from "$lib/services/api";
  import { Loader } from "lucide-svelte";

  const dispatch = createEventDispatcher();
  // Props to accept initial values for update scenario
  export let initialDataUnit: Partial<IReportDataUnit> = {};
  export let mode: "create" | "update" = "create";
  export let showModal = true;

  // Form validation state
  let errors: Record<string, string> = {};
  let isSubmitting = false;
  let currentTab = "Info";

  // Create a writable store with initial values
  const defaultDataUnit = {
    name: "",
    apiName: "",
    description: "",
    object: null,
    fields: [],
    filters: [],
    filterLogic: "",
    sortFields: [],
    limit: 10,
    preview: null,
  };

  // Merge default values with any provided initial values
  const initialValues = {
    ...defaultDataUnit,
    ...initialDataUnit,
  };
  console.log(initialValues, "initialValues");
  // Create a writable store with the initial values
  const dataUnit = writable<IReportDataUnit>(initialValues);
  console.log(get(dataUnit), "dataUnit");
  console.log(errors, "errors");
  function setTab(tab: string) {
    currentTab = tab;
  }

  // Handle modal closing
  function closeModal() {
    showModal = false;
    dispatch("close");
  }

  // Handle modal opening
  function openModal() {
    showModal = true;
  }

  // Reset form to initial state
  // function resetForm() {
  //   dataUnit.set(defaultDataUnit);
  //   errors = {};
  // }

  // Validate the form data
  function validateForm(): boolean {
    const $dataUnit = get(dataUnit);
    let isValid = true;
    const newErrors: Record<string, string> = {};

    // Validate Info tab
    if (!$dataUnit.name) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!$dataUnit.object) {
      newErrors.object = "Object selection is required";
      isValid = false;
    }

    // Validate Fields tab
    if ($dataUnit.fields.length === 0) {
      newErrors.fields = "At least one field must be selected";
      isValid = false;
    }

    // Update errors state
    errors = newErrors;
    return isValid;
  }

  async function saveDataUnit() {
    try {
      if (!validateForm()) {
        // If there's an error on the Info tab, navigate there
        if (errors.name || errors.object) {
          currentTab = "Info";
        }
        // If there's an error on the Fields tab, navigate there
        else if (errors.fields) {
          currentTab = "Fields";
        }
        return;
      }

      isSubmitting = true;
      const $dataUnit = get(dataUnit);
      dispatch("save", $dataUnit);

      // Close modal on successful save
      await closeModal();
    } catch (error) {
      console.error("Error saving Data Unit:", error);
      alert(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      isSubmitting = false;
    }
  }

  function updateDataUnit(event: CustomEvent) {
    console.log(event.detail, "eventdetail");
    const detail = event.detail;

    dataUnit.update((current) => {
      // If object is changed, reset related fields
      if (detail?.object && detail.object !== current.object) {
        return {
          ...current,
          ...detail,
          fields: [],
          filters: [],
          filterLogic: "",
          sortFields: [],
          limit: 10,
          preview: null,
        };
      } else {
        console.log("else", detail);
        return { ...current, ...detail };
      }
    });
    // Clear any errors related to the updated fields
    if (detail.name) errors.name = "";
    if (detail.object) errors.object = "";
    if (detail.fields) errors.fields = "";
    console.log(get(dataUnit), "dataUnit");
  }

  // onMount(() => {
  //   const $dataUnit = get(dataUnit);
  // });
</script>

<!-- Content -->
<div class="flex flex-col flex-1 overflow-hidden min-h-[60vh]">
  <!-- Tabs -->
  <div class="flex border-b px-4">
    {#each ["Info", "Fields", "Filters", "Sort & Limit"] as tab}
      <button
        on:click={() => setTab(tab)}
        class={`py-3 px-4 font-medium transition-colors ${
          currentTab === tab
            ? "border-b-2 border-yellow-500 text-yellow-600"
            : "text-gray-600 hover:text-yellow-500"
        }`}
      >
        {tab}
        {#if tab === "Info" && (errors.name || errors.object)}
          <span class="ml-1 text-red-500">*</span>
        {/if}
        {#if tab === "Fields" && errors.fields}
          <span class="ml-1 text-red-500">*</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Tab Content -->
  <div class="flex-1 p-6 overflow-y-auto">
    {#if currentTab === "Info"}
      <InfoTab dataUnit={$dataUnit} on:update={updateDataUnit} />
      {#if errors.name}
        <p class="text-red-500 mt-2">{errors.name}</p>
      {/if}
      {#if errors.object}
        <p class="text-red-500 mt-2">{errors.object}</p>
      {/if}
    {:else if currentTab === "Fields"}
      <FieldsTab {dataUnit} on:update={updateDataUnit} />
      {#if errors.fields}
        <p class="text-red-500 mt-2">{errors.fields}</p>
      {/if}
    {:else if currentTab === "Filters"}
      <FiltersTab dataUnit={$dataUnit} on:update={updateDataUnit} />
    {:else if currentTab === "Sort & Limit"}
      <SortLimitTab {dataUnit} on:update={updateDataUnit} />
    {:else if currentTab === "Preview"}
      <!-- <PreviewTab dataUnit={$dataUnit} on:update={updateDataUnit} /> -->
    {/if}
  </div>

  <!-- Footer -->
  <div class="mt-auto p-4 border-t bg-gray-50 flex justify-end items-center">
    <!-- <div>
      {#if Object.keys(errors).length > 0}
        <p class="text-red-500 text-sm">
          Please fix the errors before submitting
        </p>
      {/if}
    </div> -->
    <div class="flex space-x-3">
      <button
        class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-md transition"
        on:click={closeModal}
        disabled={isSubmitting}
      >
        Cancel
      </button>
      <button
        class="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition flex items-center"
        on:click={saveDataUnit}
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <Loader />
          {mode === "create" ? "Creating..." : "Updating..."}
        {:else}
          {mode === "create" ? "Create Data Unit" : "Update Data Unit"}
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .btn-active {
    color: #1d4ed8;
  }
  .btn-inactive {
    color: #1a1a1a;
  }
  .btn-inactive:hover {
    color: rgba(29, 78, 216, 0.7);
  }
</style>
