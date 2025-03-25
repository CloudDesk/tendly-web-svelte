<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Bankdetails from "./Bankdetails.svelte";
  import Bankdocuments from "./Bankdocuments.svelte";

  export let employeeId: string;
  export let employee: any;

  const dispatch = createEventDispatcher();

  // Constants for toggle button labels
  const BANK_DETAILS = "Bank Details";
  const BANK_DOCUMENTS = "Documents";
  const options = [BANK_DETAILS, BANK_DOCUMENTS];

  let selectedIndex = 0;

  function handleToggle(index: number) {
    selectedIndex = index;
  }

  function handleChildRefresh(event: CustomEvent) {
    // Forward the refresh event to the parent
    dispatch('refresh', event.detail);
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
  {#if selectedIndex === 0}
    <Bankdetails 
      {employeeId} 
      {employee} 
      on:refresh={handleChildRefresh} 
    />
  {:else}
    <Bankdocuments {employeeId} 
    {employee} 
      on:refresh={handleChildRefresh} 
    />
  {/if}
</div>

<style>
  /* .button {
      border: none;
      outline: none;
    } */

  :global(.transition-all) {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }
</style>
