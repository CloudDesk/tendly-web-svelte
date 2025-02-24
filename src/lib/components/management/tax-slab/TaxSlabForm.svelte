<script lang="ts">
  import { taxRegime } from "$lib/constants/users";
  import { createEventDispatcher } from "svelte";
  import { derived, writable } from "svelte/store";
  import type { TaxSlab } from "$lib/types/taxSlab";
  import { CircleX, Plus } from "lucide-svelte";

  export let initialData: TaxSlab | null = null;
  export let readOnly: boolean = false;

  const dispatch = createEventDispatcher();

  // Get current year and create year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const regime = writable(initialData?.regime || "old");
  const fromYear = writable(
    initialData
      ? parseInt(initialData.financialYear.split("-")[0])
      : currentYear
  );
  const toYear = writable(
    initialData
      ? parseInt(initialData.financialYear.split("-")[1])
      : currentYear + 1
  );
  type TaxSlabItem = {
    fromAmount: number;
    toAmount?: number | null;
    taxRate: number;
  };

  const slabs = writable<TaxSlabItem[]>(
    initialData?.slabs && initialData.slabs.length > 0
      ? initialData.slabs
      : [{ fromAmount: 0, toAmount: null, taxRate: 0 }]
  );
  const cessRate = writable(initialData?.cessRate || 0);
  const standardDeduction = writable(initialData?.standardDeduction || 0);
  const isActive = writable(initialData?.isActive || false);

  // New store for tracking focused slab
  const focusedSlabIndex = writable<number | null>(null);

  // Reactive validation store
  const formErrors = derived(slabs, ($slabs) => {
    const errors: Record<string, string>[] = Array($slabs.length).fill({});

    $slabs.forEach((slab, index) => {
      const error: Record<string, string> = {};

      // Validate fromAmount
      if (slab.fromAmount < 0) {
        error.fromAmount = "Amount cannot be negative";
      }

      // Validate previous slab connection
      if (index > 0) {
        const prevSlab = $slabs[index - 1];
        if (
          prevSlab.toAmount !== null &&
          prevSlab.toAmount !== null &&
          prevSlab.toAmount !== undefined &&
          slab.fromAmount !== prevSlab.toAmount + 1
        ) {
          error.fromAmount = "Must be previous To Amount + 1";
        }
      }

      // Validate toAmount
      if (slab.toAmount !== null) {
        if (slab.toAmount !== undefined && slab.toAmount < 0) {
          error.toAmount = "Amount cannot be negative";
        }
        if (slab.toAmount !== undefined && slab.toAmount <= slab.fromAmount) {
          error.toAmount = "Must be greater than From Amount";
        }
      }

      // Validate last slab toAmount requirement
      if (index !== $slabs.length - 1 && slab.toAmount === null) {
        error.toAmount = "To Amount is required";
      }

      // Validate taxRate
      if (slab.taxRate < 0) {
        error.taxRate = "Tax rate cannot be negative";
      }

      errors[index] = error;
    });

    return errors;
  });

  // Auto-update fromAmount when previous toAmount changes
  function updateFromAmount(index: number, toAmount: number | null) {
    if (toAmount !== null && index < $slabs.length - 1) {
      slabs.update((s: TaxSlabItem[]) => {
        const updatedSlabs = [...s];
        updatedSlabs[index + 1].fromAmount = toAmount + 1;
        return updatedSlabs;
      });
    }
  }

  function handleFromYearChange(event: Event) {
    const selectedYear = (event.target as HTMLSelectElement).value;
    fromYear.set(Number(selectedYear));
    toYear.set(Number(selectedYear) + 1);
  }

  function addSlab() {
    const currentSlabs = $slabs;
    const lastSlab = currentSlabs[currentSlabs.length - 1];
    const newFromAmount = lastSlab.toAmount ? lastSlab.toAmount + 1 : 0;

    slabs.update((s: TaxSlabItem[]) => [
      ...s,
      { fromAmount: newFromAmount, toAmount: null, taxRate: 0 },
    ]);
  }

  function removeSlab(index: number) {
    slabs.update((s: TaxSlabItem[]) =>
      s.filter((_: unknown, i: number) => i !== index)
    );
  }

  function handleSubmit() {
    const errors = $formErrors;
    const hasErrors = errors.some((error) => Object.keys(error).length > 0);

    if (!hasErrors) {
      const formData: TaxSlab = {
        regime: $regime,
        financialYear: `${$fromYear}-${$toYear}`,
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
              value={initialData.financialYear}
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
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-base font-medium text-gray-900">Tax Slabs</h3>
          {#if !readOnly}
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              on:click={addSlab}
            >
              <Plus class="w-4 h-4 mr-2 text-white" />
              Add Slab
            </button>
          {/if}
        </div>

        <div class="space-y-4">
          {#each $slabs as slab, index}
            <div
              class="relative bg-gray-50 rounded-lg border {$focusedSlabIndex ===
              index
                ? 'border-blue-500 ring-1 ring-blue-500'
                : 'border-gray-200'} p-6"
              on:focus={() => focusedSlabIndex.set(index)}
              on:blur={() => focusedSlabIndex.set(null)}
            >
              <div class="grid grid-cols-10 gap-4">
                <!-- From Amount -->
                <div class="col-span-3 space-y-2">
                  <label
                    for="fromAmount-{index}"
                    class="block text-sm font-medium text-gray-700"
                  >
                    From Amount (₹)
                  </label>
                  <input
                    type="number"
                    id="fromAmount-{index}"
                    bind:value={slab.fromAmount}
                    min="0"
                    class="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={readOnly || index > 0}
                  />
                  {#if $formErrors[index]?.fromAmount}
                    <p class="text-red-500 text-xs mt-1">
                      {$formErrors[index].fromAmount}
                    </p>
                  {/if}
                </div>

                <!-- To Amount -->
                <div class="col-span-3 space-y-2">
                  <label
                    for="toAmount-{index}"
                    class="block text-sm font-medium text-gray-700"
                  >
                    To Amount (₹)
                    {#if index === $slabs.length - 1}
                      <span class="text-gray-500 text-xs ml-1">(Optional)</span>
                    {/if}
                  </label>
                  <input
                    type="number"
                    id="toAmount-{index}"
                    bind:value={slab.toAmount}
                    on:input={() =>
                      updateFromAmount(index, slab.toAmount ?? null)}
                    min={slab.fromAmount + 1}
                    class="w-full h-10 rounded-md border {$formErrors[index]
                      ?.toAmount
                      ? 'border-red-500'
                      : 'border-gray-300'} px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={readOnly}
                  />
                  {#if $formErrors[index]?.toAmount}
                    <p class="text-red-500 text-xs mt-1">
                      {$formErrors[index].toAmount}
                    </p>
                  {/if}
                </div>

                <!-- Tax Rate -->
                <div class="col-span-3 space-y-2">
                  <label
                    for="taxRate-{index}"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Tax Rate (%)
                  </label>
                  <input
                    id="taxRate-{index}"
                    type="number"
                    bind:value={slab.taxRate}
                    min="0"
                    class="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={readOnly}
                  />
                  {#if $formErrors[index]?.taxRate}
                    <p class="text-red-500 text-xs mt-1">
                      {$formErrors[index].taxRate}
                    </p>
                  {/if}
                </div>

                <!-- Remove Button -->
                {#if !readOnly && $slabs.length > 1}
                  <div class="col-start-10 flex items-center justify-center">
                    <button
                      type="button"
                      class="flex items-center justify-center w-8 h-8 rounded-full {$focusedSlabIndex ===
                      index
                        ? 'bg-red-200'
                        : 'bg-red-100'} hover:bg-red-200 text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      on:click={() => removeSlab(index)}
                    >
                      <CircleX />
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
    appearance: textfield;
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
