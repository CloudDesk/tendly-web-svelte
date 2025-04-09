<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import Calendar from "../common/Calendar.svelte";
  import { ChevronsUpDown, Calendar as CalendarIcon } from "lucide-svelte";

  export let maxRange = 7;
  export let metaData = {};
  export let initialMonth = new Date();
  export let selectedWeekStart = null;
  export let selectedWeekEnd = null;

  let isOpen = false;
  let wrapperElement: HTMLElement;
  const dispatch = createEventDispatcher();

  // Format a date range for display
  $: displayText = getDisplayText(selectedWeekStart, selectedWeekEnd);

  function getDisplayText(start: Date | null, end: Date | null): string {
    if (!start || !end) return "Select Date Range";

    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    const startStr = start.toLocaleDateString("en-US", options);
    const endStr = end.toLocaleDateString("en-US", options);

    return `${startStr} - ${endStr}`;
  }

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

<div
  bind:this={wrapperElement}
  class="calendar-wrapper relative w-full max-w-xs"
>
  <!-- Button to toggle the calendar -->
  <button
    on:click|stopPropagation={toggleCalendar}
    class="calendar-toggle px-4 py-3 bg-white text-gray-700
       rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400
       flex items-center justify-between w-full transition-all duration-200
       shadow-sm border border-gray-200"
  >
    <span class="flex items-center">
      <CalendarIcon class="w-5 h-5 mr-2 text-blue-500" />
      <span class="font-medium">{displayText}</span>
    </span>
    <ChevronsUpDown class="w-4 h-4 text-gray-400" />
  </button>

  <!-- Calendar popup -->
  {#if isOpen}
    <div
      class="calendar-popup absolute z-30 mt-2 bg-white shadow-xl rounded-lg
      transform transition-all duration-200 opacity-100 scale-100 border border-gray-100"
    >
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
    width: 320px; /* Slightly wider for better layout */
    height: fit-content;
    overflow: hidden; /* Prevent content from affecting size */
    border-radius: 12px;
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .calendar-toggle {
    cursor: pointer;
  }

  .calendar-popup .calendar-container {
    width: 100%;
    height: 100%;
  }
</style>
