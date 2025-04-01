<script lang="ts">
  import { onMount } from "svelte";
  import { getfieldsapi } from "$lib/services/api";
  import { writable } from "svelte/store";
  import type { DataUnit } from "$lib/stores/dataUnit"; // Ensure the correct type is imported
  import { dataUnit } from "$lib/stores/dataUnit";

  export let DataUnit: DataUnit | null = null; // Use the correct type
  console.log(DataUnit, "dataUnitdataUnitdataUnit--FiltersTab");

  // Shared state for filters and filterLogic
  export const filtersStore = writable<
    Array<{
      field: string;
      condition: string;
      value: string;
      nestedFields: Array<any>;
      subFilters: Array<any>;
      isNestedObject?: boolean;
    }>
  >([
    {
      field: "", // Initialize with the specific filter
      condition: "true",
      value: "",
      nestedFields: [],
      subFilters: [],
      isNestedObject: false,
    },
  ]);

  export const filterLogicStore = writable<string>("");

  let filtersData: Array<{ field: string; type: string; nested?: Array<any> }> =
    [];
  let filters: any = [];
  let filterLogic = "";

  // Subscribe to the stores
  filtersStore.subscribe((value) => (filters = value));
  filterLogicStore.subscribe((value) => (filterLogic = value));

  let validationErrors: string[] = [];

  // Fetch available fields on component mount
  async function fetchFields() {
    try {
      const response: {
        data?:
          | Array<{ field: string; type: string; nested?: Array<any> }>
          | string[]
          | undefined;
      } = await getfieldsapi.getFields();
      filtersData = Array.isArray(response.data)
        ? response.data
            .filter(
              (
                field
              ): field is {
                field: string;
                type: string;
                nested?: Array<any>;
              } =>
                typeof field === "object" &&
                field !== null &&
                "field" in field &&
                "type" in field
            )
            .map((field) => ({
              field: field.field || "",
              type: field.type || "String",
              nested: field.nested || [],
            }))
        : [];
    } catch (err) {
      console.error("Failed to fetch fields", err);
      filtersData = []; // Fallback to an empty array in case of an error
    }
  }

  function getConditions(
    type:
      | "String"
      | "Number"
      | "Boolean"
      | "Date"
      | "ObjectId"
      | "Mixed"
      | "Object"
      | undefined
  ) {
    const conditionMap = {
      String: ["equals", "contains", "starts with", "ends with", "in"],
      Number: ["equals", "greater than", "less than", "between", "in"],
      Boolean: ["true", "false"],
      Date: ["equals", "before", "after", "between"],
      ObjectId: ["equals", "in"],
      Mixed: ["equals", "contains"],
      Object: ["has nested fields"],
    };

    return type && conditionMap[type] ? conditionMap[type] : [];
  }

  function getConditionsForFilter(filterField: string | undefined) {
    if (!filterField) return []; // Return an empty array if no field is selected
    const fieldType = filtersData.find((f) => f.field === filterField)?.type;
    return getConditions(
      fieldType as
        | "String"
        | "Number"
        | "Boolean"
        | "Date"
        | "ObjectId"
        | "Mixed"
        | "Object"
        | undefined
    );
  }

  // Handle field selection
  function handleFieldChange(filter: (typeof filters)[0], fieldName: string) {
    const selectedField = filtersData.find((f) => f.field === fieldName);

    // Reset filter state
    filter.field = fieldName;
    filter.condition = ""; // Reset condition when field changes
    filter.value = ""; // Reset value when field changes
    filter.nestedFields = selectedField?.nested || [];
    filter.subFilters = []; // Reset subFilters when field changes

    // Special handling for nested objects
    filter.isNestedObject = selectedField?.type === "Object";

    // Update DataUnit and store with the selected field
    updateDataUnit();
  }

  // Handle nested field selection
  function handleNestedFieldChange(
    filter: (typeof filters)[0],
    nestedField: string
  ) {
    filter.subFilters = nestedField ? [nestedField] : []; // Reset subFilters if no nested field is selected

    // Update DataUnit and store with the selected nested field
    updateDataUnit();
  }

  // Handle nested field selection (refactored to a named function)
  function handleNestedFieldChangeEvent(e: Event, filter: (typeof filters)[0]) {
    const target = e.target as HTMLSelectElement | null; // Explicitly type e.target
    const nestedField = target?.value || ""; // Use optional chaining to handle null
    if (nestedField) {
      handleNestedFieldChange(filter, nestedField);
    }
  }

  // Handle condition selection
  function handleConditionChange(
    filter: (typeof filters)[0],
    condition: string
  ) {
    filter.condition = condition || ""; // Reset condition if no condition is selected

    updateDataUnit();
  }

  // Handle value change
  function handleValueChange(filter: (typeof filters)[0], value: string) {
    filter.value = value || ""; // Reset value if no value is entered

    updateDataUnit();
  }

  // Add a new filter
  function addFilter() {
    filtersStore.update((currentFilters) => {
      const updatedFilters = [
        ...currentFilters,
        {
          field: "",
          condition: "",
          value: "",
          nestedFields: [],
          subFilters: [],
        },
      ];

      // Update DataUnit with the new filter
      updateDataUnit(updatedFilters);
      return updatedFilters;
    });
  }

  // Remove a filter
  function removeFilter(index: number) {
    filtersStore.update((currentFilters) => {
      currentFilters.splice(index, 1);
      const updatedFilters = [...currentFilters];

      // Update DataUnit with the updated filters
      updateDataUnit(updatedFilters);
      return updatedFilters;
    });
  }

  // Validate filters
  function validateFilters() {
    validationErrors = filters
      .map((filter: any, index: number) => {
        if (
          !filter.field ||
          !filter.condition ||
          (!filter.value && !filter.subFilters?.length)
        ) {
          return `Filter ${index + 1} is incomplete.`;
        }
        return null;
      })
      .filter((error: any): error is string => error !== null); // Filter out null values

    return validationErrors.length === 0;
  }
  // Restore filters from the store on component mount
  onMount(() => {
    fetchFields();
    dataUnit.subscribe((unit) => {
      if (unit) {
        // Restore filters and filterLogic from the dataUnit store
        filters = unit.filters.length > 0 ? [...unit.filters] : filters; // Clone filters to avoid direct mutation
        filterLogic = unit.filterLogic || "";

        // Ensure the restored filters are synchronized with the store
        filtersStore.set(filters);
        filterLogicStore.set(filterLogic);

        // Update the UI state to reflect the restored values
        filters.forEach((filter: any) => {
          const selectedField = filtersData.find(
            (f) => f.field === filter.field
          );
          if (selectedField) {
            filter.nestedFields = selectedField.nested || [];
            filter.isNestedObject = selectedField.type === "Object";
          }
          // Ensure the condition is properly set in the UI
          filter.condition = filter.condition || ""; // Ensure condition is not undefined
        });

        // Synchronize the store with the updated filters
        filtersStore.set(filters);
      }
    });
  });

  // Restore filters and conditions properly on component mount
  onMount(async () => {
    await fetchFields(); // Wait for fields to be fetched first

    dataUnit.subscribe((unit) => {
      if (unit) {
        filters = unit.filters.length > 0 ? [...unit.filters] : filters;
        filterLogic = unit.filterLogic || "";

        // Ensure the restored filters have correct conditions and options
        filters = filters.map((filter: any) => {
          const selectedField = filtersData.find(
            (f) => f.field === filter.field
          );
          return {
            ...filter,
            nestedFields: selectedField?.nested || [],
            isNestedObject: selectedField?.type === "Object",
            condition: filter.condition || "",
            value: filter.value || "",
            subFilters: filter.subFilters || [], // Ensure subFilters are not undefined
          };
        });

        filtersStore.set(filters);
        filterLogicStore.set(filterLogic);
      }
    });
  });

  // Update DataUnit with the current filters and filterLogic
  function updateDataUnit(updatedFilters = filters) {
    dataUnit.update((unit) => {
      if (unit) {
        unit.filters = updatedFilters.map((filter: any) => ({
          ...filter,
          condition: filter.condition || "",
          value: filter.value || "",
          subFilters: [...filter.subFilters],
        }));
        unit.filterLogic = filterLogic;
      }
      return unit;
    });

    filtersStore.set(updatedFilters);
    filterLogicStore.set(filterLogic);
  }

  function validateFilterLogic(input: string): string {
    // Allow only "AND" and "OR" operators, with optional parentheses and spaces
    const validPattern = /^(\s*(\d+|AND|OR|\(|\))\s*)*$/i;
    return validPattern.test(input) ? input : filterLogic; // Return input if valid, otherwise keep the current value
  }

  function handleFilterLogicInput(event: Event) {
    const inputElement = event.target as HTMLInputElement; // Explicitly cast the target
    const validatedLogic = validateFilterLogic(inputElement?.value || "");
    filterLogicStore.set(validatedLogic);
    filterLogic = validatedLogic;
    updateDataUnit(); // Save filterLogic in dataUnit
  }
</script>

<div class="filters-container">
  {#if filters.length > 1}
    <div class="filter-logic-section">
      <label
        for="filter-logic"
        title="Define the logical relationship between filters (e.g., 1 AND (2 OR 3))"
      >
        Filter Logic
      </label>
      <input
        id="filter-logic"
        type="text"
        bind:value={filterLogic}
        placeholder="e.g., 1 AND (2 OR 3)"
        on:input={handleFilterLogicInput}
      />
    </div>
  {/if}

  {#if validationErrors.length > 0}
    <div class="validation-errors">
      {#each validationErrors as error}
        <p>{error}</p>
      {/each}
    </div>
  {/if}

  <div>
    {#each filters as filter, filterIndex}
      <div class="filter-row">
        <!-- Main Field Selector -->
        <select
          bind:value={filter.field}
          on:change={(e) =>
            handleFieldChange(filter, e.currentTarget.value || "")}
          title="Select the field to filter"
        >
          <option value="" disabled>Select the field to filter</option>
          <!-- Placeholder option -->
          {#each filtersData as field (field.field)}
            {#if typeof field === "object" && "field" in field}
              <option value={field.field}>{field.field}</option>
            {/if}
          {/each}
        </select>

        <!-- Nested Field Selector (for Object type fields) -->
        {#if filter.isNestedObject && filter.nestedFields.length > 0}
          <select
            bind:value={filter.subFilters[0]}
            on:change={(e) => handleNestedFieldChangeEvent(e, filter)}
            title="Select nested field"
          >
            <option value="" disabled>Select nested field...</option>
            <!-- Placeholder option -->
            {#each filter.nestedFields as nestedField}
              <option value={nestedField.field}>{nestedField.field}</option>
            {/each}
          </select>
        {/if}

        <!-- Condition Selector -->
        <select
          bind:value={filter.condition}
          on:change={(e) =>
            handleConditionChange(filter, e.currentTarget.value || "")}
          title="Select the condition for the filter"
        >
          <option value="" disabled selected
            >Select the condition for the filter</option
          >
          <!-- Placeholder option -->
          {#each getConditionsForFilter(filter.field) as condition}
            <option value={condition}>{condition}</option>
          {/each}
        </select>

        <!-- Value Input -->
        <input
          type="text"
          bind:value={filter.value}
          on:input={(e) =>
            handleValueChange(filter, e.currentTarget.value || "")}
          placeholder="Enter value..."
          title="Enter the value for the filter"
        />

        <!-- Remove Filter Button -->
        {#if filters.length > 1}
          <button
            on:click={() => removeFilter(filterIndex)}
            title="Remove this filter"
          >
            Remove
          </button>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Add Filter Button -->
  <button on:click={addFilter} title="Add a new filter"> + Add Filter </button>
</div>

<style>
  .filters-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .filter-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .filter-logic-section {
    margin-bottom: 1rem;
  }

  select,
  input,
  button {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .validation-errors {
    color: red;
    font-size: 0.9rem;
  }

  button {
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  button:hover {
    background-color: #0056b3;
  }
</style>
