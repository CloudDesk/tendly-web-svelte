<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import { timesheetApi, type Timesheet } from "$lib/services/api";
  import CalendarWrapper from "$lib/components/timesheet/CalendarWrapper.svelte";
  import TimesheetEntries from "$lib/components/timesheet/TimesheetEntries.svelte";
  import { toast } from "$lib/components/common/stores/toast.store";
  import {
    Clock,
    Calendar,
    ArrowLeft,
    ArrowRight,
    Briefcase,
  } from "lucide-svelte";
  import Modal from "$lib/components/common/Modal.svelte";
  import TimesheetExport from "$lib/components/timesheet/TimesheetExport.svelte";

  $: employeeId = $auth.user?._id || "";
  let selectedWeekStart = new Date();
  selectedWeekStart.setDate(
    selectedWeekStart.getDate() - selectedWeekStart.getDay() + 1
  );
  let selectedWeekEnd = new Date(selectedWeekStart);
  selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 6);

  let entries: any[] = [];
  let isLoading = false;
  let isSubmitting = false;
  let error = "";
  let success = false;
  let weekRange = "";
  let isExporting = false;

  let meta: { [key: string]: { hours: number } } = {};
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  onMount(async () => {
    initializeWeek();
    updateWeekRange();
    await fetchTimesheetData();
  });

  function getDaysInRange(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end
  }

  function initializeWeek() {
    entries = [];
    const startDate = new Date(selectedWeekStart);
    const daysInRange = getDaysInRange(selectedWeekStart, selectedWeekEnd);
    for (let i = 0; i < daysInRange; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // Adjust for Monday start
      entries.push({
        day: days[dayIndex],
        date,
        entries: [{ project: "", task: "", description: "", duration: 0 }],
      });
    }
  }

  function updateWeekRange() {
    const format = (d: Date) =>
      `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
    weekRange = `${format(selectedWeekStart)} - ${format(selectedWeekEnd)}`;
  }

  async function fetchTimesheetData() {
    isLoading = true;
    try {
      const response: any = await timesheetApi.getbyDate(
        employeeId,
        selectedWeekStart.toISOString().split("T")[0],
        selectedWeekEnd.toISOString().split("T")[0]
      );
      console.log(response.data);
      if (response.success && response.data) {
        const daysInRange = getDaysInRange(selectedWeekStart, selectedWeekEnd);
        entries = Array(daysInRange)
          .fill(null)
          .map((_, i) => {
            const date = new Date(selectedWeekStart);
            date.setDate(selectedWeekStart.getDate() + i);
            const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
            const entry = response.data.find(
              (e: { dateUTC: string }) =>
                new Date(e.dateUTC).toDateString() === date.toDateString()
            );

            return {
              day: days[dayIndex],
              date,
              entries: entry?.entries.length
                ? entry.entries
                : [{ project: "", task: "", description: "", duration: 0 }],
            };
          });

        // Update meta data if available
        response.data.forEach((entry: Timesheet) => {
          const date = new Date(entry.dateUTC);
          const dateKey = date.toISOString().split("T")[0];
          meta[dateKey] = { hours: entry.totalDuration ?? 0 };
        });
      } else {
        initializeWeek();
      }
    } catch (err) {
      console.error("Error fetching timesheet:", err);
      error = "Failed to load timesheet data.";
    } finally {
      isLoading = false;
    }
  }

  function handleMonthChange(event: CustomEvent) {
    const { year, month } = event.detail;
    const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
    selectedWeekStart = new Date(firstDayOfMonth);
    selectedWeekStart.setDate(
      selectedWeekStart.getDate() - selectedWeekStart.getDay() + 1
    );
    selectedWeekEnd = new Date(selectedWeekStart);
    selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 6);

    initializeWeek();
    updateWeekRange();
    fetchTimesheetData();
  }

  function handleRangeSelect(event: CustomEvent) {
    const { startDate, endDate } = event.detail;
    selectedWeekStart = new Date(startDate);
    selectedWeekEnd = new Date(endDate);

    initializeWeek();
    updateWeekRange();
    fetchTimesheetData();
  }

  function navigateWeek(direction: "prev" | "next") {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() + (direction === "next" ? 7 : -7));
    selectedWeekStart = newStart;

    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + 6);
    selectedWeekEnd = newEnd;

    updateWeekRange();
    initializeWeek();
    fetchTimesheetData();
  }

  async function handleSubmit() {
    const payload = entries
      .map((day) => {
        return {
          employeeId,
          dateUTC: new Date(day.date.toISOString().split("T")[0]),
          entries: day.entries.filter(
            (entry: any) => entry.duration > 0 && entry.project.trim() !== ""
          ),
        };
      })
      .filter((day) => day.entries.length > 0);

    isSubmitting = true;
    success = false;
    error = "";

    try {
      for (const dayPayload of payload) {
        await timesheetApi.submit(dayPayload);
      }
      toast.success("Timesheet submitted successfully!");
      await fetchTimesheetData();
    } catch (err) {
      console.error("Error submitting timesheet:", err);
      toast.error("Error submitting timesheet. Please try again.");
    } finally {
      isSubmitting = false;
    }
  }

  function calculateTotalHours() {
    return entries
      .reduce((total, day) => {
        return (
          total +
          day.entries.reduce((dayTotal: number, entry: any) => {
            return dayTotal + (parseFloat(entry.duration) || 0);
          }, 0)
        );
      }, 0)
      .toFixed(1);
  }

  const handleExport = () => {
    isExporting = true;
  };
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-6xl mx-auto py-8 px-4 sm:px-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Timesheet</h1>
      <p class="text-gray-600 mt-1">Track and submit your working hours</p>
    </div>

    <!-- Header Control Panel -->
    <div class="bg-white rounded-xl shadow-sm mb-6 p-4">
      <div
        class="flex flex-col md:flex-row md:justify-between md:items-center gap-4"
      >
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center">
            <button
              on:click={() => navigateWeek("prev")}
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label="Previous week"
            >
              <ArrowLeft size={18} />
            </button>

            <div class="flex items-center mx-2 px-4 py-2 bg-gray-50 rounded-lg">
              <Calendar size={18} class="text-blue-600 mr-2" />
              <span class="font-medium text-gray-800">{weekRange}</span>
            </div>

            <button
              on:click={() => navigateWeek("next")}
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label="Next week"
            >
              <ArrowRight size={18} />
            </button>
          </div>

          <div class="ml-0 md:ml-2">
            <CalendarWrapper
              maxRange={7}
              initialMonth={new Date()}
              metaData={meta}
              {selectedWeekStart}
              {selectedWeekEnd}
              on:rangeSelect={handleRangeSelect}
              on:monthChange={handleMonthChange}
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            class="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg"
          >
            <!-- <Clock size={18} class="mr-2" />
            <span class="font-medium"
              >{calculateTotalHours()} hrs this week</span
            > -->
            <button on:click={handleExport}>Export</button>
          </div>

          {#if employeeId}
            <div class="flex items-center px-4 py-2 bg-gray-50 rounded-lg">
              <Briefcase size={18} class="text-gray-500 mr-2" />
              <span class="text-sm text-gray-600 truncate max-w-xs"
                >ID: {employeeId}</span
              >
            </div>
          {:else}
            <div class="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm">
              Please log in to submit
            </div>
          {/if}
        </div>
      </div>
    </div>

    {#if error}
      <div
        class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 animate-fade-in"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <!-- Error icon could be added here -->
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    {#if success}
      <div
        class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-6 animate-fade-in"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <!-- Success icon could be added here -->
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">Timesheet saved successfully!</p>
          </div>
        </div>
      </div>
    {/if}

    {#if isLoading}
      <div class="flex items-center justify-center p-12">
        <div class="relative w-16 h-16">
          <div
            class="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"
          ></div>
          <div
            class="absolute top-0 left-0 w-full h-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"
          ></div>
        </div>
      </div>
    {:else}
      <TimesheetEntries {entries} on:submit={handleSubmit} />
    {/if}
  </div>
  {#if isExporting}
    <Modal
      title="Export Timesheet"
      show={isExporting}
      onClose={() => (isExporting = false)}
    >
      <TimesheetExport />
    </Modal>
  {/if}
</div>
