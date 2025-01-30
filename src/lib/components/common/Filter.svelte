<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import { X, Check } from 'lucide-svelte';
  import type { LeaveFilterSchema } from '$lib/types';

  export let filters: LeaveFilterSchema[] = [];
  export let values: Record<string, any> = {};
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  // Keep track of temporary values while filter panel is open
  let tempValues: Record<string, any> = { ...values };

  // Update temp values when parent values change
  $: {
    if (!isOpen) {
      tempValues = { ...values };
    }
  }


  function handleFilterChange(key: string, value: any) {
    tempValues = { ...tempValues, [key]: value };
    dispatch('change', { values: tempValues });
  }

  function handleSelectChange(event: Event, key: string) {
    const target = event.target as HTMLSelectElement;
    handleFilterChange(key, target.value);
  }

  function handleInputChange(event: Event, key: string) {
    const target = event.target as HTMLInputElement;
    handleFilterChange(key, target.value);
  }

  function handleCheckboxChange(key: string, value: string) {
      let currentValues = Array.isArray(tempValues[key]) ? [...tempValues[key]] : [];

      if (currentValues.includes(value)) {
        currentValues = currentValues.filter(v => v !== value);
      } else {
        currentValues = [...currentValues, value];
      }

      handleFilterChange(key, currentValues);
  }

  function handleApply() {
    dispatch('apply', tempValues);
  }

  function handleReset() {
    tempValues = {};
    dispatch('reset');
  }

  function handleClose() {
    // Revert to original values if closing without applying
     tempValues = { ...values };
     dispatch('change', { values: tempValues });
    isOpen = false;
    dispatch('close');
  }

  function isChecked(key: string, value: string | number): boolean {
  if (!Array.isArray(tempValues[key])) return false;
  return tempValues[key].includes(value.toString());
}

function getSelectedCount(key: string): number {
  return Array.isArray(tempValues[key]) ? tempValues[key].length : 0;
}
</script>

<div 
  class="filter-panel fixed right-0 top-0 h-screen w-96 bg-white shadow-xl z-50"
  class:hidden={!isOpen}
  transition:slide={{ duration: 300, axis: 'x' }}
>
  <header class="flex items-center justify-between p-6 border-b border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900">Filters</h3>
    <button 
      class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
      on:click={handleClose}
    >
      <X class="w-5 h-5 text-gray-500 hover:text-gray-700" />
    </button>
  </header>

  <div class="filters-content p-6 space-y-6 overflow-y-auto" style="height: calc(100vh - 160px)">
    {#each filters as filter}
      <div class="filter-item">
        <div class="mb-3 flex justify-between items-center">
          <div>
            <label class="text-sm font-medium text-gray-700">
              {filter.label}
            </label>
            {#if filter.description}
              <p class="text-xs text-gray-400 mt-1">{filter.description}</p>
            {/if}
          </div>
          {#if filter.type === 'checkbox' && getSelectedCount(filter.key) > 0}
            <span class="text-xs font-medium text-blue-600">
              {getSelectedCount(filter.key)} selected
            </span>
          {/if}
        </div>
        
        {#if filter.type === 'select'}
          <div class="relative">
            <select
              class="w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
                     py-2.5 pl-3 pr-10 text-sm text-gray-700 transition-all duration-200"
              value={tempValues[filter.key] || ''}
              on:change={(e) => handleSelectChange(e, filter.key)}
            >
              <option value="">All</option>
              {#each filter.options || [] as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg class="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
              </svg>
            </div>
          </div>

        {:else if filter.type === 'checkbox'}
          <div class="space-y-2 max-h-48 overflow-y-auto pr-2">
            {#each filter.options || [] as option}
              <label 
                class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer
                       transition-colors duration-200 ease-in-out"
              >
                <div class="relative flex items-center">
                  <input
                    type="checkbox"
                    class="hidden"
                    value={option.value}
                    checked={isChecked(filter.key, option.value)}
                    on:change={() => handleCheckboxChange(filter.key, option.value.toString())}
                  />
                  <div 
                    class={`w-5 h-5 border rounded transition-colors duration-200 ease-in-out
                      flex items-center justify-center
                      ${isChecked(filter.key, option.value) 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300 bg-white hover:border-blue-400'}`}
                  >
                    {#if isChecked(filter.key, option.value)}
                      <Check class="w-3.5 h-3.5 text-white" />
                    {/if}
                  </div>
                </div>
                <span class="text-sm text-gray-700 select-none">{option.label}</span>
              </label>
            {/each}
          </div>
          {#if getSelectedCount(filter.key) > 0}
            <button
              class="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              on:click={() => {
                tempValues = { ...tempValues, [filter.key]: [] };
                dispatch('change', { tempValues });
              }}
            >
              Clear selection ({getSelectedCount(filter.key)})
            </button>
          {/if}

        {:else if filter.type === 'date'}
          <input
            type="date"
            class="w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
                   py-2.5 px-3 text-sm text-gray-700 transition-all duration-200"
            value={tempValues[filter.key] || ''}
            on:change={(e) => handleInputChange(e, filter.key)}
          />

        {:else if filter.type === 'text'}
          <input
            type="text"
            class="w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 
                   py-2.5 px-3 text-sm text-gray-700 placeholder-gray-400 transition-all duration-200"
            placeholder={`Search ${filter.label.toLowerCase()}...`}
            value={tempValues[filter.key] || ''}
            on:input={(e) => handleInputChange(e, filter.key)}
          />
        {/if}
      </div>
    {/each}
  </div>

  <footer class="absolute bottom-0 left-0 w-full p-4 bg-gray-50 border-t border-gray-200">
    <div class="flex justify-between gap-4">
      <button
        class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 
               rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
               transition-all duration-200"
        on:click={handleReset}
      >
        Reset
      </button>
      <button
        class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent 
               rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
               transition-all duration-200"
        on:click={handleApply}
      >
        Apply Filters
      </button>
    </div>
  </footer>
</div>

{#if isOpen}
  <div 
    class="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm z-40"
    on:click={handleClose}
  ></div>
{/if}

<style>
  /* Custom scrollbar for checkbox list */
  .space-y-2::-webkit-scrollbar {
    width: 6px;
  }

  .space-y-2::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .space-y-2::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  .space-y-2::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>