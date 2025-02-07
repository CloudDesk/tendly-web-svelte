<script lang="ts">
  import ToggleView from '$lib/components/attendance/ToggleView.svelte';
  import CalendarView from '$lib/components/attendance/CalendarView.svelte';
  import ListView from '$lib/components/attendance/ListView.svelte';
  import SwipesTracking from '$lib/components/attendance/SwipesTracking.svelte';
  import AttendanceHeatmap from '$lib/components/attendance/AttendanceHeatmap.svelte';
  import FiltersSearch from '$lib/components/attendance/FiltersSearch.svelte';
  import { writable } from 'svelte/store';

  const viewMode = writable<'calendar' | 'list'>('calendar'); 

</script>

<div class="p-6">
  <div class="flex justify-end">
    <ToggleView 
      bind:viewMode={$viewMode} 
      on:viewModeChange={e => viewMode.set(e.detail)} 
    />
  </div>
  <div class="mt-4">
    <SwipesTracking />
  </div>

  <div class="mt-4">
    <FiltersSearch />
  </div>

  <div class="mt-4">
    {#if $viewMode === 'calendar'}
      <CalendarView />
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