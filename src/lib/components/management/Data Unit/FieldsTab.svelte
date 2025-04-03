<script lang="ts">
  import { onMount, onDestroy, afterUpdate } from "svelte";
  import { collectionsApi, type IReportDataUnit } from "$lib/services/api";
  import { Search, X } from "lucide-svelte";
  import { get, writable, type Writable } from "svelte/store";

  export let dataUnit: Writable<IReportDataUnit>; // Update the type to Writable<DataUnit>
  let selectedFields = writable<string[]>([]);
  let searchTerm = "";
  let fieldsData: any = [];
  let loading = true;
  let error: string | null = null;
  let previousObject = get(dataUnit).object;
  let isInitialLoad = true;
  let isResetting = false;
  console.log(get(dataUnit), "");
  console.log(dataUnit, "dataUnits");
  // Create a separate local array to directly control what's shown in the UI
  let displayedSelectedFields: string[] = [];

  // Subscribe to the selectedFields store to update the local array
  selectedFields.subscribe((fields) => {
    displayedSelectedFields = [...fields];
  });

  async function fetchFields() {
    try {
      loading = true;
      error = null;
      fieldsData = [];
      let getDataUnit = get(dataUnit);
      console.log(getDataUnit);
      const response = await collectionsApi.getFields(getDataUnit.object);
      console.log(response, "Response");
      fieldsData = response.data || [];

      // Only populate selected fields on initial load
      if (isInitialLoad && !isResetting) {
        const initialFields = get(dataUnit).fields.map((f) => f.apiName);
        selectedFields.set(initialFields);
        displayedSelectedFields = [...initialFields];
        isInitialLoad = false;
      }

      loading = false;
      isResetting = false;
    } catch (err) {
      error = "Failed to fetch fields";
      loading = false;
      isResetting = false;
    }
  }

  // Function to immediately clear UI selection before any other operations
  function forceUIReset() {
    // First, clear the local array that controls what's shown in the UI
    displayedSelectedFields = [];

    // Then reset the store
    selectedFields.set([]);

    // And finally update the dataUnit store
    dataUnit.update((current) => ({
      ...current,
      fields: [],
    }));
  }

  function toggleField(field: { field: string; type: string }) {
    if (displayedSelectedFields.includes(field.field)) {
      displayedSelectedFields = displayedSelectedFields.filter(
        (f) => f !== field.field
      );
    } else {
      displayedSelectedFields = [...displayedSelectedFields, field.field];
    }

    // Update the store
    selectedFields.set(displayedSelectedFields);
    updateDataUnitStore();
  }

  function selectAll() {
    displayedSelectedFields = fieldsData.map((f: any) => f.field);
    selectedFields.set(displayedSelectedFields);
    updateDataUnitStore();
  }

  function deselectAll() {
    displayedSelectedFields = [];
    selectedFields.set([]);
    updateDataUnitStore();
  }

  function removeField(field: string) {
    displayedSelectedFields = displayedSelectedFields.filter(
      (f) => f !== field
    );
    selectedFields.set(displayedSelectedFields);
    updateDataUnitStore();
  }

  function updateDataUnitStore() {
    dataUnit.update((current) => ({
      ...current,
      fields: displayedSelectedFields.map((field) => {
        const fieldData = fieldsData.find((f: any) => f.field === field) || {};
        return {
          apiName: field,
          fieldType: fieldData.type || "",
          label: fieldData.field || "",
          referenceTo: "",
        };
      }),
    }));
  }

  onMount(() => {
    fetchFields();
  });

  // Force a complete rerender when object changes
  const unsubscribe = dataUnit.subscribe(($dataUnit) => {
    if ($dataUnit.object !== previousObject) {
      console.log(
        `Object changed from ${previousObject} to ${$dataUnit.object}`
      );

      // Update reference
      previousObject = $dataUnit.object;

      // Set flag to prevent auto-selection on fetch
      isResetting = true;

      // CRITICAL: Force immediate UI reset before anything else
      forceUIReset();

      // Reset other state
      searchTerm = "";

      // Use setTimeout with 0 delay to break the execution flow
      // This ensures the UI updates before the next operation
      setTimeout(() => {
        // Fetch new fields after UI has been reset
        fetchFields();
      }, 0);
    }
  });

  onDestroy(unsubscribe);

  $: filteredFields = fieldsData.filter((f: any) =>
    f.field.toLowerCase().includes(searchTerm.toLowerCase())
  );

  type FieldType =
    | "String"
    | "Number"
    | "Object"
    | "Date"
    | "Boolean"
    | "ObjectId"
    | "Array";

  function getTypeColor(type: FieldType) {
    const typeColors: Record<FieldType, string> = {
      String: "bg-blue-100 text-blue-800",
      Number: "bg-green-100 text-green-800",
      Date: "bg-purple-100 text-purple-800",
      Boolean: "bg-yellow-100 text-yellow-800",
      ObjectId: "bg-red-100 text-red-800",
      Array: "bg-indigo-100 text-indigo-800",
      Object: "bg-pink-100 text-pink-800",
    };
    return typeColors[type] || "bg-gray-100 text-gray-800";
  }
</script>

{#if loading}
  <div class="flex justify-center items-center h-64">
    <p class="text-gray-500">Loading...</p>
  </div>
{:else if error}
  <div class="bg-red-50 border border-red-200 p-4 rounded-md text-red-700">
    {error}
  </div>
{:else}
  <div class="border border-yellow-300 rounded-xl p-6">
    <div class="flex space-x-6">
      <div class="w-2/3 space-y-4">
        <div class="relative">
          <input
            type="text"
            placeholder="Search fields..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 transition duration-200"
            bind:value={searchTerm}
          />
          <div
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          >
            <Search size={20} />
          </div>
          {#if searchTerm}
            <button
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              on:click={() => (searchTerm = "")}
            >
              <X size={20} />
            </button>
          {/if}
        </div>

        <div class="flex space-x-2">
          <button
            on:click={selectAll}
            class="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Select All
          </button>
          {#if displayedSelectedFields.length > 0}
            <button
              on:click={deselectAll}
              class="py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
            >
              Deselect All
            </button>
          {/if}
        </div>

        <div class="border border-yellow-300 rounded-md overflow-hidden">
          <div class="max-h-64 overflow-y-auto divide-y">
            {#each filteredFields as field}
              <div
                role="button"
                tabindex="0"
                class="flex items-center p-3 hover:bg-gray-50 cursor-pointer group"
                on:click={() => toggleField(field)}
                on:keydown={(e) =>
                  (e.key === "Enter" || e.key === " ") && toggleField(field)}
              >
                <input
                  type="checkbox"
                  checked={displayedSelectedFields.includes(field.field)}
                  class="mr-3 rounded focus:ring-2 focus:ring-blue-200"
                  on:click|stopPropagation={() => toggleField(field)}
                />
                <div class="flex-grow">
                  <span class="font-medium">{field.field}</span>
                </div>
                <span
                  class={`text-xs px-2 py-0.5 rounded ${getTypeColor(field.type)}`}
                >
                  {field.type}
                </span>
              </div>
            {/each}
            {#if filteredFields.length === 0}
              <div class="text-center text-gray-500 p-4">No fields found</div>
            {/if}
          </div>
        </div>
      </div>

      <div class="w-1/3 border border-yellow-300 rounded-md">
        <div class="bg-gray-100 px-4 py-2 rounded-t-md">
          <h3 class="font-semibold text-gray-700">Selected Fields</h3>
          <span class="text-sm text-gray-500"
            >({displayedSelectedFields.length})</span
          >
        </div>

        {#if displayedSelectedFields.length === 0}
          <div
            class="flex items-center justify-center h-32 border-t border-yellow-300 text-gray-500 text-sm"
          >
            No fields selected
          </div>
        {:else}
          <ul class="space-y-2 p-2">
            {#each displayedSelectedFields as field}
              <li
                class="flex justify-between items-center p-2 bg-blue-50 rounded-md"
              >
                <span class="truncate">{field}</span>
                <button
                  on:click={() => removeField(field)}
                  class="text-blue-500 hover:text-blue-700"
                >
                  <X size={18} />
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </div>
{/if}
