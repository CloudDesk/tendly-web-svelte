<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { attendanceApi } from '$lib/services/api';
  import { auth } from '$lib/stores/auth';
  import { toUTCDateTime } from '$lib/utils/date';

  // State
  const currentTime = writable(new Date());
  const isLoading = writable<boolean>(false);
  const biometricId = $auth.user?.biometricId || '';
  const userId = $auth.user?._id || '';

  // Reactive states for attendance
  let record: any = null;
  let showCheckIn = true;
  let showCheckOut = false;
  let swipesCount = 0;

  // Methods
  function updateTime() {
    currentTime.set(new Date());
  }

  function updateButtonStates(swipes: any[] = []) {
    swipesCount = swipes?.length || 0;
    
    // Always allow check-in if no swipes exist
    if (swipesCount === 0) {
      showCheckIn = true;
      showCheckOut = false;
    } else if (swipesCount === 1) {
      showCheckIn = false;
      showCheckOut = true;
    } else {
      showCheckIn = false;
      showCheckOut = false;
    }

    console.log('Button States Updated:', { showCheckIn, showCheckOut, swipesCount });
  }

  async function fetchAttendanceRecords() {
    try {
      const startDate = toUTCDateTime(new Date().toISOString());
      const endDate = toUTCDateTime(new Date().toISOString());
      console.log('Fetching records for:', { startDate, endDate });

      const response = await attendanceApi.search({ 
        userIds: [userId], 
        startDate, 
        endDate 
      });

      console.log('API Response:', response);

      // If we have records and today's record exists
      if (response.data.length > 0 && response.data[0].records.length > 0) {
        const userRecords = response.data[0].records;
        const todayRecord = startDate ? 
          userRecords.find(record => 
            record.shiftDay.split('T')[0] === startDate.split('T')[0]
          ) : null;

        console.log('Today\'s Record:', todayRecord);

        if (todayRecord && todayRecord.swipes) {
          record = todayRecord;
          updateButtonStates(todayRecord.swipes);
        } else {
          // No record for today - enable check-in
          record = null;
          showCheckIn = true;
          showCheckOut = false;
          swipesCount = 0;
        }
      } else {
        // No records found - enable check-in
        record = null;
        showCheckIn = true;
        showCheckOut = false;
        swipesCount = 0;
      }
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
      // On error, enable check-in as default state
      record = null;
      showCheckIn = true;
      showCheckOut = false;
      swipesCount = 0;
    }
  }

  async function handleSwipe() {
    isLoading.set(true);

    try {
      const response = await attendanceApi.swipe({ biometricId });
      console.log('Swipe Response:', response);

      if (response.success) {
        // Refresh records after successful swipe
        await fetchAttendanceRecords();
      }
    } catch (error) {
      console.error('Swipe error:', error);
    } finally {
      isLoading.set(false);
    }
  }

  // Initialize real-time clock and fetch attendance records
  onMount(() => {
    const interval = setInterval(updateTime, 1000);
    fetchAttendanceRecords();
    return () => clearInterval(interval);
  });
</script>

<div class="swipes-tracking">
  <div class="live-clock">
    <p>{$currentTime.toLocaleTimeString()}</p>
  </div>

  <div class="swipe-buttons">
    <button 
      class="btn" 
      on:click={handleSwipe} 
      disabled={$isLoading || !showCheckIn}>
      Check In
    </button>
    <button 
      class="btn" 
      on:click={handleSwipe} 
      disabled={$isLoading || !showCheckOut}>
      Check Out
    </button>
  </div>

  <div class="status">
    {#if swipesCount > 0}
      <p>Total Swipes Today: {swipesCount}</p>
    {/if}
  </div>
</div>

<style>
  .swipes-tracking {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .live-clock {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }

  .swipe-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    cursor: pointer;
    background-color: #0073ea;
    color: white;
    border-radius: 4px;
    transition: background-color 0.3s;
  }

  .btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .btn:hover:enabled {
    background-color: #005bb5;
  }

  .status {
    text-align: center;
  }
</style>