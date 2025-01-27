<script lang="ts">
    import { writable } from 'svelte/store';
    import ActiveSalaryStructure from './ActiveSalaryStructure.svelte';
    import SalaryStructureHistory from './SalaryStructureHistory.svelte';
   
    export let employeeId: string;

    // Reactive variable to handle the toggle state
    const showActive = writable(true);
  
    // Function to toggle the state
    const toggleView = () => {
      showActive.update(value => !value);
    };
  </script>
  
  <div class="container mx-auto p-6 ">
    <div class="flex justify-end items-center mb-4">
      <!-- <h2 class="text-xl font-semibold">Salary Structure</h2> -->
      <button class="btn btn-toggle" on:click={toggleView}>
        {#if $showActive}
          Show History
        {:else}
          Show Active
        {/if}
      </button>
    </div>
    {#if $showActive}
      <ActiveSalaryStructure  {employeeId}/>
    {:else}
      <SalaryStructureHistory {employeeId}/>
    {/if}
  </div>
  
  <style>
    .btn {
      @apply inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors;
    }
    .btn-toggle {
      @apply bg-blue-500 text-white hover:bg-blue-600;
    }
  </style>