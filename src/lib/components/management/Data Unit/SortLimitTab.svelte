<script lang="ts">
  import { onMount } from "svelte";
  import type { Writable } from "svelte/store";
  import type { DataUnit } from "$lib/stores/dataUnit";
  import { get } from "svelte/store";
  export let dataUnit: Writable<DataUnit>; // Define the prop

  // Safely handle fields being null or undefined
  let availableFields = (get(dataUnit).fields || []).map(
    (field) => field.label
  );

  // Initialize sortFields and limitRecords from dataUnit
  let sortFields = get(dataUnit).sortFields || [{ field: "", order: "" }];
  let limitRecords = get(dataUnit).limit || 0;

  // Reactive updates to dataUnit
  $: dataUnit.update((unit) => {
    unit.sortFields = sortFields;
    unit.limit = limitRecords;
    return unit;
  });

  // Add a new sort field
  function addSortField() {
    sortFields = [...sortFields, { field: "", order: "" }];
  }

  // Remove a sort field
  function removeSortField(index: number) {
    sortFields = sortFields.slice(0, index).concat(sortFields.slice(index + 1));
  }
</script>

<div class="card">
  <!-- Limit Records section -->
  <div class="setting-group">
    <label for="limitRecords" class="setting-label">Limit Records</label>
    <input
      id="limitRecords"
      type="number"
      bind:value={limitRecords}
      min="1"
      class="limit-input"
    />
  </div>

  <!-- Sort Fields section -->
  <div class="setting-group">
    <h4 class="section-title">Sort By</h4>

    {#if availableFields.length > 0}
      <div class="sort-fields">
        {#each sortFields as sortField, index}
          <div class="sort-field-row" class:first-row={index === 0}>
            <select bind:value={sortField.field} class="field-select">
              <option value="" disabled>Select Field</option>
              {#each availableFields as field}
                <option value={field}>{field}</option>
              {/each}
            </select>

            <select bind:value={sortField.order} class="order-select">
              <option value="" disabled>Select Order</option>
              <option value="Ascending">Ascending</option>
              <option value="Descending">Descending</option>
            </select>

            <button
              class="icon-button remove-btn"
              on:click={() => removeSortField(index)}
              aria-label="Remove sort field"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        {/each}
      </div>
      {#if sortFields.length === 0}
        <p class="no-fields-message">No fields are selected</p>
      {/if}
    {:else}
      <p class="no-fields-message">No fields available</p>
    {/if}
  </div>

  <!-- Add Sort Field button -->
  {#if availableFields.length > 0}
    <div class="add-field-container">
      <button on:click={addSortField} class="add-field-btn">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Sort Field
      </button>
    </div>
  {/if}
</div>

<style>
  .setting-group {
    margin-bottom: 24px;
  }

  .setting-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #555;
    margin-bottom: 8px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 500;
    margin: 0 0 12px 0;
    color: #555;
  }

  .limit-input {
    width: 80px;
    padding: 10px;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    font-size: 14px;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .limit-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    outline: none;
  }

  .sort-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sort-field-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 0;
  }

  .first-row {
    margin-top: 0;
  }

  .field-select,
  .order-select {
    height: 40px;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    background-color: white;
    padding: 0 12px;
    font-size: 14px;
    color: #333;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .field-select:focus,
  .order-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    outline: none;
  }

  .field-select {
    flex-grow: 1;
    min-width: 250px;
  }

  .order-select {
    width: 150px;
  }

  .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .icon-button:hover {
    background-color: #f5f5f5;
  }

  .remove-btn {
    color: #888;
  }

  .remove-btn svg {
    stroke: currentColor;
  }

  .add-field-container {
    margin-top: 12px;
  }

  .add-field-btn {
    background: transparent;
    border: none;
    color: #3b82f6;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .add-field-btn:hover {
    background-color: rgba(59, 130, 246, 0.08);
  }

  .add-field-btn svg {
    stroke: currentColor;
  }

  .no-fields-message {
    font-size: 14px;
    color: #888;
    padding: 12px;
    background-color: #f9f9f9;
    border-radius: 6px;
    text-align: center;
  }
</style>
