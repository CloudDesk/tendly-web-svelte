<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { attendanceApi } from '$lib/services/api';
  import { auth } from '$lib/stores/auth';
  import { attendanceStore, todayRecord } from '$lib/stores/attendance';
  import { toast } from '../common/stores/toast.store';
  import { format } from 'date-fns';
  import { getMonthStartEnd } from '$lib/utils/date';

  // State
  const dispatch = createEventDispatcher();
  const currentTime = writable(new Date());
  const isLoading = writable<boolean>(false);
  const biometricId = $auth.user?.biometricId || '';
  const userId = $auth.user?._id || '';

  let showCheckIn = true;
  let showCheckOut = false;
  let error = { isShow: false, message: '' };

  // Methods
  function updateTime() {
    currentTime.set(new Date());
  }

  function updateButtonStates(attendance: any) {
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
        dispatch('swipeSuccess');
        const { start, end } = getMonthStartEnd();
        await attendanceStore.fetch([userId], start, end);
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

  // Update button states whenever today's record changes
  $: if ($todayRecord) {
    updateButtonStates($todayRecord);
  }

  onMount(() => {
    const interval = setInterval(() => currentTime.set(new Date()), 1000);
    return () => clearInterval(interval);
  });
</script>

<div class="swipes-tracking">
  <div class="live-clock">
    <p>{$currentTime.toLocaleTimeString()}</p>
  </div>

  {#if error.isShow}
    <div class="error-message">
      <p>{error.message}</p>
      <button class="btn contact-hr" on:click={handleContactHR}>Contact HR for Regularization</button>
    </div>
  {/if}

  <div class="swipe-buttons">
    <button class="btn" on:click={() => handleSwipe('check-in')} disabled={$isLoading || !showCheckIn}>Check In</button>
    <button class="btn" on:click={() => handleSwipe('check-out')} disabled={$isLoading || !showCheckOut}>Check Out</button>
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