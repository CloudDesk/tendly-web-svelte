<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import { timesheetApi } from "$lib/services/api/timesheet";
  import Calendar from "$lib/components/common/Calendar.svelte";
  import { fromUTCDate } from "$lib/utils/date";

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
  let notificationTimeout: ReturnType<typeof setTimeout>;

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  $: dayTotals = entries.map((day) =>
    day.entries.reduce(
      (sum: number, entry: any) => sum + (parseFloat(entry.duration) || 0),
      0
    )
  );
  $: dayErrors = dayTotals.map((total) => total > 9);
  $: hasErrors = dayErrors.some((err) => err);
  $: totalHours = dayTotals.reduce((sum, val) => sum + val, 0);

  onMount(async () => {
    initializeWeek();
    updateWeekRange();
    await fetchTimesheetData();
  });

  function getDaysInRange(start: Date, end: Date): number {
    console.log("daysInRange", start, end);
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
    console.log(selectedWeekStart, selectedWeekEnd, "selectedWeekStart");
    //2025-05-01
    try {
      const response = await timesheetApi.getbyDate(
        employeeId,
        selectedWeekStart.toISOString().split("T")[0],
        selectedWeekEnd.toISOString().split("T")[0]
      );
      console.log(response, "response");
      if (response && response.length) {
        const daysInRange = getDaysInRange(selectedWeekStart, selectedWeekEnd);
        console.log(daysInRange, "daysInRange");
        entries = Array(daysInRange)
          .fill(null)
          .map((_, i) => {
            const date = new Date(selectedWeekStart);
            date.setDate(selectedWeekStart.getDate() + i);
            const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
            const entry = response.find(
              (e) => new Date(e.dateUTC).toDateString() === date.toDateString()
            );
            console.log(entry, "entry");
            return {
              day: days[dayIndex],
              date,
              entries: entry?.entries.length
                ? entry.entries
                : [{ project: "", task: "", description: "", duration: 0 }],
            };
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

  function updateEntry(
    dayIndex: number,
    entryIndex: number,
    field: string,
    value: any
  ) {
    entries[dayIndex].entries[entryIndex][field] = value;
    entries = [...entries];
  }

  function addEntry(dayIndex: number) {
    entries[dayIndex].entries.push({
      project: "",
      task: "",
      description: "",
      duration: 0,
    });
    entries = [...entries];
  }

  function removeEntry(dayIndex: number, entryIndex: number) {
    if (entries[dayIndex].entries.length > 1) {
      entries[dayIndex].entries.splice(entryIndex, 1);
      entries = [...entries];
    }
  }

  function showNotification(message: string, isError = false) {
    if (notificationTimeout) clearTimeout(notificationTimeout);
    error = isError ? message : "";
    success = !isError;
    notificationTimeout = setTimeout(() => {
      error = "";
      success = false;
    }, 5000);
  }

  async function handleSubmit() {
    console.log("first");
    const payload = entries
      .map((day) => ({
        employeeId,
        dateUTC: new Date(day.date.toISOString().split("T")[0]),
        entries: day.entries.filter(
          (entry: any) => entry.duration > 0 && entry.project.trim() !== ""
        ),
      }))
      .filter((day) => day.entries.length > 0);

    isSubmitting = true;
    success = false;
    error = "";

    try {
      for (const dayPayload of payload) {
        await timesheetApi.submit(dayPayload);
      }
      showNotification("Timesheet submitted successfully!");
      await fetchTimesheetData();
    } catch (err) {
      showNotification("Error submitting timesheet. Please try again.", true);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-100 p-4">
  <div class="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center">
        <Calendar
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
      {#each entries as day, dayIndex}
        <div class="mb-6 bg-gray-50 rounded p-4">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-medium text-lg">
              {day.day} ({day.date.toLocaleDateString()})
            </h3>
            <div class="flex items-center">
              <span class="font-medium mr-2"
                >Day Total: {dayTotals[dayIndex]} hrs</span
              >
              {#if dayErrors[dayIndex]}
                <span class="text-red-600 text-sm">Exceeds 9-hour limit!</span>
              {/if}
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200 rounded">
              <thead>
                <tr class="bg-gray-100">
                  <th
                    class="py-2 px-3 text-left text-sm font-medium text-gray-700 w-1/5"
                    >Project<span class="text-red-500">*</span></th
                  >
                  <th
                    class="py-2 px-3 text-left text-sm font-medium text-gray-700 w-1/5"
                    >Task</th
                  >
                  <th
                    class="py-2 px-3 text-left text-sm font-medium text-gray-700 w-2/5"
                    >Description</th
                  >
                  <th
                    class="py-2 px-3 text-left text-sm font-medium text-gray-700 w-1/5"
                    >Hours<span class="text-red-500">*</span></th
                  >
                  <th
                    class="py-2 px-1 text-left text-sm font-medium text-gray-700 w-12"
                  ></th>
                </tr>
              </thead>
              <tbody>
                {#each day.entries as entry, entryIndex}
                  <tr class={entryIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td class="py-2 px-2">
                      <input
                        type="text"
                        placeholder="Project name"
                        value={entry.project}
                        on:input={(e) =>
                          updateEntry(
                            dayIndex,
                            entryIndex,
                            "project",
                            e.target.value
                          )}
                        class="w-full border rounded p-1.5 text-sm border-gray-300"
                      />
                    </td>
                    <td class="py-2 px-2">
                      <input
                        type="text"
                        placeholder="Task name"
                        value={entry.task}
                        on:input={(e) =>
                          updateEntry(
                            dayIndex,
                            entryIndex,
                            "task",
                            e.target.value
                          )}
                        class="w-full border rounded p-1.5 text-sm border-gray-300"
                      />
                    </td>
                    <td class="py-2 px-2">
                      <input
                        type="text"
                        placeholder="What did you work on?"
                        value={entry.description}
                        on:input={(e) =>
                          updateEntry(
                            dayIndex,
                            entryIndex,
                            "description",
                            e.target.value
                          )}
                        class="w-full border rounded p-1.5 text-sm"
                      />
                    </td>
                    <td class="py-2 px-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={entry.duration}
                        on:input={(e) =>
                          updateEntry(
                            dayIndex,
                            entryIndex,
                            "duration",
                            parseFloat(e.target.value) || 0
                          )}
                        min="0"
                        max="9"
                        step="0.5"
                        class="w-full border rounded p-1.5 text-sm"
                      />
                    </td>
                    <td class="py-2 px-1 text-center">
                      <button
                        on:click={() => removeEntry(dayIndex, entryIndex)}
                        class="text-red-600 hover:text-red-800 {day.entries
                          .length === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : ''}"
                        disabled={day.entries.length === 1}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="5" class="py-2 px-3">
                    <button
                      on:click={() => addEntry(dayIndex)}
                      class="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      ➕ Add another entry
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      {/each}

      <div class="mt-6 flex justify-between items-center">
        <div>
          <div class="font-bold">Total Hours: {totalHours}</div>
          <div class="text-sm text-gray-600 mt-1">* Required fields</div>
        </div>
        <div class="flex space-x-3">
          <!-- <button
            class="px-6 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Save Draft
          </button> -->
          <button
            on:click={handleSubmit}
            disabled={isSubmitting || !employeeId || hasErrors}
            class="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
