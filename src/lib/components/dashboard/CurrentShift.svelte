<script lang="ts">
  import { shiftsApi } from "$lib/services/api";
  import { Clock, Info } from "lucide-svelte";
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";

  $: user = $auth.user;

  // Shift model
  interface ShiftDetails {
    name: string;
    startTime: string;
    endTime: string;
  }

  let shift: ShiftDetails | null = null;
  let shiftStatus: string = "";
  let error: string | null = null;
  let loading = false;

  const formatTime = (timeStr: string) => {
    const [hour, minute] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const fetchCurrentShift = async () => {
    loading = true;
    error = null;
    try {
      if (!user?._id) {
        throw new Error("User ID is undefined");
      }
      const response = await shiftsApi.current(user._id);
      console.log(response, "response.data");
      if (response.success && response.data?.shiftId) {
        const shiftInfo = response.data.shiftId;

        shift = {
          name: shiftInfo.name,
          startTime: formatTime(shiftInfo.startTime),
          endTime: formatTime(shiftInfo.endTime),
        };

        shiftStatus = response.data.status ?? "";
      } else {
        error = "No active shift assigned.";
      }
    } catch (err) {
      console.error("Error fetching current shift:", err);
      error = "Failed to load shift details.";
    } finally {
      loading = false;
    }
  };

  onMount(fetchCurrentShift);
</script>

<div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold text-gray-800 flex items-center">
      <Clock class="inline mr-2 text-blue-600" size={18} />
      Current Shift
    </h2>
    <button class="text-xs text-blue-600 hover:text-blue-800 flex items-center">
      <Info size={14} class="mr-1" />
      Request Change
    </button>
  </div>

  {#if loading}
    <div class="text-sm text-gray-500 italic">Loading shift info...</div>
  {:else if error}
    <div class="text-sm text-red-500 italic">{error}</div>
  {:else if shift}
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-md">
      <div class="text-center">
        <h3 class="text-lg font-semibold text-blue-800">{shift.name}</h3>
        <div class="flex justify-center items-center mt-2 text-gray-700">
          <Clock class="mr-2" size={16} />
          <span>{shift.startTime} - {shift.endTime}</span>
        </div>
        {#if shiftStatus}
          <div class="text-sm text-gray-600 mt-1 capitalize">
            Status: {shiftStatus}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
