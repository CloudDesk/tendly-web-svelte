<script lang="ts">
  import { holidayCalendarApi } from "$lib/services/api";
  import { Calendar } from "lucide-svelte";
  import { onMount } from "svelte";
  import Loader from "../common/Loader.svelte";

  export let context = "my";

  type UpcomingHoliday = {
    date: string;
    name: string;
    type: "mandatory" | "optional" | "client-specific";
    description?: string | null;
    calendarName?: string;
    roles?: string[];
    calendarNames?: string[];
  };

  // Sample data for demonstrations
  let upcomingHolidays: UpcomingHoliday[] = [];
  let loading = true;
  let error: string | null = null;
  let showAll = false;

  const loadHolidays = async () => {
    try {
      let result: any = await holidayCalendarApi.upcomingHolidays(
        context,
        null
      );
      console.log(result, "Upcoming Holidays");
      if (result.success) {
        upcomingHolidays = result.data || [];
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.log(error, "Error fetching holidays");
      error = "Error fetching holidays";
    } finally {
      loading = false;
    }
  };
  const toggleView = async () => {
    showAll = !showAll;
    if (showAll) {
      let result: any = await holidayCalendarApi.upcomingHolidays(
        context,
        "all"
      );
      if (result.success) {
        upcomingHolidays = result.data || [];
      }
    } else {
      await loadHolidays();
    }
  };

  onMount(() => {
    loadHolidays();
  });
</script>

<div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold text-gray-800 flex items-center">
      <Calendar class="inline mr-2 text-blue-600" size={18} />
      Upcoming Holidays
    </h2>
    <button
      class="text-xs text-blue-600 hover:text-blue-800"
      on:click={toggleView}
    >
      {showAll ? "Show Less" : "View All"}
    </button>
  </div>

  {#if error}
    <div class="alert alert-error">{error}</div>
  {:else if loading}
    <Loader />
  {:else if upcomingHolidays}
    <div class="space-y-3 overflow-y-auto transition-all">
      {#each upcomingHolidays as holiday}
        <div
          class="flex items-center justify-between py-2 border-b border-gray-100"
        >
          <div class="flex items-center">
            <span class="font-medium">{holiday.name}</span>
          </div>
          <span class="text-sm text-gray-500">{holiday.date}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
