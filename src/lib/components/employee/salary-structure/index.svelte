<script lang="ts">
    import { writable } from 'svelte/store';
    import ActiveSalaryStructure from './ActiveSalaryStructure.svelte';
    import SalaryStructureHistory from './SalaryStructureHistory.svelte';
  
    export let employeeId: string;
  
    // Constants for toggle button labels
    const SHOW_HISTORY = "Show History";
    const SHOW_ACTIVE = "Show Active";
    const options = [SHOW_ACTIVE, SHOW_HISTORY];
    
    // Reactive variables to handle the toggle state
    const showActive = writable(true);
    let selectedIndex = 0;  // Make sure this updates with the toggle
  
    function handleToggle(index: number) {
        console.log(index, "handleToggle");
        selectedIndex = index;  // Update the selectedIndex
        showActive.set(index === 0);
    }
</script>
  
<div class="container mx-auto p-6">
    <div class="flex justify-end items-center mb-4">
        <div class="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            {#each options as option, index}
              <button
                on:click={() => handleToggle(index)}
                class="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out
                  {selectedIndex === index 
                    ? 'bg-[#e0effe] text-blue-900' 
                    : 'text-gray-500 hover:text-gray-700'}"
              >
                {option}
              </button>
            {/each}
        </div>
    </div>
    {#if $showActive}
      <ActiveSalaryStructure {employeeId} />
    {:else}
      <SalaryStructureHistory {employeeId} />
    {/if}
</div>
  
<style>
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        transition: background-color 0.2s;
    }
  
    .button {
        border: none;
        outline: none;
    }
  
    :global(.transition-all) {
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 200ms;
    }
</style>