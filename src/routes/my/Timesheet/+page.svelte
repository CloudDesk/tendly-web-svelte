<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import { timesheetApi, type Timesheet } from "$lib/services/api/timesheet";
  import CalendarWrapper from "$lib/components/timesheet/CalendarWrapper.svelte";
  import TimesheetEntries from "$lib/components/timesheet/TimesheetEntries.svelte";
  import { toast } from "$lib/components/common/stores/toast.store";

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
  console.log(entries, "entries");
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
    console.log("daysInRange", start, end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    console.log(diffTime, "diffTime");
    console.log(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, "diffTime");
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
    console.log(selectedWeekStart, selectedWeekEnd, "selectedWeekStart");
    //2025-05-01
    try {
      const response: any = await timesheetApi.getbyDate(
        employeeId,
        selectedWeekStart.toISOString().split("T")[0],
        selectedWeekEnd.toISOString().split("T")[0]
      );
      console.log(response, "response");
      if (response.success && response.data) {
        const daysInRange = getDaysInRange(selectedWeekStart, selectedWeekEnd);
        console.log(daysInRange, "daysInRange");
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
            console.log(entry, "entry");

            let obj = {
              day: days[dayIndex],
              date,
              entries: entry?.entries.length
                ? entry.entries
                : [{ project: "", task: "", description: "", duration: 0 }],
            };

            console.log(obj, "****************");
            return obj;
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
    console.log(selectedWeekStart, selectedWeekEnd, "handleRangeSelect");
    initializeWeek();
    updateWeekRange();
    fetchTimesheetData();
  }

  async function handleSubmit() {
    console.log("handleSubmit", entries);
    const payload = entries
      .map((day) => {
        console.log(day, "day handleSubmit");
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
    console.log(payload, "payload handleSubmit");

    try {
      for (const dayPayload of payload) {
        await timesheetApi.submit(dayPayload);
      }
      toast.success("Timesheet submitted successfully!");
      await fetchTimesheetData();
    } catch (err) {
      console.log(err, "Error submitting timesheet");
      toast.error("Error submitting timesheet. Please try again.");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-100 p-4">
  <div class="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center">
        <CalendarWrapper
          maxRange={7}
          initialMonth={new Date()}
          metaData={{
            "2025-04-08": { hours: 8 },
            "2025-04-09": { hours: 6.5 },
          }}
          {selectedWeekStart}
          {selectedWeekEnd}
          on:rangeSelect={handleRangeSelect}
          on:monthChange={handleMonthChange}
        />
      </div>
      <div class="font-medium">
        Date Range: {weekRange}
      </div>
    </div>

    {#if employeeId}
      <div class="mb-4 text-sm text-gray-600">
        Employee ID: {employeeId} (automatically assigned from your account)
      </div>
    {:else}
      <div class="mb-4 text-sm text-red-600">
        No employee ID found. Please log in to submit timesheets.
      </div>
    {/if}

    {#if error}
      <div
        class="bg-red-50 border border-red-300 text-red-800 p-3 rounded mb-4"
      >
        {error}
      </div>
    {/if}

    {#if success}
      <div
        class="bg-green-50 border border-green-300 text-green-800 p-3 rounded mb-4"
      >
        Timesheet saved successfully!
      </div>
    {/if}

    {#if isLoading}
      <div class="flex items-center justify-center p-6">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
        ></div>
      </div>
    {:else}
      <TimesheetEntries {entries} on:submit={handleSubmit} />
    {/if}
  </div>
</div>
