<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let entries: any[] = [];
  const dispatch = createEventDispatcher();
  console.log(entries, "entriesentriesentries");
  let showConfirmationDialog = false; // Controls the visibility of the confirmation dialog
  let validationErrors: string[] = []; // Stores validation errors for entries exceeding 9 hours

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

  function validateEntries() {
    validationErrors = [];
    entries.forEach((day) => {
      const totalDuration = day.entries.reduce(
        (sum: number, entry: any) => sum + (parseFloat(entry.duration) || 0),
        0
      );
      if (totalDuration > 9) {
        validationErrors.push(
          `Day ${day.day} (${day.date.toLocaleDateString()}): Total duration exceeds 9 hours (${totalDuration} hours)`
        );
      }
    });
  }

  function handleSubmit() {
    validateEntries();
    showConfirmationDialog = true; // Always show the confirmation dialog
  }

  function confirmSubmission() {
    showConfirmationDialog = false;
    dispatch("submit", entries); // Dispatch the submit event after confirmation
  }
</script>

<div>
  {#each entries as day, dayIndex}
    <div class="mb-6 bg-gray-50 rounded p-4">
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-medium text-lg">
          {day.day} ({day.date.toLocaleDateString()})
        </h3>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200 rounded">
          <thead>
            <tr class="bg-gray-100">
              <th
                class="py-2 px-3 text-left text-sm font-medium text-gray-700 w-1/5"
              >
                Project
              </th>
              <th
                class="py-2 px-3 text-left text-sm font-medium text-gray-700 w-1/5"
              >
                Task
              </th>
              <th
                class="py-2 px-3 text-left text-sm font-medium text-gray-700 w-2/5"
              >
                Description
              </th>
              <th
                class="py-2 px-3 text-left text-sm font-medium text-gray-700 w-1/5"
              >
                Hours
              </th>
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
                      updateEntry(dayIndex, entryIndex, "task", e.target.value)}
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
                    step="0.5"
                    class="w-full border rounded p-1.5 text-sm"
                  />
                </td>
                <td class="py-2 px-1 text-center">
                  <button
                    on:click={() => removeEntry(dayIndex, entryIndex)}
                    class="text-red-600 hover:text-red-800"
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

  <div class="mt-6 flex justify-end">
    <button
      on:click={handleSubmit}
      class="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
    >
      Submit
    </button>
  </div>

  <!-- Confirmation Dialog -->
  {#if showConfirmationDialog}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-lg shadow-lg p-6 w-1/2">
        <h3 class="text-lg font-medium mb-4">Confirm Submission</h3>
        <table class="min-w-full bg-white border border-gray-200 rounded mb-4">
          <thead>
            <tr class="bg-gray-100">
              <th class="py-2 px-3 text-left text-sm font-medium text-gray-700">
                Date
              </th>
              <th class="py-2 px-3 text-left text-sm font-medium text-gray-700">
                Total Hours
              </th>
            </tr>
          </thead>
          <tbody>
            {#each entries as day}
              <tr>
                <td class="py-2 px-3">{day.date.toLocaleDateString()}</td>
                <td class="py-2 px-3">
                  {day.entries.reduce(
                    (sum, entry) => sum + (parseFloat(entry.duration) || 0),
                    0
                  )}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

        {#if validationErrors.length > 0}
          <div
            class="bg-red-50 border border-red-300 text-red-800 p-3 rounded mb-4"
          >
            <ul>
              {#each validationErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <div class="flex justify-end space-x-4">
          <button
            on:click={() => (showConfirmationDialog = false)}
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            on:click={confirmSubmission}
            disabled={validationErrors.length > 0}
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
