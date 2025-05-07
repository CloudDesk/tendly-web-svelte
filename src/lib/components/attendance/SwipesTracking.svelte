<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { writable } from "svelte/store";
  import { attendanceApi } from "$lib/services/api";
  import { auth } from "$lib/stores/auth";
  import { toast } from "../common/stores/toast.store";
  import { format } from "date-fns";

  const dispatch = createEventDispatcher();
  const currentTime = writable(new Date());
  const isLoading = writable<boolean>(false);
  const biometricId = $auth.user?.biometricId || "";
  const userId = $auth.user?._id || "";

  let record: any;
  let showCheckIn = true;
  let showCheckOut = false;
  let error = { isShow: false, message: "" };
  let workingHours = { start: "09:00", end: "18:00" };
  let attendanceHistory: { date: string; checkIn: string; checkOut: string; status: string }[] = [];

  function updateButtonStates(attendance: any) {
    console.log("updateButtonStates", attendance);
    const swipesCount = attendance?.swipes?.length || 0;
    const outOfWindowSwipes = attendance?.outOfWindowSwipes?.length || 0;

    // Allow check-in/check-out based on swipe count, ignoring out-of-window status
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

    // Show warning for out-of-window swipes but don't block actions
    if (outOfWindowSwipes >= 1) {
      error.isShow = true;
      error.message = `Swipe recorded outside window: ${attendance.outOfWindowSwipes[0].reason}. Regularization required.`;
    } else {
      error.isShow = false;
      error.message = "";
    }

    record = attendance;
  }

  async function handleSwipe(swipeType: "check-in" | "check-out") {
    isLoading.set(true);
    try {
      const response = await attendanceApi.swipe({ biometricId });
      if (response.success) {
        const time = format(new Date(), "hh:mm a");
        toast.success(
          `${swipeType === "check-in" ? "Check-in" : "Check-out"} recorded at ${time} ✅`
        );
        await getAttendanceData();
      } else {
        toast.error(response.message || "Failed to record swipe ❌");
      }
    } catch (error) {
      console.error("Swipe error:", error);
      toast.error("Failed to record swipe ❌");
    } finally {
      isLoading.set(false);
    }
  }

  function handleContactHR() {
    console.log("Contacting HR for regularization");
    // Add logic to contact HR or open regularization form
  }

  async function getAttendanceData() {
    try {
      let currentDate = new Date();
      let result: any = await attendanceApi.search({
        userIds: [userId],
        startDate: currentDate.toISOString(),
        endDate: currentDate.toISOString(),
      });
      console.log(result, "result");
      if (result.data && result.data[0] && result.data[0].records[0]) {
        updateButtonStates(result.data[0].records[0]);
        
        // Mock data for attendance history - in production, replace with API call
        attendanceHistory = [
          { date: format(new Date(currentDate.setDate(currentDate.getDate() - 1)), 'yyyy-MM-dd'), checkIn: '09:05 AM', checkOut: '06:12 PM', status: 'Present' },
          { date: format(new Date(currentDate.setDate(currentDate.getDate() - 1)), 'yyyy-MM-dd'), checkIn: '08:58 AM', checkOut: '06:03 PM', status: 'Present' },
          { date: format(new Date(currentDate.setDate(currentDate.getDate() - 1)), 'yyyy-MM-dd'), checkIn: '09:12 AM', checkOut: '06:20 PM', status: 'Present' },
        ];
      }
    } catch (error) {
      console.log(error, "error");
    }
  }

  onMount(() => {
    const interval = setInterval(() => currentTime.set(new Date()), 1000);
    getAttendanceData();
    return () => clearInterval(interval);
  });

  // Format the current time for display
  $: formattedTime = format($currentTime, 'hh:mm:ss a');
  $: formattedDate = format($currentTime, 'EEEE, MMMM dd, yyyy');
  
  // Calculate if current time is outside working hours (for display purposes only)
  $: {
    const now = $currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeValue = hours * 60 + minutes;
    
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    
    const startTimeValue = startHour * 60 + startMinute;
    const endTimeValue = endHour * 60 + endMinute;
    
    // If current time is before start time or after end time
    const isOutsideWorkingHours = currentTimeValue < startTimeValue || currentTimeValue > endTimeValue;
  }
  
  // Format check-in time if available
  $: checkInTime = record?.swipes?.length > 0 ? format(new Date(record.swipes[0].timestamp), 'hh:mm a') : '--:--';
  
  // Format check-out time if available
  $: checkOutTime = record?.swipes?.length > 1 ? format(new Date(record.swipes[1].timestamp), 'hh:mm a') : '--:--';
</script>

<div class="attendance-tracker">
  <!-- Time Display Card -->
  <div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg p-6 mb-6">
    <div class="flex flex-col md:flex-row items-center justify-between">
      <div class="flex items-center mb-4 md:mb-0">
        <div class="p-3 bg-white/20 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-4">
          <h3 class="text-sm font-medium opacity-90">{formattedDate}</h3>
          <div class="text-3xl font-bold">{formattedTime}</div>
        </div>
      </div>
      
      <div class="flex flex-wrap justify-center gap-3">
        <button
          class="px-6 py-2.5 bg-white text-indigo-700 font-semibold rounded-lg shadow transition-all duration-300 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          on:click={() => handleSwipe("check-in")}
          disabled={$isLoading || !showCheckIn}
        > 
          {#if $isLoading && showCheckIn}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {/if}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Check In
        </button>

        <button
          class="px-6 py-2.5 bg-white text-green-600 font-semibold rounded-lg shadow transition-all duration-300 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          on:click={() => handleSwipe("check-out")}
          disabled={$isLoading || !showCheckOut}
        >
          {#if $isLoading && showCheckOut}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {/if}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Check Out
        </button>
      </div>
    </div>
  </div>

  {#if error.isShow}
    <div class="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-lg shadow-sm">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M10 2C5.58 2 1.5 6.08 1.5 11v.01C1.5 15.41 5.59 19.5 10 19.5s8.5-4.09 8.5-8.49V11c0-4.42-4.08-8.5-8.5-8.5zm0 .01C14.42 2.01 18.5 6.09 18.5 10.5c0 4.41-4.09 8.5-8.5 8.5S1.5 14.91 1.5 10.5C1.5 6.09 5.58 2.01 10 2.01z" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{error.message}</p>
          <!-- <div class="mt-2">
            <button
              class="inline-flex items-center px-3 py-1.5 border border-yellow-500 text-xs font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              on:click={handleContactHR}
            >
              Contact HR for Regularization
            </button>
          </div> -->
        </div>
      </div>
    </div>
  {/if}

  <!-- Attendance Details Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <!-- Working Hours Card -->
    <div class="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
      <h3 class="text-sm font-medium text-gray-500 mb-2">Working Hours</h3>
      <div class="flex justify-between items-center">
        <div class="text-center">
          <div class="text-xs text-gray-500">Start</div>
          <div class="text-lg font-semibold text-gray-800">{workingHours.start} AM</div>
        </div>
        <div class="h-0.5 flex-1 bg-gray-100 mx-2 relative">
          <div class="absolute -top-1 left-0 right-0 flex justify-between">
            <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-500">End</div>
          <div class="text-lg font-semibold text-gray-800">{workingHours.end} PM</div>
        </div>
      </div>
    </div>
    
    <!-- Check-in Card -->
    <div class="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
      <h3 class="text-sm font-medium text-gray-500 mb-2">Check-in</h3>
      <div class="flex items-center">
        <div class="p-2 rounded-md bg-blue-100 text-blue-600 mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        </div>
        <div>
          <div class="text-xl font-bold text-gray-800">{checkInTime}</div>
          <div class="text-xs text-gray-500">{record?.swipes?.length > 0 ? 'Recorded' : 'Not recorded yet'}</div>
        </div>
      </div>
    </div>
    
    <!-- Check-out Card -->
    <div class="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
      <h3 class="text-sm font-medium text-gray-500 mb-2">Check-out</h3>
      <div class="flex items-center">
        <div class="p-2 rounded-md bg-green-100 text-green-600 mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <div>
          <div class="text-xl font-bold text-gray-800">{checkOutTime}</div>
          <div class="text-xs text-gray-500">{record?.swipes?.length > 1 ? 'Recorded' : 'Not recorded yet'}</div>
        </div>
      </div>
    </div>
  </div>
</div>