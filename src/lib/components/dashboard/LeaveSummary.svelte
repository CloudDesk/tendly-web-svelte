<script lang="ts">
  import { leavesApi } from "$lib/services/api";
  import { Calendar } from "lucide-svelte";
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import Loader from "../common/Loader.svelte";

  let loading = false;
  let fetchError: string | null = null;

  let leaveSummary = {
    annual: 0,
    sick: 0,
    compOff: 0,
    total: 0,
  };

  let upcomingLeaves: { type: string; dates: string; status: string }[] = [];

  const user = $auth.user;

  const dateDisplayOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const formatDateDisplay = (date: Date) =>
    date.toLocaleDateString("en-US", dateDisplayOptions);

  const handleLeaveApplication = () => {
    window.location.href = "/my/leaves";
  };

  const fetchLeaveSummary = async () => {
    loading = true;
    fetchError = null;

    try {
      const result = await leavesApi.getSummary(user?._id ?? "");
      const excludedTypes = ["lossOfPay", "otherPaid", "otherUnpaid"];

      const leaveData = result.data;
      const summary = Object.entries(leaveData || {})
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

      leaveSummary = { ...leaveSummary, ...summary };
    } catch (err) {
      console.error("Error fetching leave summary:", err);
      fetchError = "Error fetching leave summary";
    } finally {
      loading = false;
    }
  };

  const fetchUpcomingLeaves = async () => {
    loading = true;
    fetchError = null;

    try {
      const params = {
        userId: user?._id,
        startDate: formatDate(new Date()),
        endDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      };

      const result = await leavesApi.list(params);

      if (result.success && Array.isArray(result.data)) {
        upcomingLeaves = result.data.map((leave: any) => {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          const sameDay = start.getTime() === end.getTime();
          const dateRange = sameDay
            ? formatDateDisplay(start)
            : `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`;

          return {
            type:
              leave.leaveType?.charAt(0).toUpperCase() +
                leave.leaveType?.slice(1) || "Unknown",
            dates: dateRange,
            status: leave.status,
          };
        });
      } else {
        fetchError = "No leaves found";
      }
    } catch (err) {
      console.error("Error fetching upcoming leaves:", err);
      fetchError = "Error fetching leaves";
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    fetchLeaveSummary();
    fetchUpcomingLeaves();
  });
</script>

<div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold text-gray-800 flex items-center">
      <Calendar class="inline mr-2 text-blue-600" size={18} />
      Leave Summary
    </h2>
    <button
      class="text-xs text-blue-600 hover:text-blue-800"
      on:click={handleLeaveApplication}
    >
      Apply Leave
    </button>
  </div>
  {#if fetchError}
    <div class="alert alert-error">{fetchError}</div>
  {:else if loading}
    <Loader />
  {:else}
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
  {/if}
</div>
