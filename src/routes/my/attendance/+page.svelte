<script lang="ts">
  import ToggleView from '$lib/components/attendance/ToggleView.svelte';
  import CalendarView from '$lib/components/attendance/CalendarView.svelte';
  import ListView from '$lib/components/attendance/ListView.svelte';
  import SwipesTracking from '$lib/components/attendance/SwipesTracking.svelte';
  import AttendanceHeatmap from '$lib/components/attendance/AttendanceHeatmap.svelte';
  import FiltersSearch from '$lib/components/attendance/FiltersSearch.svelte';
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import {  attendanceStore } from '$lib/stores/attendance';
  import { auth } from '$lib/stores/auth';
  import { getMonthStartEnd } from '$lib/utils/date';
  import AttendanceDashboard from '$lib/components/attendance/AttendanceDashboard.svelte';


  const viewMode = writable<'calendar' | 'list' | 'heat'>('calendar');
  const userId: string = $auth.user?._id ?? '';


  // Function to initialize and refresh data
  async function initializeData() {
    const { start, end } = getMonthStartEnd();
    attendanceStore.setFilters({
      startDate: start,
      endDate: end,
      userIds: [userId]
    });
    await attendanceStore.fetch([userId], start, end);
  }

  // Handle successful swipe
  function handleSwipeSuccess() {
    console.log("callback called");
    attendanceStore.refreshCurrentView();
  }

  onMount(() => {
    initializeData();
  });

</script>

<div class="p-6">
  <div class="flex justify-end">
    <ToggleView 
      bind:viewMode={$viewMode} 
      on:viewModeChange={e => viewMode.set(e.detail)} 
    />
  </div>
  <div class="mt-4">
    <SwipesTracking on:swipeSuccess={handleSwipeSuccess} />
  </div>

  <div class="mt-4">
    <FiltersSearch />
  </div>

  <div class="mt-4">
    {#if $viewMode === 'calendar'}
      <AttendanceDashboard />
      {:else if $viewMode ==='list'}
      <ListView />
    {:else}
    <AttendanceHeatmap />
    {/if}
  </div>
</div>

<style>
  .p-6 {
    padding: 1.5rem;
  }
  .mt-4 {
    margin-top: 1rem;
  }
  .text-2xl {
    font-size: 1.5rem;
  }
  .font-bold {
    font-weight: bold;
  }
  .mb-6 {
    margin-bottom: 1.5rem;
  }
</style>