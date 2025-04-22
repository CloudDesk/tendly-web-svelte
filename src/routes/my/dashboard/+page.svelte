<script lang="ts">
  import SwipesTracking from "$lib/components/attendance/SwipesTracking.svelte";
  import Resignation from "$lib/components/employee/resignation/Resignation.svelte";
  import { BellRing, Gauge } from "lucide-svelte";
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import UpcomingHolidays from "$lib/components/dashboard/UpcomingHolidays.svelte";
  import PayslipSummary from "$lib/components/dashboard/PayslipSummary.svelte";
  import LeaveSummary from "$lib/components/dashboard/LeaveSummary.svelte";
  import CurrentShift from "$lib/components/dashboard/CurrentShift.svelte";

  $: user = $auth.user;

  const announcements = [
    {
      title: "Office Renovation",
      content: "The 3rd floor will be under renovation from May 5-12.",
      date: "Apr 18",
    },
    {
      title: "New Benefits Package",
      content:
        "Updated health benefits package details now available in HR portal.",
      date: "Apr 15",
    },
    {
      title: "Happy Birthday!",
      content: "Wishing Mark Johnson a very happy birthday today!",
      date: "Apr 19",
    },
  ];

  let loading = false;
</script>

<div class="p-4 md:p-6 bg-gray-50 min-h-screen">
  <h1 class="text-2xl font-bold mb-6 text-gray-800 flex items-center">
    <Gauge class="inline mr-2 text-blue-600" size={24} />
    My Dashboard
  </h1>

  <!-- Dashboard Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Attendance Swipes (Existing Component) -->
    <div
      class="col-span-1 md:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100"
    >
      <SwipesTracking />
    </div>

    <!-- Upcoming Holidays -->
    <UpcomingHolidays context="my" />

    <!-- Payslip Summary -->
    <PayslipSummary />

    <!-- Notes / News -->
    <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center">
          <BellRing class="inline mr-2 text-blue-600" size={18} />
          Announcements & News
        </h2>
        <button class="text-xs text-blue-600 hover:text-blue-800"
          >View All</button
        >
      </div>

      <div class="space-y-3">
        {#each announcements as announcement}
          <div class="border-l-4 border-blue-500 pl-3 py-1">
            <div class="flex justify-between">
              <h3 class="font-medium text-gray-800">{announcement.title}</h3>
              <span class="text-xs text-gray-500">{announcement.date}</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{announcement.content}</p>
          </div>
        {/each}
      </div>
    </div>

    <!-- Resignation Status (Existing Component) -->
    <Resignation />

    <!-- Leave Summary -->
    <LeaveSummary />

    <!-- Current Shift Details -->
    <CurrentShift />
  </div>
</div>
