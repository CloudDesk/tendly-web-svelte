<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import { timesheetApi } from "$lib/services/api/timesheet";

  $: employeeId = $auth.user?._id || "";

  let selectedWeekStart = new Date();
  selectedWeekStart.setDate(
    selectedWeekStart.getDate() - selectedWeekStart.getDay() + 1
  );

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
  });

  function initializeWeek() {
    entries = days.map((day, index) => {
      const date = new Date(selectedWeekStart);
      date.setDate(date.getDate() + index);

      return {
        day,
        date,
        entries: [
          {
            project: "",
            task: "",
            description: "",
            duration: 0,
          },
        ],
      };
    });
  }

  function updateWeekRange() {
    const end = new Date(selectedWeekStart);
    end.setDate(end.getDate() + 6);
    const format = (d: Date) =>
      `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
    weekRange = `${format(selectedWeekStart)} - ${format(end)}`;
  }

  async function selectWeek(event: any) {
    const value = event.target.value;
    if (value === "next")
      selectedWeekStart.setDate(selectedWeekStart.getDate() + 7);
    else if (value === "prev")
      selectedWeekStart.setDate(selectedWeekStart.getDate() - 7);
    else {
      const today = new Date();
      selectedWeekStart = new Date(today);
      selectedWeekStart.setDate(today.getDate() - today.getDay() + 1);
    }

    selectedWeekStart = new Date(selectedWeekStart);
    initializeWeek();
    updateWeekRange();
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
    console.log(dayIndex, "dayIndexdayIndex");
    entries[dayIndex].entries.push({
      project: "",
      task: "",
      description: "",
      duration: 0,
    });
    entries = [...entries];
  }

  function removeEntry(dayIndex: number, entryIndex: number) {
    console.log(dayIndex, "dayIndexdayIndexdayIndex");
    console.log(entryIndex, "entryIndexentryIndexentryIndexentryIndex");
    if (entries[dayIndex].entries.length > 1) {
      entries[dayIndex].entries.splice(entryIndex, 1);
      entries = [...entries];
    }
  }

  function showNotification(message: string, isError = false) {
    console.log(message, "messagemessagemessage");
    if (notificationTimeout) clearTimeout(notificationTimeout);
    error = isError ? message : "";
    success = !isError;

    if (message) {
      notificationTimeout = setTimeout(() => {
        error = "";
        success = false;
      }, 5000);
    }
  }
  async function handleSubmit() {
    console.log("Submitting timesheet...");

    const payload = entries
      .map((day) => ({
        employeeId,
        dateUTC: new Date(day.date.toISOString().split("T")[0]),
        entries: day.entries.filter(
          (entry: any) => entry.duration > 0 && entry.project.trim() !== ""
        ),
      }))
      .filter((day) => day.entries.length > 0);

    console.log(payload, "Filtered Payload =>....");

    isSubmitting = true;
    success = false;
    error = "";

    try {
      for (const dayPayload of payload) {
        const res = await timesheetApi.submit(dayPayload);
        console.log("Response:---->", res);
      }

      showNotification("Timesheet submitted successfully!");
      console.log("All valid timesheet entries submitted.");
    } catch (err) {
      console.error("Error submitting timesheet:", err);
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
        <span class="mr-3 font-medium">Week Selector</span>
        <select on:change={selectWeek} class="border rounded p-2 bg-white">
          <option disabled selected>Select Week</option>
          <option value="current">Current Week</option>
          <option value="prev">Previous Week</option>
          <option value="next">Next Week</option>
        </select>
      </div>
      <div class="font-medium">Date Range: {weekRange}</div>
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

          <!-- Improved table structure -->
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
          <button
            class="px-6 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Save Draft
          </button>
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
