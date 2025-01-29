<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    
    type FilterOption = {
      label: string;
      value: string | number;
    };
    
    type FilterConfig = {
      key: string;
      label: string;
      type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text';
      options?: FilterOption[];
    };
    
    export let filters: FilterConfig[] = [];
    export let values: Record<string, any> = {};
    export let isOpen = false;
    
    const dispatch = createEventDispatcher();
    
    function handleFilterChange(key: string, value: any) {
      values = { ...values, [key]: value };
      dispatch('change', { key, value, values });
    }
    
    function handleApply() {
      dispatch('apply', values);
    }
    
    function handleReset() {
      values = {};
      dispatch('reset');
      dispatch('apply', values);
    }
    
    function handleClose() {
      dispatch('close');
    }
    </script>
    
    <div 
      class="filter-panel fixed right-0 top-0 h-screen w-80 bg-white shadow-lg z-50 p-4"
      class:hidden={!isOpen}
      transition:slide={{ duration: 300, axis: 'x' }}
    >
      <header class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold">Filters</h3>
        <button 
          class="text-gray-500 hover:text-gray-700"
          on:click={handleClose}
        >
          <i class="fas fa-times"></i>
        </button>
      </header>
    
      <div class="filters-content space-y-4">
        {#each filters as filter}
          <div class="filter-item">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            
            {#if filter.type === 'select'}
              <select
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={values[filter.key] || ''}
                on:change={(e) => handleFilterChange(filter.key, e.target.value)}
              >
                <option value="">All</option>
                {#each filter.options || [] as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            {/if}
          </div>
        {/each}
      </div>
    
      <footer class="absolute bottom-0 left-0 w-full p-4 bg-gray-50 border-t">
        <div class="flex justify-between gap-4">
          <button
            class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            on:click={handleReset}
          >
            Reset
          </button>
          <button
            class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            on:click={handleApply}
          >
            Apply
          </button>
        </div>
      </footer>
    </div>
    
    {#if isOpen}
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-40"
        on:click={handleClose}
      ></div>
    {/if}