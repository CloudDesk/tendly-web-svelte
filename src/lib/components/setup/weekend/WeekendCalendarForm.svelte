<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { IWeekendCalendar } from "$lib/types";

  export let calendar: Partial<IWeekendCalendar> = {
    weekends: [],
  };

  const dispatch = createEventDispatcher();
  let formSubmitted = false;

  function addWeekend() {
    calendar.weekends = [
      ...(calendar.weekends || []),
      { weekday: 6, occurrences: [] }, // Default to Saturday
    ];
  }

  function removeWeekend(index: number) {
    calendar.weekends = calendar.weekends?.filter((_, i) => i !== index) || [];
  }

  function handleSubmit() {
    formSubmitted = true;

    if (!calendar.name) {
      return;
    }

    dispatch("submit", calendar);
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="p-4">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <div class="form-control">
      <label class="label" for="calendar-name">
        <span class="label-text font-medium text-gray-700">Calendar Name *</span>
      </label>
      <input
        id="calendar-name"
        type="text"
        placeholder="Enter calendar name"
        class="input input-bordered w-full"
        bind:value={calendar.name}
        required
      />
      {#if formSubmitted && !calendar.name}
        <span class="text-error text-xs mt-1">Calendar name is required</span>
      {/if}
    </div>

    <div class="form-control">
      <label class="label" for="calendar-description">
        <span class="label-text font-medium text-gray-700">Description</span>
      </label>
      <textarea
        id="calendar-description"
        placeholder="Enter description (optional)"
        class="textarea textarea-bordered w-full"
        bind:value={calendar.description}
      ></textarea>
    </div>
  </div>

  <div class="mb-8">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800">Weekend Rules</h3>
      <button type="button" class="btn btn-primary btn-sm" on:click={addWeekend}>
        Add Rule
      </button>
    </div>

    {#if calendar.weekends && calendar.weekends.length > 0}
      <div class="overflow-x-auto border rounded-lg">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Weekday</th>
              <th>Occurrences</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each calendar.weekends as weekend, index}
              <tr>
                <td>
                  <select
                    class="select select-bordered w-full"
                    bind:value={weekend.weekday}
                  >
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="e.g., 1st, 3rd"
                    class="input input-bordered w-full"
                    bind:value={weekend.occurrences}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    class="btn btn-error btn-sm"
                    on:click={() => removeWeekend(index)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="text-sm text-gray-500">No weekend rules added yet.</p>
    {/if}
  </div>

  <div class="flex justify-end gap-4">
    <button type="button" class="btn btn-outline">Cancel</button>
    <button type="submit" class="btn btn-primary">Save</button>
  </div>
</form>