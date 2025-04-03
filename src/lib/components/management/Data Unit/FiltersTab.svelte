<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { getfieldsapi } from "$lib/services/api";
  import type { DataUnit } from "$lib/stores/dataUnit";

  export let DataUnit: DataUnit; // Changed from Writable to plain object since we're avoiding stores
  const dispatch = createEventDispatcher();

  console.log(DataUnit, "dataUnitdataUnitdataUnit--FiltersTab");
  // Local reactive state
  let filters =
    DataUnit.filters.length > 0
      ? [...DataUnit.filters]
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
  let filterLogic = DataUnit.filterLogic || "";
  let availableFields: Array<{
    field: string;
    type: string;
    nested?: Array<any>;
  }> = [];

  // Fetch fields dynamically
  async function fetchFields() {
    try {
      const response = await getfieldsapi.getFields(DataUnit.object);
      console.log(response, "response fetch fileds");
      availableFields = Array.isArray(response.data)
        ? response.data.map((field) => ({
            field: field?.field || "",
            type: field?.type || "String",
            nested: field?.nested || [],
          }))
        : [];
    } catch (err) {
      console.error("Failed to fetch fields", err);
      availableFields = [];
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
    DataUnit.filters = filters;
    DataUnit.filterLogic = filterLogic;
  }
</script>

<div class="filter-tab">
  {#each filters as filter, index}
    <div class="filter-row">
      <!-- Field Selection -->
      <select
        bind:value={filter.field}
        on:change={(e) => handleFieldChange(filter, e.currentTarget.value)}
      >
        <option value="">Select Field</option>
        {#each availableFields as field}
          <option value={field.field}>{field.field}</option>
        {/each}
      </select>

      <!-- Condition Selection -->
      {#if filter.field}
        <select bind:value={filter.condition}>
          <option value="">Select Condition</option>
          {#each getConditions(filter.field) as condition}
            <option value={condition}>{condition}</option>
          {/each}
        </select>
      {/if}

      <!-- Value Input or Nested Fields -->
      {#if filter.isNestedObject && filter.nestedFields.length}
        <select bind:value={filter.subFilters[0]}>
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
        />
      {/if}

      <!-- Save Trigger -->
      <button
        class="tick-btn"
        on:click={handleSave}
        disabled={!filter.field || !filter.condition}
      >
        ✅
      </button>

      <!-- Remove Button -->
      {#if filters.length > 1}
        <button
          on:click={() => (filters = filters.filter((_, i) => i !== index))}
        >
          ×
        </button>
      {/if}
    </div>
  {/each}

  <!-- Add Filter Button -->
  <button
    on:click={() =>
      (filters = [
        ...filters,
        {
          field: "",
          condition: "",
          value: "",
          nestedFields: [],
          subFilters: [],
          isNestedObject: false,
        },
      ])}
  >
    + Add Filter
  </button>

  <!-- Filter Logic -->
  {#if filters.length > 1}
    <div class="filter-logic">
      <input type="text" bind:value={filterLogic} placeholder="e.g., 1 AND 2" />
    </div>
  {/if}
</div>

<style>
  .filter-tab {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .filter-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  select,
  input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  button {
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .tick-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .filter-logic {
    margin-top: 1rem;
  }
</style>
