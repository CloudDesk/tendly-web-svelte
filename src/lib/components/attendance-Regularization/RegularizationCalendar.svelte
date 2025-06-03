<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";
  import { auth } from "$lib/stores/auth";
  import {
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
  } from "lucide-svelte";
  import type { AttendanceRegularization } from "$lib/services/api/attendance-regularization";

  // Types
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
  // New interface for Leave records
  interface LeaveRecord {
    _id: string;
    userId: string;
    leaveTypeId: string;
    leaveType: string;
    startDate: string; // YYYY-MM-DD format
    endDate: string; // YYYY-MM-DD format
    status: string;
    noOfDays: number;
    reason: string;
    appliedTo: any;
    createdAt: string;
    updatedAt: string;
    user: {
      name: string;
      email: string;
    };
  }

  // Props
  export let selectedDates: Date[] = []; // Array of selected dates
  export let weekendDays: number[] = [0, 6]; // Default weekends (Sunday, Saturday)
  export let year: number = new Date().getFullYear();
  export let month: number = new Date().getMonth(); // 0-based index for months
  export let allowFutureDates: boolean = false; // Control whether future dates can be selected
  export let maxFutureDays: number = 30; // How many days in the future can be selected
  export let regularizationRecords: Record<string, AttendanceRegularization> =
    {}; // Regularization records
  export let isLoading: boolean = false; // Loading state
  export let leaveRecords: LeaveRecord[] = [];

  console.log(leaveRecords, " leaveRecords");
  const dispatch = createEventDispatcher();
  const user = ($auth.user as User) || {};
  console.log(user, "users");

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Reset time portion for accurate comparisons

  const daysInMonth = writable<Date[]>([]); // Days to display in the calendar
  const emptyDays = writable<number>(0); // Empty days at start of month grid
  const userShifts = writable<Record<string, ShiftInfo>>({});

  // User display information
  const userName = user.name || "User Name";
  const userCode = user.biometricId || "#EMP001";
  const userAvatar = user.avatar;

  // Utility functions
  function getDateString(date: Date): string {
    // Using local date methods to avoid timezone issues completely
    // Ensure we're working with the actual calendar date displayed to the user
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const result = `${year}-${month}-${day}`;
    console.log(`Converting date object to string: ${date} → ${result}`);
    return result;
  }

  function getRegularizationRecord(
    date: Date
  ): AttendanceRegularization | null {
    // Format date to YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    console.log(
      "Looking for record for date:",
      dateStr,
      "Available records:",
      regularizationRecords
    );
    return regularizationRecords[dateStr] || null;
  }
  // Function to get leave record for a specific date
  function getLeaveRecord(date: Date): LeaveRecord | null {
    // Get date string in YYYY-MM-DD format using our local method
    const dateStr = getDateString(date);

    // Debug logging
    console.log(
      `[LEAVE CHECK] Checking if date ${dateStr} has leave records among ${leaveRecords.length} records`
    );

    // Compare using direct string equality to avoid any timezone issues
    const result =
      leaveRecords.find((leave) => {
        // Only consider leaves with Pending or Approved status
        if (leave.status !== "Pending" && leave.status !== "Approved") {
          return false;
        }

        // Get start and end date strings directly from the leave record
        const startDateStr = leave.startDate;
        const endDateStr = leave.endDate;

        // Check if the dateStr is exactly equal to any day in the range
        // Convert everything to date objects to iterate through each day
        const checkDate = new Date(dateStr);
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        // Reset hours to avoid timezone issues
        checkDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        // Check if checkDate is between startDate and endDate (inclusive)
        const isInRange = checkDate >= startDate && checkDate <= endDate;

        console.log(
          `[LEAVE CHECK DETAIL] ${dateStr} comparing to leave from ${startDateStr} to ${endDateStr}: ${isInRange ? "MATCH" : "NO MATCH"}`
        );

        return isInRange;
      }) || null;

    console.log(
      `[LEAVE RESULT] Date ${dateStr}: ${result ? "HAS LEAVE" : "NO LEAVE"}`
    );
    return result;
  }

  // Function to check if date has blocking leave status
  function hasBlockingLeaveStatus(date: Date): boolean {
    const dateStr = getDateString(date);
    console.log(`[BLOCKING CHECK] Testing if ${dateStr} is blocked by leave`);

    const leaveRecord = getLeaveRecord(date);
    const result = leaveRecord
      ? leaveRecord.status === "Pending" || leaveRecord.status === "Approved"
      : false;

    // Always log the result for debugging
    console.log(
      `[BLOCKING RESULT] Date ${dateStr} is ${result ? "BLOCKED" : "NOT BLOCKED"} by leave ${leaveRecord ? `(${leaveRecord.status})` : ""}`
    );

    return result;
  }

  function hasBlockingStatus(date: Date): boolean {
    const record = getRegularizationRecord(date);
    return record
      ? record.status === "Pending" || record.status === "Approved"
      : false;
  }
  // Enhanced function to check if date is blocked by either regularization or leave
  function hasAnyBlockingStatus(date: Date): boolean {
    const dateStr = getDateString(date);
    const isRegBlocked = hasBlockingStatus(date);
    const isLeaveBlocked = hasBlockingLeaveStatus(date);
    const result = isRegBlocked || isLeaveBlocked;

    console.log(
      `[FINAL BLOCK CHECK] Date ${dateStr}: Reg=${isRegBlocked}, Leave=${isLeaveBlocked}, Final=${result}`
    );
    return result;
  }

  function getStatusInfo(status: AttendanceRegularization["status"]) {
    switch (status) {
      case "Pending":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          label: "Pending",
        };
      case "Approved":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          label: "Approved",
        };
      case "Rejected":
      case "Rejected-Absent":
      case "Rejected-Leave":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          label: "Rejected",
        };
      case "Withdrawn":
        return {
          icon: AlertCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          label: "Withdrawn",
        };
      default:
        return null;
    }
  }

  // New function to get leave status info
  function getLeaveStatusInfo(status: string) {
    switch (status) {
      case "Pending":
        return {
          icon: Calendar,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          label: "Leave Pending",
        };
      case "Approved":
        return {
          icon: Calendar,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          label: "Leave Approved",
        };
      default:
        return null;
    }
  }

  // Generate days for the current month
  function generateDays(year: number, month: number) {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysCount = lastDayOfMonth.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay();

    const days: Date[] = [];
    emptyDays.set(firstDayOfWeek);

    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i));
    }

    daysInMonth.set(days);
    console.log(
      "Days generated:",
      days.map((d) => d.toISOString())
    );
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

  // Handle date selection with enhanced blocking logic
  function toggleDateSelection(date: Date) {
    // Check if the date is selectable
    if (!isDateSelectable(date)) return;

    // Check for blocking regularization status
    if (hasBlockingStatus(date)) {
      const record = getRegularizationRecord(date);
      console.log(
        `Date ${getDateString(date)} is blocked due to ${record?.status} status`
      );
      return;
    }
    // Check for blocking leave status
    if (hasBlockingLeaveStatus(date)) {
      const leaveRecord = getLeaveRecord(date);
      console.log(
        `Date ${getDateString(date)} is blocked due to leave ${leaveRecord?.status} status`
      );
      return;
    }
    const index = selectedDates.findIndex(
      (selectedDate) => selectedDate.toDateString() === date.toDateString()
    );

    if (index === -1) {
      // Add the date
      selectedDates = [...selectedDates, date];
    } else {
      // Remove the date but preserve form data in parent component
      selectedDates = selectedDates.filter(
        (selectedDate) => selectedDate.toDateString() !== date.toDateString()
      );
    }

    // Force a UI update by reassigning selectedDates
    selectedDates = [...selectedDates];

    // Use consistent cloned array to prevent reference issues
    const selectedDatesClone = [...selectedDates];
    dispatch("dateSelect", { selectedDates: selectedDatesClone });
  }

  // Enhanced date selectability check
  function isDateSelectable(date: Date): boolean {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    // Check for blocking regularization status first
    if (hasBlockingStatus(date)) return false;

    // Check for blocking leave status
    if (hasBlockingLeaveStatus(date)) return false;

    // Always allow past dates (if not blocked by regularization)
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

  // Get regularization summary for selected dates section
  function getRegularizationSummary() {
    const summary = {
      pending: 0,
      approved: 0,
      rejected: 0,
      withdrawn: 0,
      total: Object.keys(regularizationRecords).length,
    };

    Object.values(regularizationRecords).forEach((record) => {
      switch (record.status) {
        case "Pending":
          summary.pending++;
          break;
        case "Approved":
          summary.approved++;
          break;
        case "Rejected":
        case "Rejected-Absent":
        case "Rejected-Leave":
          summary.rejected++;
          break;
        case "Withdrawn":
          summary.withdrawn++;
          break;
      }
    });

    return summary;
  }
  // New function to get leave summary
  function getLeaveSummary() {
    const summary = {
      pending: 0,
      approved: 0,
      total: leaveRecords.length,
    };

    leaveRecords.forEach((leave) => {
      switch (leave.status) {
        case "Pending":
          summary.pending++;
          break;
        case "Approved":
          summary.approved++;
          break;
      }
    });

    return summary;
  }
  // Watch for changes in regularizationRecords
  $: {
    if (
      regularizationRecords &&
      Object.keys(regularizationRecords).length > 0
    ) {
      console.log(
        "RegularizationCalendar records updated:",
        regularizationRecords
      );
      // Force calendar update
      daysInMonth.update((days) => [...days]);
    }
  }
  // Watch for changes in leaveRecords
  $: {
    if (leaveRecords && leaveRecords.length > 0) {
      console.log("Leave records updated:", leaveRecords);
      // Force calendar update
      daysInMonth.update((days) => [...days]);
    }
  }
  // Initialize days on mount and when month/year changes
  $: {
    generateDays(year, month);
    console.log("Calendar days generated:", $daysInMonth);
  }

  // Get regularization records summary
  $: regularizationSummary = getRegularizationSummary();
  // Get leave records summary
  $: leaveSummary = getLeaveSummary();
</script>

<div class="flex flex-col gap-3">
  <!-- Loading overlay for calendar -->
  <div class="relative">
    {#if isLoading}
      <div
        class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded"
      >
        <div class="flex items-center gap-2 text-blue-600">
          <div
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"
          ></div>
          <span class="text-sm">Loading...</span>
        </div>
      </div>
    {/if}

    <div class="calendar-wrapper bg-white rounded shadow p-3">
      <div class="month-nav flex justify-between items-center mb-3 px-2">
        <button
          class="nav-btn flex items-center gap-1 text-gray-700 hover:bg-gray-100 p-1 rounded"
          on:click={() => handleMonthChange("prev")}
          disabled={isLoading}
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
          disabled={isLoading}
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
          {@const regularizationRecord = getRegularizationRecord(day)}
          {@const statusInfo = regularizationRecord
            ? getStatusInfo(regularizationRecord.status)
            : null}
          {@const hasBlocking = hasAnyBlockingStatus(day)}
          {@const leaveRecord = getLeaveRecord(day)}
          {@const leaveStatusInfo = leaveRecord
            ? getLeaveStatusInfo(leaveRecord.status)
            : null}
          <div
            class="calendar-day p-1 text-center cursor-pointer transition-colors relative"
            class:selected
            class:weekend={isWeekend(day)}
            class:today={isToday(day)}
            class:past={isPast(day)}
            class:future={isFuture(day)}
            class:disabled={!selectable}
            class:blocked={hasBlocking}
            class:hover-effect={selectable && !selected && !hasBlocking}
            class:has-regularization={!!regularizationRecord}
            class:has-leave={!!leaveRecord}
            title={leaveRecord
              ? `Leave: ${leaveRecord.status} - ${leaveRecord.leaveType || ""} - ${leaveRecord.reason || "No reason provided"}`
              : regularizationRecord
                ? `Regularization: ${regularizationRecord.status} - ${regularizationRecord.reason}`
                : ""}
            on:click={() => toggleDateSelection(day)}
          >
            <div class="day-number text-sm font-medium">{day.getDate()}</div>

            <!-- Status indicator -->
            {#if statusInfo && regularizationRecord}
              <div class="status-indicator absolute top-0 right-0 p-0.5">
                <svelte:component
                  this={statusInfo.icon}
                  size={10}
                  class={statusInfo.color}
                />
              </div>
              <!-- Status badge -->
              <div
                class="status-badge text-xs {statusInfo.bgColor} {statusInfo.color} px-1 py-0.5 rounded mt-0.5"
              >
                {regularizationRecord.status.charAt(0)}
              </div>
            {/if}
            {#if leaveStatusInfo}
              <!-- Leave status indicator -->
              <div class="leave-indicator absolute top-0 left-0 p-0.5">
                <svelte:component
                  this={leaveStatusInfo.icon}
                  size={10}
                  class={leaveStatusInfo.color}
                />
              </div>
              <!-- Leave status badge -->
              <div
                class="leave-badge status-badge text-xs {leaveStatusInfo.bgColor} {leaveStatusInfo.color} px-1 py-0.5 rounded mt-0.5"
              >
                L
              </div>
            {/if}
          </div>
        {/each}

        {#each Array(42 - $daysInMonth.length - $emptyDays) as _, i}
          <div class="empty-day p-1 text-center text-xs text-gray-400">
            {i + 1}
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- {#if regularizationSummary.total > 0 || leaveSummary.total > 0}
    <div class="summary-section">
      {#if regularizationSummary.total > 0}
        <div class="regularization-summary p-3 bg-blue-50 rounded border mb-2">
          <p class="text-sm font-medium mb-2 text-blue-800">
            Regularization Summary ({regularizationSummary.total} records)
          </p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            {#if regularizationSummary.pending > 0}
              <div class="flex items-center gap-1 text-yellow-700">
                <Clock size={12} />
                <span>Pending: {regularizationSummary.pending}</span>
              </div>
            {/if}
            {#if regularizationSummary.approved > 0}
              <div class="flex items-center gap-1 text-green-700">
                <CheckCircle size={12} />
                <span>Approved: {regularizationSummary.approved}</span>
              </div>
            {/if}
            {#if regularizationSummary.rejected > 0}
              <div class="flex items-center gap-1 text-red-700">
                <XCircle size={12} />
                <span>Rejected: {regularizationSummary.rejected}</span>
              </div>
            {/if}
            {#if regularizationSummary.withdrawn > 0}
              <div class="flex items-center gap-1 text-gray-700">
                <AlertCircle size={12} />
                <span>Withdrawn: {regularizationSummary.withdrawn}</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      {#if leaveSummary.total > 0}
        <div class="leave-summary p-3 bg-orange-50 rounded border">
          <p class="text-sm font-medium mb-2 text-orange-800">
            Leave Summary ({leaveSummary.total} records)
          </p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            {#if leaveSummary.pending > 0}
              <div class="flex items-center gap-1 text-orange-700">
                <Calendar size={12} />
                <span>Pending: {leaveSummary.pending}</span>
              </div>
            {/if}
            {#if leaveSummary.approved > 0}
              <div class="flex items-center gap-1 text-purple-700">
                <Calendar size={12} />
                <span>Approved: {leaveSummary.approved}</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if} -->

  <!-- Selected dates section -->
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

  /* Blocked dates styling */
  .calendar-day.blocked {
    background-color: #fef3c7;
    color: #92400e;
    cursor: not-allowed;
    border-color: #f59e0b;
  }

  .calendar-day.blocked:hover {
    background-color: #fbbf24;
  }

  /* Regularization and leave status styling */
  .calendar-day.has-regularization .day-number,
  .calendar-day.has-leave .day-number {
    margin-bottom: 0;
  }

  /* Ensure leave-related days have a subtle border */
  .calendar-day.has-leave:not(.selected) {
    border: 1px solid #f97316;
  }

  .calendar-day.has-leave:hover:not(.selected):not(.blocked) {
    background-color: #fff7ed;
  }

  .status-indicator {
    position: absolute;
    top: 2px;
    right: 2px;
  }

  .leave-indicator {
    position: absolute;
    top: 2px;
    left: 2px;
    z-index: 2;
  }

  .leave-badge {
    background-color: #ffedd5;
    color: #c2410c;
    border: 1px solid #fb923c;
  }

  .status-badge {
    font-size: 8px;
    line-height: 1;
    min-width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-btn {
    font-size: 0.875rem;
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  /* Regularization summary styling */
  .regularization-summary {
    border-left: 4px solid #3b82f6;
  }
  /* Summary styling */
  .regularization-summary {
    border-left: 4px solid #3b82f6;
  }

  .leave-summary {
    border-left: 4px solid #f97316;
  }
</style>
