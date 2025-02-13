<script lang="ts">
  import ToggleView from '$lib/components/attendance/ToggleView.svelte';
  import ListView from '$lib/components/attendance/ListView.svelte';
  import SwipesTracking from '$lib/components/attendance/SwipesTracking.svelte';
  import AttendanceHeatmap from '$lib/components/attendance/AttendanceHeatmap.svelte';
  import FiltersSearch from '$lib/components/attendance/FiltersSearch.svelte';
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { getMonthStartEnd } from '$lib/utils/date';
  import AttendanceDashboard from '$lib/components/attendance/AttendanceDashboard.svelte';
  import { attendanceApi } from '$lib/services/api';
  import type { AttendanceRecord } from '$lib/types';
  import Loader from '$lib/components/common/Loader.svelte';


  const viewMode = writable<'calendar' | 'list' | 'heat'>('calendar');
  const userId: string = $auth.user?._id ?? '';
  const attendanceRecords = writable<AttendanceRecord[]>([]);
  const isLoading = writable(false);


  // Function to initialize and refresh data
  async function initializeData() {
    console.log("Fetching attendance data");
    const { start, end } = getMonthStartEnd();
    isLoading.set(true);
    try {
      const response = await attendanceApi.search({ userIds: [userId], startDate: start, endDate: end });
      console.log(response.data,"response.data");
      if (response.data.length > 0) {
       
        const userRecords: AttendanceRecord[] = response.data[0].records.map((record: any) => ({
                        ...record,
                        // Ensure consistent date format
                        shiftDay: new Date(record.shiftDay).toISOString()
                    }));
        attendanceRecords.set(userRecords);
      } else {
        attendanceRecords.set([]);
      }
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
      attendanceRecords.set([]);
    } finally {
      isLoading.set(false);
    }
  }

  // Handle successful swipe
  function handleSwipeSuccess() {
    console.log("callback called");
    initializeData();
  }

 async  function handleMonthChange(event: CustomEvent<{year: number, month: number}>) {
    console.log("Month Changed in Parent:", event.detail);
    const { year, month } = event.detail;
    // Do something with year and month

    const { start, end } = getMonthStartEnd(year, month);
    isLoading.set(true);
    try {
      const response = await attendanceApi.search({ userIds: [userId], startDate: start, endDate: end });
      console.log(response.data,"response.data");
      if (response.data.length > 0) {
       
        const userRecords: AttendanceRecord[] = response.data[0].records.map((record: any) => ({
                        ...record,
                        // Ensure consistent date format
                        shiftDay: new Date(record.shiftDay).toISOString()
                    }));
        attendanceRecords.set(userRecords);
      } else {
        attendanceRecords.set([]);
      }
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
      attendanceRecords.set([]);
    } finally {
      isLoading.set(false);
    }

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
    <FiltersSearch />
  </div>

  <div class="mt-4">
    {#if $viewMode === 'calendar'}
      <AttendanceDashboard 
      bind:attendanceRecords={$attendanceRecords}
      bind:isLoading={$isLoading}
      on:refresh={initializeData}
      on:monthChange={handleMonthChange}
      />
      {:else if $viewMode ==='list'}
      <ListView/>
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