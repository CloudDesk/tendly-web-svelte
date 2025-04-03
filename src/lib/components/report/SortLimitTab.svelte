<script lang="ts">
  import { type IReportDataUnit } from "$lib/services/api";
  import { ChevronDown, Plus, Trash, XCircle } from "lucide-svelte";
  import type { Writable } from "svelte/store";
  import { get } from "svelte/store";

  export let dataUnit: Writable<IReportDataUnit>; // Define the prop

  let loading = false;
  let error: string | null = null;

  // Safely handle fields being null or undefined
  let availableFields = (get(dataUnit).fields || []).map(
    (field) => field.label
  );

  // Initialize sortFields and limitRecords from dataUnit
  let sortFields = get(dataUnit).sortFields || [
    { field: "", order: "Ascending" },
  ];
  let limitRecords = get(dataUnit).limit || 100;

  // Track already selected fields to prevent duplicates
  $: selectedFields = sortFields.map((field) => field.field).filter(Boolean);

  // Track slider value for synchronization with number input
  let sliderValue = limitRecords;

  // Reactive updates to dataUnit
  $: dataUnit.update((unit) => {
    unit.sortFields = sortFields;
    unit.limit = limitRecords;
    return unit;
  });

  // Add a new sort field
  function addSortField() {
    sortFields = [...sortFields, { field: "", order: "Ascending" }];
  }

  // Remove a sort field
  function removeSortField(index: number) {
    sortFields = sortFields.slice(0, index).concat(sortFields.slice(index + 1));
  }

  // Sync slider with number input
  function updateLimit() {
    if (limitRecords < 1) limitRecords = 1;
    if (limitRecords > 500) limitRecords = 500;
    sliderValue = limitRecords;
  }

  // Sync number input with slider
  function updateLimitFromSlider() {
    limitRecords = sliderValue;
  }

  // Check if a field is already selected in another row
  function isFieldSelected(field: string, currentIndex: number): boolean {
    return sortFields.some(
      (item, index) => index !== currentIndex && item.field === field
    );
  }
</script>

<div class="bg-white rounded-lg">
  <!-- Limit Records section -->
  <div class="mb-8">
    <h3 class="text-lg font-medium text-gray-800 mb-4">Limit Records</h3>

    <div class="space-y-4">
      <!-- Range slider -->
      <div class="px-2">
        <input
          type="range"
          min="1"
          max="500"
          bind:value={sliderValue}
          on:change={updateLimitFromSlider}
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1 px-1">
          <span>1</span>
          <span>100</span>
          <span>250</span>
          <span>500</span>
        </div>
      </div>

      <!-- Number input with validation -->
      <div class="flex items-center space-x-3">
        <label for="limitRecords" class="text-sm font-medium text-gray-700"
          >Records to display:</label
        >
        <div class="relative">
          <input
            id="limitRecords"
            type="number"
            bind:value={limitRecords}
            on:change={updateLimit}
            min="1"
            max="500"
            class="w-24 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
          />
          <div
            class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
          >
            <span class="text-xs text-gray-500">/ 500</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Sort Fields section -->
  <div class="mb-6">
    <h3 class="text-lg font-medium text-gray-800 mb-4">Sort By</h3>

    {#if availableFields.length > 0}
      <!-- Sort fields container with animation -->
      <div class="space-y-3">
        {#each sortFields as sortField, index (index)}
          <div
            class="flex items-center gap-3 p-2 rounded-md transition-all duration-200 hover:bg-gray-50 animate-fadeIn"
          >
            <div class="flex-1">
              <select
                bind:value={sortField.field}
                class="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              >
                <option value="" disabled>Select Field</option>
                {#each availableFields as field}
                  <option
                    value={field}
                    disabled={isFieldSelected(field, index)}
                  >
                    {field}
                    {isFieldSelected(field, index) ? "(already selected)" : ""}
                  </option>
                {/each}
              </select>
            </div>

            {#if sortField.field}
              <div class="flex items-center">
                <button
                  type="button"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  on:click={() =>
                    (sortField.order =
                      sortField.order === "Ascending"
                        ? "Descending"
                        : "Ascending")}
                >
                  {#if sortField.order === "Ascending"}
                    <ChevronDown class="h-4 w-4 mr-1" />
                    Asc
                  {:else}
                    <ChevronDown class="h-4 w-4 mr-1 " />
                    Desc
                  {/if}
                </button>
              </div>
            {/if}

            <button
              type="button"
              on:click={() => removeSortField(index)}
              class="p-2 text-gray-400 rounded-full hover:bg-red-50 transition-colors"
              aria-label="Remove sort field"
            >
              <Trash class="h-5 w-5 text-red-500 hover:fill-red-500 " />
            </button>
          </div>
        {/each}
      </div>

      <!-- No fields selected message -->
      {#if sortFields.length === 0}
        <div
          class="bg-gray-50 border border-gray-200 text-gray-600 rounded-md p-4 text-center animate-fadeIn"
        >
          <p>No sort fields selected</p>
        </div>
      {/if}

      <!-- Selected sort fields as tags (summary) -->
      {#if sortFields.some((field) => field.field)}
        <div class="mt-4 pt-4 border-t border-gray-200">
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Active Sort Fields:
          </h4>
          <div class="flex flex-wrap gap-2">
            {#each sortFields as field, index}
              {#if field.field}
                <div
                  class="inline-flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm"
                >
                  <span>{field.field}</span>
                  <span class="mx-1 text-blue-400">•</span>
                  <span class="text-xs text-blue-500">{field.order}</span>
                  <button
                    type="button"
                    class="ml-2 text-blue-400 hover:text-blue-600"
                    on:click={() => removeSortField(index)}
                  >
                    <XCircle
                      class="h-4 w-4 text-blue-500 hover:text-blue-800 transition"
                    />
                  </button>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    {:else}
      <!-- No fields available message -->
      <div
        class="bg-gray-50 border border-gray-200 text-red-300 rounded-md p-4 text-center"
      >
        <p>No fields available for sorting</p>
      </div>
    {/if}
  </div>

  <!-- Add Sort Field button -->
  {#if availableFields.length > 0 && selectedFields.length < availableFields.length}
    <div class="mt-4">
      <button
        type="button"
        on:click={addSortField}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <Plus />
        Add Sort Field
      </button>
    </div>
  {/if}
</div>

<style>
  /* Add fade-in animation */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
</style>
