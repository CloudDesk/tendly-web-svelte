<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { attendanceApi } from '$lib/services/api';
  import { auth } from '$lib/stores/auth';
  import { attendanceStore, fetchAttendanceRecords } from '$lib/stores/attendance';
  
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
  let outOfWindowSwipes = 0;

  let error = { ishow: false, message: '' };

  // Methods
  function updateTime() {
    currentTime.set(new Date());
  }

  function updateButtonStates(attendance: any) {
    console.log("updateButtonStates", attendance);
    outOfWindowSwipes = attendance.outOfWindowSwipes?.length || 0;
    swipesCount = attendance.swipes?.length || 0;
    console.log(outOfWindowSwipes, "outOfWindowSwipes");

    if (outOfWindowSwipes >= 1) {
      showCheckIn = false;
      showCheckOut = false;
      error.ishow = true;
      error.message = attendance.outOfWindowSwipes[0].reason;
    } else if (swipesCount === 0) {
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

  $: {
    const { records } = $attendanceStore;
    console.log(record,"inside record");
    if (records.length > 0) {
      const todayRecord = records.find(record => record.shiftDay.split('T')[0] === new Date().toISOString().split('T')[0]);
     console.log(todayRecord,"todayRecord");
      if (todayRecord) {
        record = todayRecord;
        updateButtonStates(todayRecord);
      } else {
        record = null;
        showCheckIn = true;
        showCheckOut = false;
        swipesCount = 0;
      }
    }
  }

  // async function fetchAttendanceData() {
  //   try {
  //     const startDate = toUTCDateTime(new Date().toISOString());
  //     const endDate = toUTCDateTime(new Date().toISOString());
  //     console.log('Fetching records for:', { startDate, endDate });

  //     const response = await attendanceApi.search({ 
  //       userIds: [userId], 
  //       startDate, 
  //       endDate 
  //     });

  //     console.log('API Response:', response);

  //     if (response.data.length > 0 && response.data[0].records.length > 0) {
  //       const userRecords = response.data[0].records;
  //       const todayRecord = startDate ? 
  //         userRecords.find(record => 
  //           record.shiftDay.split('T')[0] === startDate.split('T')[0]
  //         ) : null;

  //       console.log('Today\'s Record:', todayRecord);

  //       if (todayRecord) {
  //         record = todayRecord;
  //         updateButtonStates(todayRecord);
  //       } else {
  //         record = null;
  //         showCheckIn = true;
  //         showCheckOut = false;
  //         swipesCount = 0;
  //       }
  //     } else {
  //       record = null;
  //       showCheckIn = true;
  //       showCheckOut = false;
  //       swipesCount = 0;
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch attendance records:', error);
  //     record = null;
  //     showCheckIn = true;
  //     showCheckOut = false;
  //     swipesCount = 0;
  //   }
  // }

  async function handleSwipe() {
    isLoading.set(true);
    try {
      const response = await attendanceApi.swipe({ biometricId });
      console.log('Swipe Response:', response);
      await fetchAttendanceRecords([userId], new Date().toISOString(), new Date().toISOString());
    } catch (error) {
      console.error('Swipe error:', error);
    } finally {
      isLoading.set(false);
    }
  }

  function handleContactHR() {
    // Implement HR contact functionality here
    console.log('Contacting HR for regularization');
  }


</script>

<div class="swipes-tracking">
  <div class="live-clock">
    <p>{$currentTime.toLocaleTimeString()}</p>
  </div>

  {#if error.ishow}
    <div class="error-message">
      <p>{error.message}</p>
      <button 
        class="btn contact-hr" 
        on:click={handleContactHR}>
        Contact HR for Regularization
      </button>
    </div>
  {/if}

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

  .error-message {
    margin: 1rem 0;
    padding: 1rem;
    border-radius: 4px;
    background-color: #fff2f2;
    border: 1px solid #ffcdd2;
    text-align: center;
  }

  .error-message p {
    color: #d32f2f;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .contact-hr {
    background-color: #d32f2f;
  }

  .contact-hr:hover {
    background-color: #b71c1c;
  }

  .status {
    text-align: center;
  }
</style>