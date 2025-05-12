<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";
  import { auth } from "$lib/stores/auth";
  import { attendanceApi, shiftsApi } from "$lib/services/api";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";

  interface User {
    _id?: string;
    name?: string;
    employeeId?: string;
    avatar?: string;
    biometricId?: string;
  }

  interface ShiftInfo {
    shiftCode: string;
    shiftName: string;
    startTime: string;
    endTime: string;
    attendance?: {
      status: string;
      needsRegularization: boolean;
      swipes: any[];
    };
  }

  const dispatch = createEventDispatcher();
  const user = ($auth.user as User) || {};
  console.log(user, "users");
  export let selectedDates: Date[] = []; // Array of selected dates
  export let weekendDays: number[] = [0, 6]; // Default weekends (Sunday, Saturday)
  export let year: number = new Date().getFullYear();
  export let month: number = new Date().getMonth(); // 0-based index for months
  export let allowFutureDates: boolean = false; // Control whether future dates can be selected
  export let maxFutureDays: number = 30; // How many days in the future can be selected

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Reset time portion for accurate comparisons

  const daysInMonth = writable<Date[]>([]); // Days to display in the calendar
  const emptyDays = writable<number>(0); // Empty days at start of month grid
  const userShifts = writable<Record<string, ShiftInfo>>({});

  // User display information
  const userName = user.name || "User Name";
  const userCode = user.biometricId || "#EMP001";
  const userAvatar = user.avatar;

  // Generate days for the current month
  function generateDays(year: number, month: number) {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysCount = lastDayOfMonth.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const days: Date[] = [];
    emptyDays.set(firstDayOfWeek);

    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i));
    }

    daysInMonth.set(days);
  }

  // Handle month navigation
  function handleMonthChange(direction: "prev" | "next") {
    if (direction === "prev") {
      if (month === 0) {
        month = 11;
        year -= 1;
      } else {
        month -= 1;
      }
    } else if (direction === "next") {
      if (month === 11) {
        month = 0;
        year += 1;
      } else {
        month += 1;
      }
    }

    generateDays(year, month);
    dispatch("monthChange", { year, month: month + 1 }); // Month is 1-indexed in the event
  }

  // Check if a date is selected
  $: isSelected = (date: Date) => {
    return selectedDates.some(
      (selectedDate) =>
        selectedDate.getFullYear() === date.getFullYear() &&
        selectedDate.getMonth() === date.getMonth() &&
        selectedDate.getDate() === date.getDate()
    );
  };

  // Handle date selection
  function toggleDateSelection(date: Date) {
    // Check if the date is selectable
    if (!isDateSelectable(date)) return;

    const index = selectedDates.findIndex(
      (selectedDate) => selectedDate.toDateString() === date.toDateString()
    );

    if (index === -1) {
      selectedDates = [...selectedDates, date];
    } else {
      selectedDates = selectedDates.filter(
        (selectedDate) => selectedDate.toDateString() !== date.toDateString()
      );
    }

    // Force a UI update by reassigning selectedDates
    selectedDates = [...selectedDates];
    dispatch("dateSelect", { selectedDates });
  }

  // Check if a date is selectable based on rules
  function isDateSelectable(date: Date): boolean {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    // Always allow past dates
    if (dateToCheck <= currentDate) return true;

    // Future dates handling
    if (!allowFutureDates) return false;

    // Check if within the max future days limit
    if (maxFutureDays > 0) {
      const maxFutureDate = new Date(currentDate);
      maxFutureDate.setDate(currentDate.getDate() + maxFutureDays);
      return dateToCheck <= maxFutureDate;
    }

    return true;
  }

  // Check if a date is a weekend
  function isWeekend(date: Date): boolean {
    return weekendDays.includes(date.getDay());
  }

  // Check if a date is today
  function isToday(date: Date): boolean {
    return date.toDateString() === currentDate.toDateString();
  }

  // Check if a date is in the past
  function isPast(date: Date): boolean {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < currentDate;
  }

  // Check if a date is in the future
  function isFuture(date: Date): boolean {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck > currentDate;
  }

  // Get shift info for a date
  function getShiftInfo(date: Date): ShiftInfo | null {
    const dateStr = date.toISOString().split("T")[0];
    return $userShifts[dateStr] || null;
  }

  // Format date for jumping
  function formatDateForJump(date: Date): string {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  // Initialize days on mount
  $: generateDays(year, month);
</script>

<div class="flex flex-col gap-3">
  <div class="calendar-wrapper bg-white rounded shadow p-3">
    <div class="month-nav flex justify-between items-center mb-3 px-2">
      <button
        class="nav-btn flex items-center gap-1 text-gray-700 hover:bg-gray-100 p-1 rounded"
        on:click={() => handleMonthChange("prev")}
      >
        <ChevronLeft />
        <span>Prev</span>
      </button>
      <h2 class="text-base font-medium uppercase">
        {new Date(year, month).toLocaleString("default", { month: "long" })}
        {year}
      </h2>
      <button
        class="nav-btn flex items-center gap-1 text-gray-700 hover:bg-gray-100 p-1 rounded"
        on:click={() => handleMonthChange("next")}
      >
        <span>Next</span>
        <ChevronRight />
      </button>
    </div>

    <div
      class="calendar-days grid grid-cols-7 text-center text-xs font-medium mb-1 border-b pb-1"
    >
      <div class="p-1 text-gray-500">S</div>
      <div class="p-1 text-gray-500">M</div>
      <div class="p-1 text-gray-500">T</div>
      <div class="p-1 text-gray-500">W</div>
      <div class="p-1 text-gray-500">T</div>
      <div class="p-1 text-gray-500">F</div>
      <div class="p-1 text-gray-500">S</div>
    </div>

    <div class="calendar-grid grid grid-cols-7 gap-1">
      {#each Array($emptyDays) as _, i}
        <div class="empty-day p-1 text-center text-xs text-gray-400">
          {new Date(year, month, 0).getDate() - $emptyDays + i + 1}
        </div>
      {/each}

      {#each $daysInMonth as day}
        {@const selectable = isDateSelectable(day)}
        {@const selected = isSelected(day)}
        <div
          class="calendar-day p-1 text-center cursor-pointer transition-colors"
          class:selected
          class:weekend={isWeekend(day)}
          class:today={isToday(day)}
          class:past={isPast(day)}
          class:future={isFuture(day)}
          class:disabled={!selectable}
          class:hover-effect={selectable && !selected}
          on:click={() => toggleDateSelection(day)}
        >
          <div class="day-number text-sm font-medium">{day.getDate()}</div>
        </div>
      {/each}

      {#each Array(42 - $daysInMonth.length - $emptyDays) as _, i}
        <div class="empty-day p-1 text-center text-xs text-gray-400">
          {i + 1}
        </div>
      {/each}
    </div>
  </div>

  {#if selectedDates.length > 0}
    <div class="jump-to mt-2 p-3 border rounded bg-gray-50">
      <p class="text-sm font-medium mb-2 text-gray-500">Date Select's</p>
      <div class="selected-dates">
        {#each selectedDates.slice(0, 5) as date}
          <div
            class="selected-date text-sm py-1 border-l-2 border-blue-500 pl-2 mb-1 bg-blue-50"
          >
            {date.getDate()}
            {formatDateForJump(date)}
          </div>
        {/each}
        {#if selectedDates.length > 5}
          <div class="text-xs text-gray-500 mt-1">
            +{selectedDates.length - 5} more days...
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="no-exception p-3 text-sm text-gray-500 bg-gray-50 rounded">
      No exception days to regularise.
    </div>
  {/if}

  <div
    class="user-profile mt-2 p-3 bg-white rounded shadow flex items-center gap-3"
  >
    <div
      class="avatar bg-blue-100 text-blue-800 w-10 h-10 rounded-full flex items-center justify-center"
    >
      {#if userAvatar}
        <img
          src={userAvatar}
          alt={userName}
          class="rounded-full w-full h-full object-cover"
        />
      {:else}
        <span class="text-xl font-bold">{userName.charAt(0)}</span>
      {/if}
    </div>
    <div class="user-info">
      <div class="user-name text-sm font-medium">{userName}</div>
      <div class="user-code text-xs text-gray-500">{userCode}</div>
    </div>
  </div>
</div>

<style>
  .calendar-wrapper {
    width: 100%;
  }

  .calendar-day {
    height: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid transparent;
    position: relative;
    transition: all 0.2s ease-in-out;
  }

  /* Enhanced hover effect */
  .calendar-day.hover-effect:hover {
    border-color: #bfdbfe;
    background-color: #f0f9ff;
    z-index: 1;
  }

  .empty-day {
    height: 48px;
  }

  .day-number {
    margin-bottom: 2px;
  }

  /* Enhanced selected styling */
  .calendar-day.selected {
    background-color: #3b82f6;
    border-color: #2563eb;
    color: white;
    font-weight: 600;
    transform: scale(1.05);
    z-index: 2;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  }

  .calendar-day.selected .day-number {
    font-weight: 600;
  }

  .calendar-day.selected:hover {
    background-color: #2563eb;
  }

  .calendar-day.today {
    border: 2px solid #3b82f6;
  }

  .calendar-day.today:not(.selected) {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .calendar-day.weekend {
    color: #ef4444;
  }

  .calendar-day.past:not(.selected) {
    background-color: #f9fafb;
    color: #4b5563;
  }

  .calendar-day.future:not(.selected):not(.disabled) {
    background-color: #f0f9ff;
    color: #0369a1;
  }

  .calendar-day.disabled {
    opacity: 0.5;
    background-color: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }

  .calendar-day.has-shift .day-number {
    margin-bottom: 0;
  }

  .nav-btn {
    font-size: 0.875rem;
  }

  /* Enhanced selected date in the list */
  .selected-date {
    background-color: #eff6ff;
    border-left: 3px solid #3b82f6;
    transition: all 0.2s ease;
  }

  .selected-date:hover {
    background-color: #dbeafe;
  }
</style>
