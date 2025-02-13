<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { attendanceApi } from '$lib/services/api';
  import { auth } from '$lib/stores/auth';
  import { toast } from '../common/stores/toast.store';
  import { format } from 'date-fns';

  const dispatch = createEventDispatcher();
  const currentTime = writable(new Date());
  const isLoading = writable<boolean>(false);
  const biometricId = $auth.user?.biometricId || '';
  const userId = $auth.user?._id || '';

  let record
  let showCheckIn = true;
  let showCheckOut = false;
  let error = { isShow: false, message: '' };

  function updateButtonStates(attendance: any) {
    console.log("updateButtonStates",attendance)
    const swipesCount = attendance?.swipes?.length || 0;
    const outOfWindowSwipes = attendance?.outOfWindowSwipes?.length || 0;

    if (outOfWindowSwipes >= 1) {
      showCheckIn = false;
      showCheckOut = false;
      error.isShow = true;
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
  }

  async function handleSwipe(swipeType: 'check-in' | 'check-out') {
    isLoading.set(true);
    try {
      const response = await attendanceApi.swipe({ biometricId });
      if (response.success) {
        const time = format(new Date(), 'hh:mm a');
        toast.success(`${swipeType === 'check-in' ? 'Check-in' : 'Check-out'} recorded at ${time} ✅`);
        // dispatch('swipeSuccess');
        await getAttendanceData();
      } else {
        toast.error('Swipe not allowed! Please check shift timings ❌');
      }
    } catch (error) {
      console.error('Swipe error:', error);
      toast.error('Failed to record swipe ❌');
    } finally {
      isLoading.set(false);
    }
  }

  function handleContactHR() {
    console.log('Contacting HR for regularization');
  }

  async function getAttendanceData() {
    try{
     let currentDate = new Date()
     let result = await attendanceApi.search({userIds: [userId], startDate: currentDate.toISOString(), endDate: currentDate.toISOString()});
      console.log(result,"result");
      updateButtonStates(result.data[0].records[0]);
    }catch(error){
console.log(error,"error")
    }  
}

  onMount(() => {
    const interval = setInterval(() => currentTime.set(new Date()), 1000);
    getAttendanceData();
    return () => clearInterval(interval);
  });
</script>

<div class="flex flex-col items-center bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
  <div class="text-3xl font-bold text-gray-800 mb-4">
    {$currentTime.toLocaleTimeString()}
  </div>

  {#if error.isShow}
    <div class="bg-red-100 border border-red-400 text-red-700 rounded-lg p-4 mb-4 text-center">
      <p class="font-semibold">{error.message}</p>
      <button 
        class="mt-2 inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-red-500"
        on:click={handleContactHR}>
        Contact HR for Regularization
      </button>
    </div>
  {/if}

  <div class="flex gap-4 mt-4">
    <button 
      class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      on:click={() => handleSwipe('check-in')} 
      disabled={$isLoading || !showCheckIn}>
      Check In
    </button>

    <button 
      class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      on:click={() => handleSwipe('check-out')} 
      disabled={$isLoading || !showCheckOut}>
      Check Out
    </button>
  </div>
</div>
