<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import Calendar from "../common/Calendar.svelte";
  import { ChevronsUpDown } from "lucide-svelte";

  export let maxRange = 7;
  export let metaData = {};
  export let initialMonth = new Date();
  export let selectedWeekStart = null;
  export let selectedWeekEnd = null;

  let isOpen = false;
  let wrapperElement: HTMLElement;
  const dispatch = createEventDispatcher();

  function toggleCalendar() {
    isOpen = !isOpen;
  }

  function handleRangeSelect(event: CustomEvent) {
    isOpen = false; // Close the calendar after range selection
    dispatch("rangeSelect", event.detail);
  }

  function handleMonthChange(event: CustomEvent) {
    dispatch("monthChange", event.detail);
  }

  function handleClickOutside(event: MouseEvent) {
    if (wrapperElement && !wrapperElement.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener("click", handleClickOutside);
  });
</script>

<div bind:this={wrapperElement} class="calendar-wrapper relative">
  <!-- Button to toggle the calendar -->
  <button
    on:click|stopPropagation={toggleCalendar}
    class="calendar-toggle px-4 py-2 bg-gray-200 text-gray-800
       rounded hover:bg-gray-300 focus:outline-none flex items-center
       justify-between w-full"
  >
    <span>Select Date Range</span>
    <ChevronsUpDown />
  </button>

  <!-- Calendar popup -->
  {#if isOpen}
    <div class="calendar-popup absolute z-10 mt-2 bg-white shadow-lg rounded">
      <Calendar
        {maxRange}
        {metaData}
        {initialMonth}
        {selectedWeekStart}
        {selectedWeekEnd}
        on:rangeSelect={handleRangeSelect}
        on:monthChange={handleMonthChange}
      />
    </div>
  {/if}
</div>

<style>
  .calendar-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  .calendar-popup {
    position: absolute;
    top: 100%; /* Ensure the popup appears below the button */
    left: 0;
    width: 300px; /* Fixed width for consistency */
    height: fit-content;
    overflow: hidden; /* Prevent content from affecting size */
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .calendar-toggle {
    cursor: pointer;
  }

  .calendar-popup .calendar-container {
    width: 100%;
    height: 100%;
  }
</style>
