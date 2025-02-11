<script lang="ts">
    import CalendarView from './CalendarView.svelte';
    import DayDetails from './DayDetails.svelte';
    import { attendanceStore } from '$lib/stores/attendance';
    import { derived } from 'svelte/store';
  
    let selectedDate = new Date();
    const attendanceRecords = derived(attendanceStore, ($store) => $store.records);
  
    function handleDateSelect(event:  CustomEvent<Date>) {
      console.log("handleDateSelect", event.detail);
      selectedDate = event.detail;
    }
    $: console.log("AttendanceDashboard selectedDate", selectedDate);

  </script>
  
  <div class="flex flex-col md:flex-row w-full gap-4">
    <div class="w-full md:w-[70%]">
      <CalendarView 
      {selectedDate}
      records={$attendanceRecords}
        on:dateSelect={(event) => handleDateSelect(event)} 
      />
    </div>
    <div class="w-full md:w-[30%]">
      <DayDetails 
        date={selectedDate}
        records={$attendanceRecords}
      />
    </div>
  </div>