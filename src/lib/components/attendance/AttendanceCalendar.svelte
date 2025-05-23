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
  export let showLegend: boolean = true;

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
    WEEKEND: {
      status: "W",
      label: "Weekend",
      description: "Weekend or holiday",
      className: "bg-slate-100 text-slate-600 border-slate-200",
      icon: "🏠",
    },
    UNKNOWN: {
      status: "?",
      label: "Unknown",
      description: "Status not determined",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "❓",
    },
    NEEDS_REGULARIZATION: {
      status: "⚠",
      label: "Needs Regularization",
      description: "Requires attendance correction",
      className: "bg-red-50 text-red-700 border-red-300",
      icon: "⚠️",
    },
    LATE: {
      status: "L",
      label: "Late",
      description: "Late check-in",
      className: "bg-orange-50 text-orange-700 border-orange-200",
      icon: "⏰",
    },
    ON_TIME: {
      status: "✓",
      label: "On Time",
      description: "Punctual attendance",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: "✅",
    },
    EARLY_EXIT: {
      status: "EE",
      label: "Early Exit",
      description: "Left before scheduled time",
      className: "bg-orange-50 text-orange-700 border-orange-200",
      icon: "🚪",
    },
    PRESENT: {
      status: "P",
      label: "Present",
      description: "Full day attendance",
      className: "bg-green-50 text-green-700 border-green-300",
      icon: "✅",
    },
    OUT_OF_WINDOW: {
      status: "OW",
      label: "Out of Window",
      description: "Swipe outside allowed hours",
      className: "bg-purple-50 text-purple-700 border-purple-200",
      icon: "⏱️",
    },
    ON_LEAVE: {
      status: "LV",
      label: "On Leave",
      description: "Approved leave",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: "🌴",
    },
    ABSENT: {
      status: "A",
      label: "Absent",
      description: "No attendance recorded",
      className: "bg-red-50 text-red-700 border-red-300",
      icon: "❌",
    },
    PENDING_REGULARIZATION: {
      status: "PR",
      label: "Pending Regularization",
      description: "Regularization request submitted",
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: "⏳",
    },
    REGULARIZED: {
      status: "R",
      label: "Regularized",
      description: "Attendance corrected & approved",
      className: "bg-teal-50 text-teal-700 border-teal-200",
      icon: "✔️",
    },
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
      ? "ring-2 ring-blue-400 ring-offset-1"
      : "";
    const monthClass = !isCurrentMonth
      ? "text-gray-400 bg-gray-50"
      : "bg-white";
    const selectedClass = isSelected ? "bg-blue-50 ring-2 ring-blue-300" : "";
    const hoverClass = "hover:bg-blue-25 hover:shadow-sm";

    return `relative h-28 p-2 border border-gray-200 transition-all duration-200 ${todayClass} ${monthClass} ${selectedClass} ${hoverClass}`;
  }
</script>

<div class="space-y-6">
  <!-- Calendar Component -->
  <div
    class="calendar-container bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200"
  >
    <!-- Calendar Header -->
    <div
      class="calendar-header flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200"
    >
      <button
        class="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-white/60 transition-all duration-200 font-medium"
        on:click={() => navigateMonth("prev")}
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Previous
      </button>

      <h2 class="text-xl font-bold text-gray-800 tracking-tight">
        {format($currentDate, "MMMM yyyy")}
      </h2>

      <button
        class="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-white/60 transition-all duration-200 font-medium"
        on:click={() => navigateMonth("next")}
      >
        Next
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>

    {#if isLoading}
      <div class="flex justify-center items-center h-64 bg-gray-50">
        <Loader />
      </div>
    {:else}
      <div class="calendar-body">
        <!-- Day Headers -->
        <div class="grid grid-cols-7 text-sm bg-gray-100">
          {#each ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as day}
            <div
              class="p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          {/each}
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-0">
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
              )} focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:cursor-not-allowed group"
              on:click={() => handleDateSelect(day)}
            >
              <div class="flex flex-col h-full justify-between">
                <!-- Date Number -->
                <div class="flex justify-between items-start">
                  <span
                    class="text-sm font-semibold {isToday(day)
                      ? 'text-blue-600'
                      : ''}"
                  >
                    {format(day, "dd")}
                  </span>
                  {#if shiftCode}
                    <span
                      class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium"
                    >
                      {shiftCode}
                    </span>
                  {/if}
                </div>

                <!-- Status Display -->
                {#if showStatus && isPastDay(day)}
                  <div class="flex-grow flex items-center justify-center py-2">
                    {#if attendance}
                      <div
                        class="status-badge {attendance.className} border rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm"
                      >
                        <span class="mr-1">{attendance.icon}</span>
                        {attendance.status}
                      </div>
                    {/if}
                  </div>

                  <!-- Regularization Button -->
                  {#if record?.needsRegularization}
                    <div class="mt-2">
                      <button
                        class="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded-md font-medium transition-colors duration-200 w-full"
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
                {:else if !isPastDay(day) && !isWeekendDay(day)}
                  <div
                    class="flex-grow flex items-center justify-center text-gray-400 text-xs"
                  >
                    Future
                  </div>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Legend Component -->
  {#if showLegend}
    <div
      class="legend-card bg-white shadow-lg rounded-lg border border-gray-200 p-6"
    >
      <div class="flex items-center gap-2 mb-4">
        <svg
          class="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="text-lg font-semibold text-gray-800">
          Attendance Status Legend
        </h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each Object.values(ATTENDANCE_STATUSES) as status}
          <div
            class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
          >
            <div
              class="status-badge {status.className} border rounded px-2 py-1 text-xs font-semibold flex-shrink-0"
            >
              <span class="mr-1">{status.icon}</span>
              {status.status}
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-medium text-gray-900 text-sm">
                {status.label}
              </div>
              <div class="text-xs text-gray-600 mt-0.5">
                {status.description}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Additional Information -->
      <div class="mt-6 pt-4 border-t border-gray-200">
        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600"
        >
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded border-2 border-blue-400"></div>
            <span>Today's date</span>
          </div>
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded bg-blue-50 border border-blue-300"
            ></div>
            <span>Selected date</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-gray-100 text-gray-500"></div>
            <span>Shift code (top right)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-blue-100"></div>
            <span>Regularize button (when needed)</span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .calendar-container {
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .day-cell {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 112px;
  }

  .day-cell:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .status-badge {
    transition: all 0.2s ease-in-out;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .status-badge:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .legend-card {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .bg-blue-25 {
    background-color: #f8faff;
  }

  @media (max-width: 768px) {
    .day-cell {
      min-height: 96px;
    }

    .status-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }
  }
</style>
