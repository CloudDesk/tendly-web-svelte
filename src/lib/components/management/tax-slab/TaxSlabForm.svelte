<script lang="ts">
  import { taxRegime } from "$lib/constants/users";
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";
  import type { TaxSlab } from "$lib/types/taxSlab";

  export let initialData: TaxSlab | null = null;
  export let readOnly: boolean = false;

  const dispatch = createEventDispatcher();

  // Get current year and create year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const regime = writable(initialData?.regime || "old");
  const fromYear = writable(
    initialData ? initialData.financialYear.from : currentYear
  );
  const toYear = writable(
    initialData ? initialData.financialYear.to : currentYear + 1
  );
  const slabs = writable(
    initialData?.slabs || [{ fromAmount: 0, toAmount: null, taxRate: 0 }]
  );
  const cessRate = writable(initialData?.cessRate || 0);
  const standardDeduction = writable(initialData?.standardDeduction || 0);
  const isActive = writable(initialData?.isActive || false);

  // Validation store
  let formErrors = {
    slabs: [] as Record<string, string>[],
    general: {} as Record<string, string>,
  };

  function validateSlabs() {
    const currentSlabs = $slabs;
    const errors: Record<string, string>[] = Array(currentSlabs.length).fill(
      {}
    );

    currentSlabs.forEach((slab, index) => {
      const error: Record<string, string> = {};

      // Validate fromAmount
      if (slab.fromAmount < 0) {
        error.fromAmount = "Amount cannot be negative";
      }

      // Validate toAmount
      if (slab.toAmount !== null) {
        if (slab.toAmount < 0) {
          error.toAmount = "Amount cannot be negative";
        }
        if (slab.toAmount <= slab.fromAmount) {
          error.toAmount = "Must be greater than From Amount";
        }
      }

      // Validate last slab toAmount requirement
      if (index !== currentSlabs.length - 1 && slab.toAmount === null) {
        error.toAmount = "To Amount is required";
      }

      // Validate taxRate
      if (slab.taxRate < 0) {
        error.taxRate = "Tax rate cannot be negative";
      }

      errors[index] = error;
    });

    formErrors.slabs = errors;
    return errors.every((error) => Object.keys(error).length === 0);
  }

  function handleFromYearChange(event: Event) {
    const selectedYear = (event.target as HTMLSelectElement).value;
    fromYear.set(Number(selectedYear));
    // Automatically set toYear to the next year
    toYear.set(Number(selectedYear) + 1);
  }

  function addSlab() {
    const currentSlabs = $slabs;
    const lastSlab = currentSlabs[currentSlabs.length - 1];
    const newFromAmount = lastSlab.toAmount ? lastSlab.toAmount + 1 : 0;

    slabs.update((s) => [
      ...s,
      { fromAmount: newFromAmount, toAmount: null, taxRate: 0 },
    ]);
    validateSlabs();
  }

  function removeSlab(index: number) {
    slabs.update((s) => s.filter((_, i) => i !== index));
    validateSlabs();
  }

  function handleSubmit() {
    if (validateSlabs()) {
      const formData: TaxSlab = {
        regime: $regime,
        financialYear: {
          from: $fromYear,
          to: $toYear,
          value: `${$fromYear}-${$toYear}`,
        },
        slabs: $slabs,
        cessRate: $cessRate,
        standardDeduction: $standardDeduction,
        isActive: $isActive,
      };
      dispatch("submit", formData);
    }
  }
</script>

<div class="bg-white rounded-lg shadow-sm">
  <div class="border-b border-gray-200 px-6 py-4">
    <h2 class="text-lg font-semibold text-gray-900">Tax Slab Configuration</h2>
  </div>

  <div class="p-6">
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <!-- Basic Configuration -->
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-2">
          <label for="regime" class="block text-sm font-medium text-gray-700"
            >Tax Regime</label
          >
          <select
            id="regime"
            bind:value={$regime}
            class="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={readOnly}
          >
            {#each taxRegime as regimeOption}
              <option value={regimeOption.value}>{regimeOption.label}</option>
            {/each}
          </select>
        </div>

        {#if !initialData}
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <label
                for="fromYear"
                class="block text-sm font-medium text-gray-700">From Year</label
              >
              <select
                id="fromYear"
                bind:value={$fromYear}
                on:change={handleFromYearChange}
                class="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={readOnly}
              >
                {#each yearOptions as year}
                  <option value={year}>{year}</option>
                {/each}
              </select>
            </div>
            <div class="space-y-2">
              <label
                for="toYear"
                class="block text-sm font-medium text-gray-700">To Year</label
              >
              <input
                id="toYear"
                bind:value={$toYear}
                disabled
                class="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        {:else}
          <div class="space-y-2">
            <label
              for="financialYear"
              class="block text-sm font-medium text-gray-700"
              >Financial Year</label
            >
            <input
              type="text"
              id="financialYear"
              value={initialData.financialYear.value}
              class="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50"
              readonly
            />
          </div>
        {/if}

        <div class="space-y-2">
          <label for="cessRate" class="block text-sm font-medium text-gray-700"
            >Cess Rate (%)</label
          >
          <input
            type="number"
            id="cessRate"
            bind:value={$cessRate}
            min="0"
            class="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
            disabled={readOnly}
          />
        </div>

        <div class="space-y-2">
          <label
            for="standardDeduction"
            class="block text-sm font-medium text-gray-700"
            >Standard Deduction</label
          >
          <input
            type="number"
            id="standardDeduction"
            bind:value={$standardDeduction}
            min="0"
            class="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
            disabled={readOnly}
          />
        </div>
      </div>

      <!-- Tax Slabs -->
      <div class="space-y-4 mt-8">
        <div class="flex justify-between items-center">
          <h3 class="text-base font-medium text-gray-900">Tax Slabs</h3>
          {#if !readOnly}
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              on:click={addSlab}
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Slab
            </button>
          {/if}
        </div>

        <div class="space-y-4">
          {#each $slabs as slab, index}
            <div
              class="relative bg-gray-50 rounded-lg border border-gray-200 p-6"
            >
              <div class="grid grid-cols-10 gap-4 items-center">
                <!-- From Amount -->
                <div class="col-span-3 min-h-[65px] flex flex-col">
                  <label class="block text-sm font-medium text-gray-700">
                    From Amount (₹)
                  </label>
                  <input
                    type="number"
                    bind:value={slab.fromAmount}
                    min="0"
                    class="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={readOnly}
                  />
                  {#if formErrors.slabs[index]?.fromAmount}
                    <p class="text-red-500 text-xs mt-1">
                      {formErrors.slabs[index].fromAmount}
                    </p>
                  {/if}
                </div>

                <!-- To Amount -->
                <div class="col-span-3 min-h-[65px] flex flex-col">
                  <label class="block text-sm font-medium text-gray-700">
                    To Amount (₹)
                    {#if index === $slabs.length - 1}
                      <span class="text-gray-500 text-xs ml-1">(Optional)</span>
                    {/if}
                  </label>
                  <input
                    type="number"
                    bind:value={slab.toAmount}
                    min="0"
                    class="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={readOnly}
                  />
                  {#if formErrors.slabs[index]?.toAmount}
                    <p class="text-red-500 text-xs mt-1">
                      {formErrors.slabs[index].toAmount}
                    </p>
                  {/if}
                </div>

                <!-- Tax Rate -->
                <div class="col-span-3 min-h-[65px] flex flex-col">
                  <label class="block text-sm font-medium text-gray-700">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    bind:value={slab.taxRate}
                    min="0"
                    class="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={readOnly}
                  />
                </div>

                <!-- Remove Button -->
                {#if !readOnly && $slabs.length > 1}
                  <div
                    class="col-span-1 flex items-center justify-center h-full"
                  >
                    <button
                      type="button"
                      class="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-red-500 hover:bg-red-100 focus:outline-none"
                      on:click={() => removeSlab(index)}
                    >
                      x
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            bind:checked={$isActive}
            class="toggle-checkbox"
            disabled={readOnly}
          />
          <span class="text-sm font-medium text-gray-700">Active</span>
        </label>
      </div>

      {#if !readOnly}
        <div class="flex justify-end border-t border-gray-200 pt-4">
          <button
            type="submit"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Configuration
          </button>
        </div>
      {/if}
    </form>
  </div>
</div>

<style>
  /* Any additional custom styles can go here */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }

  .toggle-checkbox {
    appearance: none;
    width: 40px;
    height: 20px;
    background-color: #d1d5db;
    border-radius: 9999px;
    position: relative;
    cursor: pointer;
    outline: none;
    transition: background-color 0.2s;
  }

  .toggle-checkbox:checked {
    background-color: #3b82f6;
  }

  .toggle-checkbox:before {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 9999px;
    transition: transform 0.2s;
  }

  .toggle-checkbox:checked:before {
    transform: translateX(20px);
  }
</style>
