<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { IHolidayCalendar, IHoliday } from "$lib/types";
  import {
    Calendar,
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
  } from "lucide-svelte";

  export let calendar: Partial<IHolidayCalendar> = {
    holidays: [],
    year: new Date().getFullYear(), // Default to current year
  };

  console.log(calendar, "calendar");
  const dispatch = createEventDispatcher();
  let minDate: string;
  let maxDate: string;
  let yearError = "";
  let expandedHolidayIndex: number | null = null;
  let formSubmitted = false;

  // Set the min and max dates based on the selected year
  $: {
    if (calendar.year) {
      minDate = `${calendar.year}-01-01`;
      maxDate = `${calendar.year}-12-31`;

      // Validate existing holidays if year changes
      validateHolidayDates();
    }
  }

  function validateHolidayDates() {
    if (!calendar.holidays || calendar.holidays.length === 0) return;

    calendar.holidays = calendar.holidays.map((holiday) => {
      const holidayDate = new Date(holiday.date);
      const holidayYear = holidayDate.getFullYear();

      // If the holiday is outside the selected year, adjust it
      if (holidayYear !== calendar.year) {
        // Create a new date with the same month/day but in the selected year
        const month = holidayDate.getMonth();
        const day = holidayDate.getDate();
        holiday.date = new Date(
          calendar.year ?? new Date().getFullYear(),
          month,
          day
        );
      }

      return holiday;
    });
  }

  function addHoliday() {
    // Create a new holiday with date in the selected year
    const currentDate = new Date();
    const holidayDate = new Date(
      calendar.year ?? new Date().getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

    calendar.holidays = [
      ...(calendar.holidays || []),
      {
        date: holidayDate,
        name: "",
        type: "mandatory" as const,
        description: "",
      },
    ];
  }

  function removeHoliday(index: number) {
    calendar.holidays = calendar.holidays?.filter((_, i) => i !== index) || [];
    if (expandedHolidayIndex === index) {
      expandedHolidayIndex = null;
    } else if (expandedHolidayIndex !== null && expandedHolidayIndex > index) {
      expandedHolidayIndex--;
    }
  }

  function formatDate(date: Date): string {
    console.log(date, "date");
    console.log(date);
    const formatted = new Date(date);
    console.log(formatted, "formatted");
    try {
      return formatted.toISOString().split("T")[0];
    } catch (error) {
      // Handle invalid date
      return "";
    }
  }

  function updateDate(index: number, value: string) {
    if (calendar.holidays && calendar.holidays[index]) {
      calendar.holidays[index].date = new Date(value);
    }
  }

  function validateYear() {
    const currentYear = new Date().getFullYear();
    if ((calendar.year ?? 0) < currentYear) {
      yearError = "Cannot create calendars for past years";
      return false;
    } else if ((calendar.year ?? 0) > currentYear + 2) {
      yearError = "Cannot create calendars more than 2 years in advance";
      return false;
    }
    yearError = "";
    return true;
  }

  function toggleHolidayExpand(index: number) {
    expandedHolidayIndex = expandedHolidayIndex === index ? null : index;
  }

  function validateForm() {
    if (!calendar.name || !calendar.year) {
      return false;
    }

    if (!validateYear()) {
      return false;
    }

    if (!calendar.holidays || calendar.holidays.length === 0) {
      return true; // No holidays is allowed
    }

    // Validate each holiday has required fields
    for (let i = 0; i < calendar.holidays.length; i++) {
      const holiday = calendar.holidays[i];
      if (!holiday.date || !holiday.name || !holiday.type) {
        return false;
      }
    }

    return true;
  }

  function handleSubmit() {
    formSubmitted = true;

    if (!validateForm()) {
      return;
    }

    console.log(calendar, "calendar");
    dispatch("submit", calendar);
  }

  onMount(() => {
    // Initialize with default values if needed
    if (!calendar.year) {
      calendar.year = new Date().getFullYear();
    }
  });
</script>

<form on:submit|preventDefault={handleSubmit} class="p-2">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="form-control">
      <label class="label" for="calendar-name">
        <span class="label-text font-medium text-gray-700"
          >Calendar Name <span class="text-error">*</span></span
        >
      </label>
      <input
        id="calendar-name"
        type="text"
        placeholder="Enter calendar name"
        class="input input-bordered w-full focus:ring-2 focus:ring-primary transition duration-200 {formSubmitted &&
        !calendar.name
          ? 'input-error'
          : ''}"
        bind:value={calendar.name}
        required
      />
      {#if formSubmitted && !calendar.name}
        <span class="text-error text-xs mt-1">Calendar name is required</span>
      {/if}
    </div>

    <div class="form-control">
      <label class="label" for="calendar-year">
        <span class="label-text font-medium text-gray-700"
          >Year <span class="text-error">*</span></span
        >
      </label>
      <input
        id="calendar-year"
        type="number"
        placeholder="Enter year"
        class="input input-bordered w-full focus:ring-2 focus:ring-primary transition duration-200 {(formSubmitted &&
          !calendar.year) ||
        yearError
          ? 'input-error'
          : ''}"
        bind:value={calendar.year}
        on:blur={validateYear}
        required
      />
      {#if yearError}
        <p class="mt-1 text-xs text-error">{yearError}</p>
      {:else if formSubmitted && !calendar.year}
        <span class="text-error text-xs mt-1">Year is required</span>
      {/if}
    </div>

    <div class="form-control">
      <label class="label" for="holiday-description">
        <span class="label-text font-medium text-gray-700">Description</span>
      </label>
      <input
        type="text"
        placeholder="Enter calendar description"
        class="input input-bordered w-full focus:ring-2 focus:ring-primary transition duration-200"
        bind:value={calendar.description}
      />
    </div>
  </div>

  <div class="mb-8">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Calendar />
        Holidays ({calendar.holidays?.length || 0})
      </h3>
      <button
        type="button"
        class="btn btn-primary btn-sm gap-2"
        on:click={addHoliday}
      >
        <Plus />
        Add Holiday
      </button>
    </div>

    {#if calendar.holidays && calendar.holidays.length > 0}
      <div class="overflow-x-auto border rounded-lg">
        <table class="table table-zebra w-full">
          <thead>
            <tr class="bg-base-200">
              <th class="w-32">Date <span class="text-error">*</span></th>
              <th>Holiday Name <span class="text-error">*</span></th>
              <th class="w-40">Type <span class="text-error">*</span></th>
              <th class="w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each calendar.holidays as holiday, index}
              <tr class="hover:bg-base-200">
                <td>
                  <input
                    type="date"
                    class="input input-bordered input-sm w-full {formSubmitted &&
                    !holiday.date
                      ? 'input-error'
                      : ''}"
                    value={formatDate(holiday.date)}
                    min={minDate}
                    max={maxDate}
                    on:input={(e) => updateDate(index, e.currentTarget.value)}
                    required
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Enter holiday name"
                    class="input input-bordered input-sm w-full {formSubmitted &&
                    !holiday.name
                      ? 'input-error'
                      : ''}"
                    bind:value={holiday.name}
                    required
                  />
                </td>
                <td>
                  <select
                    class="select select-bordered select-sm w-full {formSubmitted &&
                    !holiday.type
                      ? 'select-error'
                      : ''}"
                    bind:value={holiday.type}
                    required
                  >
                    <option value="mandatory">Mandatory</option>
                    <option value="optional">Optional</option>
                    <option value="client-specific">Client-Specific</option>
                  </select>
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="btn btn-sm btn-ghost"
                      on:click={() => toggleHolidayExpand(index)}
                      title="Toggle description"
                    >
                      {#if expandedHolidayIndex === index}
                        <ChevronUp />
                      {:else}
                        <ChevronDown />
                      {/if}
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-ghost text-error"
                      on:click={() => removeHoliday(index)}
                      title="Remove holiday"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </td>
              </tr>
              {#if expandedHolidayIndex === index}
                <tr class="bg-base-100">
                  <td colspan="4" class="p-2">
                    <div class="form-control">
                      <label class="label" for="holiday-description-{index}">
                        <span
                          class="label-text text-sm font-medium text-gray-700"
                          >Description</span
                        >
                      </label>
                      <textarea
                        id="holiday-description-{index}"
                        placeholder="Enter holiday description (optional)"
                        class="textarea textarea-bordered w-full focus:ring-2 focus:ring-primary transition duration-200"
                        bind:value={holiday.description}
                      ></textarea>
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div
        class="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-12 h-12 text-gray-400 mb-2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9.75v7.5m-18 0h18"
          />
        </svg>
        <p class="text-gray-500">No holidays added to this calendar yet.</p>
        <button
          type="button"
          class="btn btn-sm btn-outline mt-4"
          on:click={addHoliday}
        >
          Add your first holiday
        </button>
      </div>
    {/if}
  </div>

  <div
    class="flex flex-col md:flex-row md:justify-between items-center mt-8 border-t pt-4 gap-3"
  >
    <div class="text-sm text-gray-500">
      <span class="text-error mr-1">*</span> Required fields
    </div>
    <div class="flex gap-3">
      <button type="button" class="btn btn-outline">Cancel</button>
      <button type="submit" class="btn btn-primary px-8">
        Save Calendar
      </button>
    </div>
  </div>
</form>
