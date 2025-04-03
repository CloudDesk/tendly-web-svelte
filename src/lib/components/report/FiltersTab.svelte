<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { collectionsApi, type IReportDataUnit } from "$lib/services/api";
  import { Plus, Check } from "lucide-svelte";
  import LoaderNew from "$lib/components/common/LoaderNew.svelte";

  export let dataUnit: IReportDataUnit;
  const dispatch = createEventDispatcher();
  let loading = false;

  let error: string | null = null;
  // Local reactive state
  let filters =
    dataUnit.filters.length > 0
      ? [...dataUnit.filters]
      : [
          {
            field: "",
            condition: "",
            value: "",
            nestedFields: [],
            subFilters: [],
            isNestedObject: false,
          },
        ];
  let filterLogic = dataUnit.filterLogic || "";
  let availableFields: Array<{
    field: string;
    type: string;
    nested?: Array<any>;
  }> = [];

  let activeRowIndex = -1;

  // Fetch fields dynamically
  async function fetchFields() {
    loading = true;
    try {
      const response = await collectionsApi.getFields(dataUnit.object);
      availableFields = Array.isArray(response.data)
        ? response.data.map((field) => ({
            field: field?.field || "",
            type: field?.type || "String",
            nested: field?.type.toLowerCase() === "object" ? field?.nested : [],
          }))
        : [];
      console.log(availableFields, "availableFields");
    } catch (err) {
      console.error("Failed to fetch fields", err);
      error = "Failed to fetch fields";
      availableFields = [];
    } finally {
      loading = false;
    }
  }

  // Condition mapping based on field type
  const conditionMap = {
    String: ["equals", "contains", "starts with", "ends with", "in"],
    Number: ["equals", "greater than", "less than", "between", "in"],
    Boolean: ["true", "false"],
    Date: ["equals", "before", "after", "between"],
    ObjectId: ["equals", "in"],
    Mixed: ["equals", "contains"],
    Object: ["equals", "greater than", "less than", "between", "in"],
  };

  function getConditions(field: string) {
    const fieldType = availableFields.find((f) => f.field === field)?.type;
    return fieldType && fieldType in conditionMap
      ? conditionMap[fieldType as keyof typeof conditionMap]
      : [];
  }

  // Handle field changes
  function handleFieldChange(filter: any, field: string) {
    const selectedField = availableFields.find((f) => f.field === field);
    Object.assign(filter, {
      field,
      condition: "",
      value: "",
      nestedFields: selectedField?.nested || [],
      subFilters: [],
      isNestedObject: selectedField?.type === "Object",
    });
  }

  // Handle save action
  function handleSave() {
    const filterValues = filters.map((f) => ({
      field: f.field,
      condition: f.condition,
      value: f.value,
      subFilters: f.subFilters,
    }));
    dispatch("save", { filters: filterValues, filterLogic });
  }

  // Add new filter row
  function addFilterRow() {
    filters = [
      ...filters,
      {
        field: "",
        condition: "",
        value: "",
        nestedFields: [],
        subFilters: [],
        isNestedObject: false,
      },
    ];
  }

  // Remove filter row
  function removeFilterRow(index: number) {
    filters = filters.filter((_, i) => i !== index);
  }

  // Set active row for highlighting
  function setActiveRow(index: number) {
    activeRowIndex = index;
  }

  // Initialize component
  onMount(async () => {
    await fetchFields();
    filters = filters.map((filter) => {
      const fieldData = availableFields.find((f) => f.field === filter.field);
      return {
        ...filter,
        nestedFields: fieldData?.nested || [],
        isNestedObject: fieldData?.type === "Object",
      };
    });
  });

  // Reactive updates
  $: if (filters.length > 0) {
    dataUnit.filters = filters;
    dataUnit.filterLogic = filterLogic;
  }
</script>

{#if loading}
  <div class="flex justify-center items-center h-64">
    <LoaderNew />
  </div>
{:else if error}
  <div class="bg-red-50 border border-red-200 p-4 rounded-md text-red-700">
    {error}
  </div>
{:else}
  <div class="bg-white rounded-lg">
    <div class="mb-4">
      <!-- Table-like header -->
      <div
        class="hidden md:grid md:grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-500 px-2"
      >
        <div class="col-span-3">Field</div>
        <div class="col-span-3">Condition</div>
        <div class="col-span-4">Value</div>
        <div class="col-span-2">Actions</div>
      </div>

      <!-- Filter rows -->
      <div class="space-y-3">
        {#each filters as filter, index}
          <div
            class="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-md transition-all duration-200 items-center"
            class:bg-blue-50={activeRowIndex === index}
            class:border={activeRowIndex === index}
            class:border-blue-200={activeRowIndex === index}
            on:click={() => setActiveRow(index)}
          >
            <!-- Field Selection -->
            <div class="md:col-span-3">
              <label
                class="block md:hidden text-sm font-medium text-gray-600 mb-1"
                >Field</label
              >
              <select
                bind:value={filter.field}
                on:change={(e) =>
                  handleFieldChange(filter, e.currentTarget.value)}
                class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2.5"
              >
                <option value="">Select Field</option>
                {#each availableFields as field}
                  <option value={field.field}>{field.field}</option>
                {/each}
              </select>
            </div>

            <!-- Condition Selection -->
            <div class="md:col-span-3">
              <label
                class="block md:hidden text-sm font-medium text-gray-600 mb-1"
                >Condition</label
              >
              {#if filter.field}
                <select
                  bind:value={filter.condition}
                  class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2.5"
                >
                  <option value="">Select Condition</option>
                  {#each getConditions(filter.field) as condition}
                    <option value={condition}>{condition}</option>
                  {/each}
                </select>
              {:else}
                <select
                  disabled
                  class="w-full bg-gray-100 border border-gray-200 text-gray-400 text-sm rounded-md cursor-not-allowed p-2.5"
                >
                  <option value="">Select Field First</option>
                </select>
              {/if}
            </div>

            <!-- Value Input or Nested Fields -->
            <div class="md:col-span-4">
              <label
                class="block md:hidden text-sm font-medium text-gray-600 mb-1"
                >Value</label
              >
              {#if filter.isNestedObject && filter.nestedFields.length}
                <select
                  bind:value={filter.subFilters[0]}
                  class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2.5"
                >
                  <option value="">Select Nested Field</option>
                  {#each filter.nestedFields as nested}
                    <option value={nested.field}>{nested.field}</option>
                  {/each}
                </select>
              {:else if filter.condition}
                <input
                  type="text"
                  bind:value={filter.value}
                  placeholder="Enter value"
                  class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2.5"
                />
              {:else}
                <input
                  type="text"
                  disabled
                  placeholder="Set condition first"
                  class="w-full bg-gray-100 border border-gray-200 text-gray-400 text-sm rounded-md cursor-not-allowed p-2.5"
                />
              {/if}
            </div>

            <!-- Action Buttons -->
            <div class="md:col-span-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                on:click={handleSave}
                disabled={!filter.field || !filter.condition}
                class="p-2 rounded-md bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white transition-colors duration-200"
                title="Confirm filter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>

              {#if filters.length > 1}
                <button
                  type="button"
                  on:click={() => removeFilterRow(index)}
                  class="p-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
                  title="Remove filter"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Add Filter & Logic Controls -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between mt-6 space-y-4 md:space-y-0"
    >
      <button
        type="button"
        on:click={addFilterRow}
        class="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200"
      >
        <Plus />
        Add Filter
      </button>

      {#if filters.length > 1}
        <div class="flex flex-col md:flex-row md:items-center gap-2">
          <label for="filterLogic" class="text-sm font-medium text-gray-700"
            >Filter Logic:</label
          >
          <div class="flex items-center gap-2">
            <input
              id="filterLogic"
              type="text"
              bind:value={filterLogic}
              placeholder="e.g., 1 AND 2 OR 3"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2.5"
            />
            <button
              type="button"
              on:click={handleSave}
              class="p-2 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
              title="Apply filter logic"
            >
              <Check />
              <!-- <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg> -->
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
