<script lang="ts">
  import SwipesTracking from "$lib/components/attendance/SwipesTracking.svelte";
  import Resignation from "$lib/components/employee/resignation/Resignation.svelte";
  import { leavesApi } from "$lib/services/api";
  import {
    Calendar,
    FileText,
    BellRing,
    LogOut,
    Clock,
    CreditCard,
    Gauge,
    Info,
    UserMinus,
  } from "lucide-svelte";
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";

  $: user = $auth.user;

  // Sample data for demonstrations
  const upcomingHolidays = [
    { date: "May 1, 2025", name: "Labor Day" },
    { date: "May 26, 2025", name: "Memorial Day" },
    { date: "June 19, 2025", name: "Juneteenth" },
  ];

  const payslipInfo = {
    latest: "March 2025",
    basic: "$4,500",
    hra: "$1,500",
    bonus: "$800",
    total: "$6,800",
  };

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

  let leaveSummary = {
    annual: 0,
    sick: 0,
    compOff: 0,
    total: 0,
  };
  const upcomingLeaves = [
    { type: "Casual", dates: "May 2-3, 2025", status: "Approved" },
  ];

  const currentShift = {
    name: "Regular Day Shift",
    timing: "9:00 AM - 6:00 PM",
    days: "Monday - Friday",
  };
  let loading = false;

  const getLeaveSummary = async () => {
    loading = true;
    try {
      let result = await leavesApi.getSummary(user?._id ?? "");
      console.log(result, "Result");
      const excludedTypes = ["lossOfPay", "otherPaid", "otherUnpaid"];
      const leaveData = result.data;

      const remainingSummary = Object.entries(leaveData || {})
        .filter(
          ([key]) =>
            !excludedTypes.includes(key) && key !== "userId" && key !== "year"
        )
        .reduce(
          (acc, [key, value]: [string, any]) => {
            acc[key] = value.remaining;
            acc.total = (acc.total || 0) + value.remaining;
            return acc;
          },
          {} as Record<string, number>
        );

      console.log(remainingSummary, "Filtered Remaining Summary");
      leaveSummary = { ...leaveSummary, ...remainingSummary };
    } catch (error) {
      console.error("Error fetching leave summary:", error);
    } finally {
      loading = false;
    }
  };
  onMount(() => {
    //get Leave summary
    getLeaveSummary();
  });
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
    <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center">
          <Calendar class="inline mr-2 text-blue-600" size={18} />
          Upcoming Holidays
        </h2>
        <button class="text-xs text-blue-600 hover:text-blue-800"
          >View All</button
        >
      </div>
      <div class="space-y-3">
        {#each upcomingHolidays as holiday}
          <div
            class="flex items-center justify-between py-2 border-b border-gray-100"
          >
            <div class="flex items-center">
              <!-- <div class="bg-blue-50 text-blue-600 p-2 rounded-md mr-3">
                <Calendar size={16} />
              </div> -->
              <span class="font-medium">{holiday.name}</span>
            </div>
            <span class="text-sm text-gray-500">{holiday.date}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Payslip Summary -->
    <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center">
          <CreditCard class="inline mr-2 text-blue-600" size={18} />
          Payslip Summary
        </h2>
        <span class="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded"
          >Latest: {payslipInfo.latest}</span
        >
      </div>

      <div
        class="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-md mb-4"
      >
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Basic:</span>
            <span class="font-medium">{payslipInfo.basic}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">HRA:</span>
            <span class="font-medium">{payslipInfo.hra}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Bonus:</span>
            <span class="font-medium">{payslipInfo.bonus}</span>
          </div>
          <div class="flex justify-between font-semibold">
            <span>Total:</span>
            <span>{payslipInfo.total}</span>
          </div>
        </div>
      </div>

      <div class="flex space-x-2">
        <button
          class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm flex items-center justify-center"
        >
          <FileText size={16} class="mr-1" />
          Download
        </button>
        <button
          class="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-3 rounded-md text-sm"
        >
          Salary History
        </button>
      </div>
    </div>

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
    <div
      class="bg-white rounded-lg shadow-sm overflow-hidden border p-4 border-gray-100"
    >
      <h2 class="text-lg font-semibold text-gray-800 flex items-center">
        <UserMinus class="inline mr-2 text-blue-600" size={18} />
        Resignation Hub
      </h2>
      <Resignation />
    </div>

    <!-- Leave Summary -->
    <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center">
          <Calendar class="inline mr-2 text-blue-600" size={18} />
          Leave Summary
        </h2>
        <button
          class="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-xs flex items-center"
        >
          Apply Leave
        </button>
      </div>

      <div class="grid grid-cols-4 gap-2 mb-4">
        <div class="bg-blue-50 p-2 rounded text-center">
          <div class="text-lg font-bold text-blue-700">
            {leaveSummary.annual}
          </div>
          <div class="text-xs text-gray-600">Annual</div>
        </div>
        <div class="bg-green-50 p-2 rounded text-center">
          <div class="text-lg font-bold text-green-700">
            {leaveSummary.sick}
          </div>
          <div class="text-xs text-gray-600">Sick</div>
        </div>
        <div class="bg-purple-50 p-2 rounded text-center">
          <div class="text-lg font-bold text-purple-700">
            {leaveSummary.compOff}
          </div>
          <div class="text-xs text-gray-600">Comp-Off</div>
        </div>
        <div class="bg-gray-50 p-2 rounded text-center">
          <div class="text-lg font-bold text-gray-700">
            {leaveSummary.total}
          </div>
          <div class="text-xs text-gray-600">Total</div>
        </div>
      </div>

      {#if upcomingLeaves.length > 0}
        <div class="text-sm">
          <div class="font-medium mb-2">Upcoming Leaves:</div>
          {#each upcomingLeaves as leave}
            <div class="flex items-center justify-between py-1">
              <div>
                <span class="text-gray-800">{leave.dates}</span>
                <span
                  class="text-xs ml-2 bg-blue-100 text-blue-800 py-0.5 px-1.5 rounded"
                  >{leave.type}</span
                >
              </div>
              <span class="text-xs text-green-600 font-medium"
                >{leave.status}</span
              >
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-sm text-gray-500 italic">No upcoming leaves</div>
      {/if}
    </div>

    <!-- Current Shift Details -->
    <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-800 flex items-center">
          <Clock class="inline mr-2 text-blue-600" size={18} />
          Current Shift
        </h2>
        <button
          class="text-xs text-blue-600 hover:text-blue-800 flex items-center"
        >
          <Info size={14} class="mr-1" />
          Request Change
        </button>
      </div>

      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-md">
        <div class="text-center">
          <h3 class="text-lg font-semibold text-blue-800">
            {currentShift.name}
          </h3>
          <div class="flex justify-center items-center mt-2 text-gray-700">
            <Clock class="mr-2" size={16} />
            <span>{currentShift.timing}</span>
          </div>
          <div class="text-sm text-gray-600 mt-1">{currentShift.days}</div>
        </div>
      </div>
    </div>
  </div>
</div>
