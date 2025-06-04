<script lang="ts">
  import { createEventDispatcher, tick } from "svelte";
  import { fade, slide } from "svelte/transition";
  import {
    Trash2,
    Plus,
    AlertCircle,
    Check,
    Eye,
    Edit3,
    Clock,
    Calendar,
  } from "lucide-svelte";
  import Modal from "../common/Modal.svelte";

  export let entries: any[] = [];
  export let holidays: { date: string; name: string; type: string }[] = [];
  export let weekendDays: number[] = [];

  const dispatch = createEventDispatcher();

  let showConfirmationDialog = false;
  let showEntryModal = false;
  let validationErrors: string[] = [];
  let expandedDay: number | null = null;

  // Modal state
  let editingEntry = null;
  let editingDayIndex = -1;
  let editingEntryIndex = -1;
  let modalMode = "view"; // 'view', 'edit', 'add'
  let durationError = "";
  // Reactive statement to clamp duration and set error message
  $: if (editingEntry && editingEntry.duration > 9) {
    editingEntry.duration = 9;
    durationError = "Maximum hours per entry is 9.";
  } else {
    durationError = "";
  }

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
    editingDayIndex = dayIndex;
    editingEntryIndex = -1;
    modalMode = "add";

    const lastEntry =
      entries[dayIndex].entries[entries[dayIndex].entries.length - 1];
    editingEntry = {
      project: "",
      task: "",
      description: "",
      duration: 0,
    };

    showEntryModal = true;
  }

  function viewEntry(dayIndex: number, entryIndex: number) {
    editingDayIndex = dayIndex;
    editingEntryIndex = entryIndex;
    modalMode = "view";
    editingEntry = { ...entries[dayIndex].entries[entryIndex] };
    showEntryModal = true;
  }

  function editEntry(dayIndex: number, entryIndex: number) {
    editingDayIndex = dayIndex;
    editingEntryIndex = entryIndex;
    modalMode = "edit";
    editingEntry = { ...entries[dayIndex].entries[entryIndex] };
    showEntryModal = true;
  }

  function removeEntry(dayIndex: number, entryIndex: number) {
    if (entries[dayIndex].entries.length > 1) {
      entries[dayIndex].entries.splice(entryIndex, 1);
      entries = [...entries];
    }
  }

  function saveModalEntry() {
    if (modalMode === "add") {
      entries[editingDayIndex].entries.push({ ...editingEntry });
    } else if (modalMode === "edit") {
      entries[editingDayIndex].entries[editingEntryIndex] = { ...editingEntry };
    }
    entries = [...entries];
    closeModal();
  }

  function closeModal() {
    showEntryModal = false;
    editingEntry = null;
    editingDayIndex = -1;
    editingEntryIndex = -1;
    modalMode = "view";
    durationError = "";
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

      day.entries.forEach((entry: any, entryIndex: number) => {
        if (entry.duration > 0) {
          if (entry.project.trim() === "") {
            validationErrors.push(
              `${day.day} (${day.date.toLocaleDateString()}): Entry #${entryIndex + 1} has hours but no project specified`
            );
          }
          if (entry.task.trim() === "") {
            validationErrors.push(
              `${day.day} (${day.date.toLocaleDateString()}): Entry #${entryIndex + 1} has hours but no task specified`
            );
          }
          if (entry.description.trim() === "") {
            validationErrors.push(
              `${day.day} (${day.date.toLocaleDateString()}): Entry #${entryIndex + 1} has hours but no description specified`
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

  function truncateText(text: string, maxLength: number = 50) {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  function getWeeklyTotal() {
    return entries
      .reduce((total, day) => {
        return (
          total +
          day.entries.reduce((dayTotal, entry) => {
            return dayTotal + (parseFloat(entry.duration) || 0);
          }, 0)
        );
      }, 0)
      .toFixed(1);
  }

  // function getTotalEntries() {
  //   return entries.reduce((total, day) => total + day.entries.length, 0);
  // }
  function getTotalEntries() {
    return entries.reduce((total, day) => {
      return (
        total + day.entries.filter((entry: any) => entry.duration > 0).length
      );
    }, 0);
  }
</script>

<div class="space-y-6">
  <!-- Day Cards Grid -->
  <div
    class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  >
    {#each entries as day, dayIndex}
      <div
        class="bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md"
        class:border-blue-200={expandedDay === dayIndex}
        class:bg-blue-50={expandedDay === dayIndex}
        class:bg-amber-50={isWeekend(day.date)}
        class:border-amber-200={isWeekend(day.date)}
        class:bg-red-50={isHoliday(day.date)}
        class:border-red-200={isHoliday(day.date)}
        class:border-gray-200={expandedDay !== dayIndex &&
          !isWeekend(day.date) &&
          !isHoliday(day.date)}
      >
        <!-- Day Header -->
        <button
          type="button"
          class="w-full text-left px-4 py-3 flex justify-between items-center cursor-pointer border-b transition-colors"
          class:border-blue-200={expandedDay === dayIndex}
          class:border-amber-200={isWeekend(day.date)}
          class:border-red-200={isHoliday(day.date)}
          class:border-gray-100={expandedDay !== dayIndex &&
            !isWeekend(day.date) &&
            !isHoliday(day.date)}
          on:click={() => toggleDayExpansion(dayIndex)}
        >
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              <Calendar size={16} class="text-gray-500" />
              <h3 class="font-semibold text-gray-900">
                {getFormattedDate(day.date)}
              </h3>
            </div>
            <span class="text-sm text-gray-600 font-medium">
              {day.day.substring(0, 3)}
            </span>

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
            <div class="flex items-center gap-1">
              <Clock size={14} class="text-blue-500" />
              <span class="text-lg font-bold text-blue-600">
                {getDayTotal(dayIndex)}h
              </span>
            </div>
            <div class="text-xs text-gray-500">
              {#if day.entries.some((entry) => entry.duration > 0)}
                {day.entries.filter((entry) => entry.duration > 0).length}
                {day.entries.filter((entry) => entry.duration > 0).length === 1
                  ? "entry"
                  : "entries"}
              {:else}
                No entries
              {/if}
            </div>
          </div>
        </button>

        <!-- Expanded Day Content -->
        {#if expandedDay === dayIndex}
          <div transition:slide|local={{ duration: 300 }} class="p-4">
            <div class="space-y-3">
              {#each day.entries as entry, entryIndex}
                {@const hasHours = entry.duration > 0}
                {@const isIncomplete =
                  hasHours &&
                  (!entry.project.trim() ||
                    !entry.task.trim() ||
                    !entry.description.trim())}

                <div
                  class="group rounded-lg border p-3 transition-all duration-200"
                  class:border-red-200={isIncomplete}
                  class:bg-red-50={isIncomplete}
                  class:border-gray-200={!isIncomplete && !hasHours}
                  class:border-blue-200={!isIncomplete && hasHours}
                  class:bg-blue-50={!isIncomplete && hasHours}
                >
                  <!-- Entry Summary -->
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm font-medium text-gray-900">
                          {entry.project || "No project"}
                        </span>
                        {#if hasHours}
                          <span
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {entry.duration}h
                          </span>
                        {/if}
                      </div>
                      <div class="text-sm text-gray-600 mb-1">
                        {entry.task || "No task specified"}
                      </div>
                      <div class="text-xs text-gray-500">
                        {entry.description
                          ? truncateText(entry.description, 80)
                          : "No description"}
                      </div>
                    </div>

                    <!-- Action Buttons -->
                    <div
                      class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        on:click|stopPropagation={() =>
                          viewEntry(dayIndex, entryIndex)}
                        class="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        on:click|stopPropagation={() =>
                          editEntry(dayIndex, entryIndex)}
                        class="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit entry"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        on:click|stopPropagation={() =>
                          removeEntry(dayIndex, entryIndex)}
                        disabled={day.entries.length === 1}
                        class="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Remove entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {#if isIncomplete}
                    <div class="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle size={12} />
                      <span>Entry incomplete - missing required fields</span>
                    </div>
                  {/if}
                </div>
              {/each}

              <!-- Add Entry Button -->
              <button
                on:click|stopPropagation={() => addEntry(dayIndex)}
                class="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                <Plus size={16} />
                Add Entry
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Weekly Summary -->
  <div class="bg-white rounded-xl border-gray-200 p-6">
    <div class="flex flex-col lg:flex-row justify-between items-center gap-4">
      <div class="flex items-center gap-6">
        <div
          class="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl px-6 py-3"
        >
          <div class="text-sm font-medium text-blue-600">Weekly Total</div>
          <div class="text-2xl font-bold">{getWeeklyTotal()} hours</div>
        </div>
        <div class="text-gray-600">
          <div class="text-sm font-medium">Total Entries</div>
          <div class="text-xl font-semibold">{getTotalEntries()}</div>
        </div>
      </div>

      <button
        on:click={handleSubmit}
        class="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md w-full lg:w-auto"
      >
        Submit Timesheet
      </button>
    </div>
  </div>
</div>

<!-- Entry Modal -->
{#if showEntryModal && editingEntry}
  <Modal
    show={showEntryModal}
    title={modalMode === "add"
      ? "Add New Entry"
      : modalMode === "edit"
        ? "Edit Entry"
        : "Entry Details"}
    onClose={closeModal}
    wide={true}
  >
    <div class="p-6 space-y-6">
      <!-- Entry Form -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              bind:value={editingEntry.project}
              placeholder="Enter project name"
              disabled={modalMode === "view"}
              class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-600"
              class:border-red-300={!editingEntry.project.trim() &&
                editingEntry.duration > 0}
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Task Name *
            </label>
            <input
              type="text"
              bind:value={editingEntry.task}
              placeholder="Enter task name"
              disabled={modalMode === "view"}
              class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-600"
              class:border-red-300={!editingEntry.task.trim() &&
                editingEntry.duration > 0}
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Hours Worked *
            </label>
            <input
              type="number"
              bind:value={editingEntry.duration}
              placeholder="0.0"
              min="0"
              step="0.5"
              disabled={modalMode === "view"}
              class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-600"
              class:border-red-300={durationError}
            />
            <p class="text-xs text-gray-500 mt-1">Maximum 9 hours per entry</p>
            {#if durationError}
              <p class="text-xs text-red-600 mt-1">{durationError}</p>
            {/if}
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            bind:value={editingEntry.description}
            placeholder="Describe what you worked on in detail..."
            rows="8"
            disabled={modalMode === "view"}
            class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none disabled:bg-gray-50 disabled:text-gray-600"
            class:border-red-300={!editingEntry.description.trim() &&
              editingEntry.duration > 0}
          ></textarea>
          <div class="flex justify-between items-center mt-1">
            <p class="text-xs text-gray-500">
              Be specific about tasks, achievements, and challenges
            </p>
            <span class="text-xs text-gray-400">
              {editingEntry.description.length} characters
            </span>
          </div>
        </div>
      </div>

      <!-- Validation Warnings -->
      {#if editingEntry.duration > 0}
        {@const missingFields = [
          !editingEntry.project.trim() && "Project",
          !editingEntry.task.trim() && "Task",
          !editingEntry.description.trim() && "Description",
        ].filter(Boolean)}

        {#if missingFields.length > 0}
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <AlertCircle
                size={20}
                class="text-amber-500 mt-0.5 flex-shrink-0"
              />
              <div>
                <h4 class="text-sm font-medium text-amber-800 mb-1">
                  Missing Required Fields
                </h4>
                <p class="text-sm text-amber-700">
                  Please fill in the following fields: {missingFields.join(
                    ", "
                  )}
                </p>
              </div>
            </div>
          </div>
        {/if}
      {/if}

      <!-- Action Buttons -->
      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          on:click={closeModal}
          class="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          {modalMode === "view" ? "Close" : "Cancel"}
        </button>

        {#if modalMode !== "view"}
          <button
            on:click={saveModalEntry}
            disabled={editingEntry.duration > 0 &&
              (!editingEntry.project.trim() ||
                !editingEntry.task.trim() ||
                !editingEntry.description.trim())}
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check size={16} />
            {modalMode === "add" ? "Add Entry" : "Save Changes"}
          </button>
        {/if}
      </div>
    </div>
  </Modal>
{/if}

<!-- Confirmation Dialog -->
{#if showConfirmationDialog}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  >
    <div
      transition:slide={{ duration: 200 }}
      class="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl m-4 max-h-[80vh] overflow-auto"
    >
      <h3 class="text-xl font-bold text-gray-900 mb-6">
        Confirm Timesheet Submission
      </h3>

      <div class="overflow-auto max-h-96 mb-6">
        <table class="min-w-full border-collapse bg-white">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
              >
                Date
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
              >
                Projects
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
              >
                Tasks
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
              >
                Hours
              </th>
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
                  <td class="px-4 py-3 text-sm">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900">
                        {getFormattedDate(day.date)}
                        {day.day.substring(0, 3)}
                      </span>
                      {#if isHoliday(day.date)}
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                        >
                          {getHolidayName(day.date)}
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
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    {day.entries
                      .filter((entry) => entry.project && entry.duration > 0)
                      .map((entry) => entry.project)
                      .filter(
                        (project, index, self) =>
                          self.indexOf(project) === index
                      )
                      .join(", ")}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    <div class="max-w-xs">
                      {day.entries
                        .filter((entry) => entry.task && entry.duration > 0)
                        .map((entry) => entry.task)
                        .join(", ")}
                    </div>
                  </td>
                  <td
                    class="px-4 py-3 text-sm text-gray-900 text-right font-semibold"
                  >
                    {totalHours.toFixed(1)}h
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
          <tfoot class="bg-gray-50">
            <tr>
              <td
                class="px-4 py-3 text-sm font-semibold text-gray-600"
                colspan="3"
              >
                Total Hours
              </td>
              <td class="px-4 py-3 text-right text-lg font-bold text-blue-600">
                {getWeeklyTotal()}h
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {#if validationErrors.length > 0}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div class="flex items-start gap-3">
            <AlertCircle size={20} class="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 class="text-sm font-semibold text-red-800 mb-2">
                Please fix the following issues:
              </h4>
              <ul class="list-disc pl-5 text-sm text-red-700 space-y-1">
                {#each validationErrors as error}
                  <li>{error}</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>
      {/if}

      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          on:click={() => (showConfirmationDialog = false)}
          class="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          on:click={confirmSubmission}
          disabled={validationErrors.length > 0}
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check size={16} />
          Confirm Submission
        </button>
      </div>
    </div>
  </div>
{/if}
