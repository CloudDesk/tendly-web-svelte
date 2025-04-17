<script lang="ts">
  import { createEventDispatcher, tick } from "svelte";
  import { fade, slide } from "svelte/transition";
  import { Trash2, Copy, Plus, AlertCircle, Check } from "lucide-svelte";

  export let entries: any[] = [];
  export let holidays: { date: string; name: string; type: string }[] = [];
  export let weekendDays: number[] = [];

  console.log(holidays, weekendDays, "holidays,weekendDays");
  const dispatch = createEventDispatcher();
  console.log(entries, "entries");
  let showConfirmationDialog = false;
  let validationErrors: string[] = [];
  let expandedDay: number | null = null;

  function updateEntry(
    dayIndex: number,
    entryIndex: number,
    field: string,
    value: string
  ) {
    entries[dayIndex].entries[entryIndex][field] = value;
    entries = [...entries];
  }

  function addEntry(dayIndex: number) {
    const lastEntry =
      entries[dayIndex].entries[entries[dayIndex].entries.length - 1];
    entries[dayIndex].entries.push({
      project: lastEntry.project,
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

  function copyEntryToNextDay(dayIndex: number, entryIndex: number) {
    if (dayIndex < entries.length - 1) {
      const entryToCopy = { ...entries[dayIndex].entries[entryIndex] };
      entries[dayIndex + 1].entries.push(entryToCopy);
      entries = [...entries];
    }
  }

  function toggleDayExpansion(dayIndex: number) {
    expandedDay = expandedDay === dayIndex ? null : dayIndex;
  }

  function validateEntries() {
    validationErrors = [];
    entries.forEach((day) => {
      const totalDuration = day.entries.reduce(
        (sum: number, entry: any) => sum + (parseFloat(entry.duration) || 0),
        0
      );

      if (totalDuration > 9) {
        validationErrors.push(
          `${day.day} (${day.date.toLocaleDateString()}): Total duration exceeds 9 hours (${totalDuration} hours)`
        );
      }
      // Check for incomplete entries
      day.entries.forEach((entry: any, entryIndex: number) => {
        if (entry.duration > 0) {
          if (entry.project.trim() === "") {
            validationErrors.push(
              `${day.day} (${day.date.toLocaleDateString()}): Entry #${
                entryIndex + 1
              } has hours but no project specified`
            );
          }
          if (entry.task.trim() === "") {
            validationErrors.push(
              `${day.day} (${day.date.toLocaleDateString()}): Entry #${
                entryIndex + 1
              } has hours but no task specified`
            );
          }
          if (entry.description.trim() === "") {
            validationErrors.push(
              `${day.day} (${day.date.toLocaleDateString()}): Entry #${
                entryIndex + 1
              } has hours but no description specified`
            );
          }
        }
      });
    });
  }

  function handleSubmit() {
    validateEntries();
    showConfirmationDialog = true;
  }

  function confirmSubmission() {
    showConfirmationDialog = false;
    console.log(entries, "entries to submit");
    dispatch("submit", entries);
  }

  function getDayTotal(dayIndex: number) {
    return entries[dayIndex].entries
      .reduce(
        (sum: number, entry: any) => sum + (parseFloat(entry.duration) || 0),
        0
      )
      .toFixed(1);
  }

  function getFormattedDate(date: Date) {
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  }

  function isWeekend(date: Date) {
    return weekendDays.includes(date.getDay());
  }

  function isHoliday(date: Date) {
    const dateStr = date.toISOString().split("T")[0];
    return holidays.some((h) => h.date.startsWith(dateStr));
  }

  function getHolidayName(date: Date) {
    const dateStr = date.toISOString().split("T")[0];
    const holiday = holidays.find((h) => h.date.startsWith(dateStr));
    return holiday ? holiday.name : "";
  }
</script>

<div Berger="space-y-4">
  <div
    class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  >
    {#each entries as day, dayIndex}
      <!-- Day Card -->
      <div
        class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-md"
        class:border-blue-200={expandedDay === dayIndex}
        class:bg-blue-50={expandedDay === dayIndex}
        class:bg-amber-50={isWeekend(day.date)}
        class:border-amber-200={isWeekend(day.date)}
        class:bg-red-50={isHoliday(day.date)}
        class:border-red-200={isHoliday(day.date)}
      >
        <!-- Day Header -->
        <button
          type="button"
          role="button"
          aria-expanded={expandedDay === dayIndex}
          class="w-full text-left px-4 py-3 flex justify-between items-center cursor-pointer border-b border-gray-100"
          class:border-blue-200={expandedDay === dayIndex}
          class:border-amber-200={isWeekend(day.date)}
          class:border-red-200={isHoliday(day.date)}
          on:click={() => toggleDayExpansion(dayIndex)}
          on:keydown={(e) => e.key === "Enter" && toggleDayExpansion(dayIndex)}
        >
          <div class="flex items-center gap-2">
            <h3 class="font-medium text-gray-900">
              {getFormattedDate(day.date)} |
              {day.day.substring(0, 3)}
            </h3>
            {#if isHoliday(day.date)}
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                title={getHolidayName(day.date)}
              >
                Holiday
              </span>
            {/if}
            {#if isWeekend(day.date)}
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
              >
                Weekend
              </span>
            {/if}
          </div>
          <div class="text-right">
            <div class="text-lg font-semibold text-blue-600">
              {getDayTotal(dayIndex)}h
            </div>
            <div class="text-xs text-gray-500">
              {#if day.entries[0].duration > 0}
                {day.entries.length}
                {day.entries.length === 1 ? "entry" : "entries"}
              {/if}
            </div>
          </div>
        </button>

        <!-- Day Entries -->
        {#if expandedDay === dayIndex}
          <div transition:slide|local={{ duration: 300 }} class="p-3 space-y-3">
            {#each day.entries as entry, entryIndex}
              <div
                class="rounded-lg border p-3 space-y-2"
                class:border-red-200={entry.duration > 0 &&
                  entry.project === ""}
                class:bg-red-50={entry.duration > 0 && entry.project === ""}
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      for="project-{dayIndex}-{entryIndex}"
                      class="block text-xs font-medium text-gray-700 mb-1"
                      >Project</label
                    >
                    <input
                      id="project-{dayIndex}-{entryIndex}"
                      type="text"
                      placeholder="Project name"
                      value={entry.project}
                      on:input={(event) =>
                        updateEntry(
                          dayIndex,
                          entryIndex,
                          "project",
                          event.target.value
                        )}
                      class:border-red-300={entry.duration > 0 &&
                        entry.project === ""}
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      class="block text-xs font-medium text-gray-700 mb-1"
                      for="task-{dayIndex}-{entryIndex}">Task</label
                    >
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
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    class="block text-xs font-medium text-gray-700 mb-1"
                    for="description-{dayIndex}-{entryIndex}">Description</label
                  >
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
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div class="flex justify-between items-end">
                  <div class="w-1/3">
                    <label
                      class="block text-xs font-medium text-gray-700 mb-1"
                      for="hours-{dayIndex}-{entryIndex}">Hours</label
                    >
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
                      step="0.5"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div class="flex space-x-2">
                    <button
                      on:click={() => copyEntryToNextDay(dayIndex, entryIndex)}
                      disabled={dayIndex === entries.length - 1}
                      class="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      title="Copy to next day"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      on:click={() => removeEntry(dayIndex, entryIndex)}
                      disabled={day.entries.length === 1}
                      class="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      title="Remove entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            {/each}

            <button
              on:click={() => addEntry(dayIndex)}
              class="w-full flex items-center justify-center text-sm text-blue-600 hover:text-blue-800 py-2 border border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Plus size={16} class="mr-1" />
              Add Entry
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Submit Button and Week Summary -->
  <div
    class="mt-8 bg-white rounded-xl shadow-sm p-4 flex flex-col lg:flex-row justify-between items-center"
  >
    <div class="flex items-center mb-4 lg:mb-0">
      <div class="bg-blue-50 text-blue-700 rounded-lg px-4 py-2 mr-3">
        <span class="font-medium"
          >Weekly Total: {entries
            .reduce((total, day) => {
              return (
                total +
                day.entries.reduce((dayTotal, entry) => {
                  return dayTotal + (parseFloat(entry.duration) || 0);
                }, 0)
              );
            }, 0)
            .toFixed(1)} hours</span
        >
      </div>
      <div class="text-sm text-gray-500">
        Entries: {entries.reduce((total, day) => total + day.entries.length, 0)}
      </div>
    </div>

    <button
      on:click={handleSubmit}
      class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm w-full lg:w-auto"
    >
      Submit Timesheet
    </button>
  </div>

  <!-- Confirmation Dialog -->
  {#if showConfirmationDialog}
    <div
      transition:fade={{ duration: 200 }}
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div
        transition:slide={{ duration: 200 }}
        class="bg-white rounded-xl shadow-xl p-6 w-full max-w-xl m-4"
      >
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Confirm Timesheet Submission
        </h3>

        <div class="overflow-auto max-h-60 mb-4">
          <table class="min-w-full border-collapse">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >Date</th
                >
                <th
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >Projects</th
                >
                <th
                  class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >Hours</th
                >
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each entries as day}
                {@const totalHours = day.entries.reduce(
                  (sum, entry) => sum + (parseFloat(entry.duration) || 0),
                  0
                )}
                {#if totalHours > 0}
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 text-sm text-gray-900">
                      {getFormattedDate(day.date)}
                      {day.day.substring(0, 3)}
                      {#if isHoliday(day.date)}
                        <span
                          class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                        >
                          {getHolidayName(day.date)}
                        </span>
                      {/if}
                      {#if isWeekend(day.date)}
                        <span
                          class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                        >
                          Weekend
                        </span>
                      {/if}
                    </td>
                    <td class="px-4 py-2 text-sm text-gray-500">
                      {day.entries
                        .filter((entry) => entry.project && entry.duration > 0)
                        .map((entry) => entry.project)
                        .filter(
                          (project, index, self) =>
                            self.indexOf(project) === index
                        )
                        .join(", ")}
                    </td>
                    <td
                      class="px-4 py-2 text-sm text-gray-900 text-right font-medium"
                    >
                      {totalHours.toFixed(1)}
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td class="px-4 py-2 text-sm font-medium text-gray-500"
                  >Total</td
                >
                <td></td>
                <td
                  class="px-4 py-2 text-right text-sm font-bold text-blue-600"
                >
                  {entries
                    .reduce((total, day) => {
                      return (
                        total +
                        day.entries.reduce(
                          (dayTotal, entry) =>
                            dayTotal + (parseFloat(entry.duration) || 0),
                          0
                        )
                      );
                    }, 0)
                    .toFixed(1)} hrs
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {#if validationErrors.length > 0}
          <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div class="flex items-start">
              <AlertCircle
                size={16}
                class="text-red-500 mr-2 mt-0.5 flex-shrink-0"
              />
              <div>
                <div class="text-sm font-medium text-red-800 mb-1">
                  Please fix the following issues:
                </div>
                <ul class="list-disc pl-5 text-sm text-red-700 space-y-1">
                  {#each validationErrors as error}
                    <li>{error}</li>
                  {/each}
                </ul>
              </div>
            </div>
          </div>
        {/if}

        <div class="flex justify-end space-x-3 mt-6">
          <button
            on:click={() => (showConfirmationDialog = false)}
            class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            on:click={confirmSubmission}
            disabled={validationErrors.length > 0}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} class="mr-1" />
            Confirm Submission
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
