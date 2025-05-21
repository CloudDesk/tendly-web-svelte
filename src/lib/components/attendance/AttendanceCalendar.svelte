<script lang="ts">
  import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isBefore,
    isToday,
    parseISO,
  } from "date-fns";
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";
  import Loader from "../common/Loader.svelte";

  interface AttendanceRecord {
    shiftDay: string;
    shiftCode: string;
    status: string;
    needsRegularization: boolean;
    attendanceStatus: string[];
    outOfWindowSwipes?: {
      timestamp: string;
      direction: string;
      deviceId?: string;
      location?: string;
      reason?: string;
    }[];
  }

  export let showStatus: boolean = true;
  export let selectedDate: Date;
  export let weekendDays: number[] = [0, 6];
  export let attendanceRecords: AttendanceRecord[] = [];
  export let isLoading: boolean = false;

  $: records = attendanceRecords;

  const dispatch = createEventDispatcher<{
    dateSelect: { date: Date };
    monthChange: { year: number; month: number };
    openRegularization: { date: Date };
  }>();

  const currentDate = writable(selectedDate || new Date());
  let displayedDays: Date[] = [];

  // Update displayedDays whenever currentDate changes
  $: {
    const monthStart = startOfMonth($currentDate);
    const monthEnd = endOfMonth($currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    displayedDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });
  }

  const ATTENDANCE_STATUSES = {
    WEEKEND: { status: "W", className: "bg-gray-50 text-gray-500" },
    UNKNOWN: { status: "U", className: "bg-yellow-50 text-yellow-600" },
    NEEDS_REGULARIZATION: { status: "R", className: "bg-red-50 text-red-600" },
    LATE: { status: "L", className: "bg-orange-100 text-orange-700" },
    ON_TIME: { status: "OT", className: "bg-green-100 text-green-700" },
    EARLY_EXIT: { status: "EE", className: "bg-orange-100 text-orange-700" },
    PRESENT: { status: "P", className: "bg-green-200 text-green-800" },
    OUT_OF_WINDOW: { status: "OW", className: "bg-purple-100 text-purple-700" },
    ON_LEAVE: { status: "LV", className: "bg-blue-100 text-blue-700" },
    ABSENT: { status: "A", className: "bg-red-100 text-red-700" },
    PENDING_REGULARIZATION: {
      status: "PR",
      className: "bg-yellow-100 text-yellow-700",
    },
    REGULARIZED: { status: "RG", className: "bg-teal-200 text-teal-800" },
  } as const;

  function isWeekendDay(date: Date): boolean {
    return weekendDays.includes(date.getDay());
  }

  function getAttendanceStatus(date: Date) {
    if (!showStatus) return null;

    if (!isBefore(date, new Date())) {
      return null;
    }

    if (isWeekendDay(date)) {
      return ATTENDANCE_STATUSES.WEEKEND;
    }

    const formattedDate = format(date, "yyyy-MM-dd");
    const record = attendanceRecords.find(
      (a) => format(parseISO(a.shiftDay), "yyyy-MM-dd") === formattedDate
    );

    if (!record) {
      return ATTENDANCE_STATUSES.UNKNOWN;
    }

    // Check OutOfWindow based on outOfWindowSwipes
    const isOutOfWindow = record.outOfWindowSwipes?.length > 0;
    if (isOutOfWindow) {
      return ATTENDANCE_STATUSES.OUT_OF_WINDOW;
    }

    // Handle needsRegularization
    if (record.needsRegularization) {
      return ATTENDANCE_STATUSES.NEEDS_REGULARIZATION;
    }

    // Handle multiple attendanceStatus values
    // Prioritize display: Regularized > Present > Pending-Regularization > others
    if (record.attendanceStatus.includes("Regularized")) {
      return ATTENDANCE_STATUSES.REGULARIZED;
    }
    if (record.attendanceStatus.includes("Present")) {
      return ATTENDANCE_STATUSES.PRESENT;
    }
    if (record.attendanceStatus.includes("Pending-Regularization")) {
      return ATTENDANCE_STATUSES.PENDING_REGULARIZATION;
    }
    if (record.attendanceStatus.includes("On-Leave")) {
      return ATTENDANCE_STATUSES.ON_LEAVE;
    }
    if (record.attendanceStatus.includes("Absent")) {
      return ATTENDANCE_STATUSES.ABSENT;
    }
    if (record.attendanceStatus.includes("late")) {
      return ATTENDANCE_STATUSES.LATE;
    }
    if (record.attendanceStatus.includes("On-time")) {
      return ATTENDANCE_STATUSES.ON_TIME;
    }
    if (record.attendanceStatus.includes("Early-Exit")) {
      return ATTENDANCE_STATUSES.EARLY_EXIT;
    }
    if (record.attendanceStatus.includes("Out-Of-Window")) {
      return ATTENDANCE_STATUSES.OUT_OF_WINDOW;
    }

    return ATTENDANCE_STATUSES.UNKNOWN;
  }

  function getShiftCode(date: Date): string | null {
    const formattedDate = format(date, "yyyy-MM-dd");
    const record = attendanceRecords.find(
      (a) => format(parseISO(a.shiftDay), "yyyy-MM-dd") === formattedDate
    );
    return record?.shiftCode || null;
  }

  function navigateMonth(direction: "prev" | "next"): void {
    currentDate.update((current) => {
      const newDate =
        direction === "next" ? addMonths(current, 1) : subMonths(current, 1);
      const firstOfMonth = startOfMonth(newDate);
      selectedDate = firstOfMonth;
      dispatch("monthChange", {
        year: newDate.getFullYear(),
        month: newDate.getMonth() + 1,
      });
      return newDate;
    });
  }

  function handleDateSelect(date: Date) {
    selectedDate = date;
    dispatch("dateSelect", { date });
  }

  function isPastDay(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
  }

  function getDateStyles(date: Date): string {
    const isSelected =
      selectedDate &&
      format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
    const isCurrentMonth = isSameMonth(date, $currentDate);
    const todayClass = isToday(date)
      ? "border-blue-400 border-2"
      : "border-gray-200";
    const monthClass = !isCurrentMonth ? "text-gray-400" : "";
    const selectedClass = isSelected ? "bg-blue-100 ring-2 ring-blue-400" : "";
    const pastDayClass = isPastDay(date) ? "bg-gray-50" : "";
    return `relative h-24 p-2 border ${todayClass} ${monthClass} ${selectedClass} ${pastDayClass}`;
  }
</script>

<div class="calendar-container shadow-lg">
  <div
    class="calendar-header flex items-center justify-between p-4 border-b bg-white"
  >
    <button
      class="flex items-center text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
      on:click={() => navigateMonth("prev")}
    >
      <span class="mr-1">←</span>
      <span>Prev</span>
    </button>
    <h2 class="text-lg font-semibold text-gray-800">
      {format($currentDate, "MMMM yyyy")}
    </h2>
    <button
      class="flex items-center text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
      on:click={() => navigateMonth("next")}
    >
      <span>Next</span>
      <span class="ml-1">→</span>
    </button>
  </div>

  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <Loader />
    </div>
  {:else}
    <div class="calendar-body">
      <div class="grid grid-cols-7 text-sm bg-gray-50">
        {#each ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as day}
          <div class="p-3 text-center font-semibold text-gray-700 border-b">
            {day}
          </div>
        {/each}
      </div>

      <div class="grid grid-cols-7">
        {#each displayedDays as day}
          {@const attendance = getAttendanceStatus(day)}
          {@const shiftCode = getShiftCode(day)}
          {@const record = attendanceRecords.find(
            (a) =>
              format(parseISO(a.shiftDay), "yyyy-MM-dd") ===
              format(day, "yyyy-MM-dd")
          )}
          <button
            class="day-cell {getDateStyles(
              day
            )} hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:hover:bg-transparent disabled:cursor not-allowed"
            on:click={() => handleDateSelect(day)}
          >
            <div class="flex flex-col h-full">
              <div class="text-sm font-medium text-left">
                {format(day, "dd")}
              </div>
              {#if showStatus && isPastDay(day)}
                {#if attendance}
                  <div class="flex-grow flex items-center justify-center">
                    <span
                      class="text-lg font-medium {attendance.className} px-2 py-1 rounded"
                    >
                      {attendance.status}
                    </span>
                  </div>
                {/if}
                {#if shiftCode}
                  <div class="text-right text-xs text-gray-600">
                    {shiftCode}
                  </div>
                {/if}
                {#if record?.needsRegularization}
                  <div class="text-right text-xs">
                    <button
                      class="text-blue-600 hover:text-blue-800"
                      on:click|stopPropagation={() =>
                        dispatch("openRegularization", { date: day })}
                      aria-label="Regularize attendance for {format(
                        day,
                        'yyyy-MM-dd'
                      )}"
                    >
                      Regularize
                    </button>
                  </div>
                {/if}
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .calendar-container {
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .calendar-body {
    background-color: white;
  }

  .day-cell {
    transition: all 200ms ease-in-out;
    min-height: 100px;
  }

  .day-cell:not(:disabled):hover {
    transform: scale(1.02);
  }

  .loader {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
