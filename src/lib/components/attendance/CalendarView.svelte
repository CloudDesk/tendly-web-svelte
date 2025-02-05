<script lang="ts">
  import { onMount } from 'svelte';
  import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
  import { ArrowLeft, ArrowRight } from 'lucide-svelte';

  // Types
  interface AttendanceData {
    date: string;
    status?: 'present' | 'absent' | 'leave';
    workHours?: number;
    actualWorkHours?: number;
    penalties?: number;
  }

  // Props and state
  let currentDate = new Date();
  let calendarDays: Date[] = [];
  let attendance: AttendanceData[] = []; // This would come from your API/store
  let weekOffs = ["sun", "sat"]; // Example week-offs

  // Stats for the month
  let avgWorkHours = '-';
  let avgActualWorkHours = '-';
  let penaltyDays = 0;

  function generateCalendarDays(date: Date) {
    const start = startOfWeek(startOfMonth(date));
    const end = endOfWeek(endOfMonth(date));
    return eachDayOfInterval({ start, end });
  }

  function navigateMonth(direction: 'prev' | 'next') {
    currentDate = direction === 'next' 
      ? addMonths(currentDate, 1)
      : subMonths(currentDate, 1);
    calendarDays = generateCalendarDays(currentDate);
  }

  function getAttendanceForDate(date: Date): AttendanceData | undefined {
    return attendance.find(a => a.date === format(date, 'yyyy-MM-dd'));
  }

  function getDayClass(date: Date) {
    const att = getAttendanceForDate(date);
    const baseClass = 'calendar-day relative p-4 border border-gray-200';
    const todayClass = isToday(date) ? 'bg-blue-100 font-bold' : '';
    const weekOffClass = isWeekOff(date) ? 'bg-gray-100 text-gray-500' : '';
    
    if (!isSameMonth(date, currentDate)) {
      return `${baseClass} text-gray-400`;
    }

    if (att?.status === 'present') {
      return `${baseClass} bg-green-50 ${todayClass} ${weekOffClass}`;
    } else if (att?.status === 'absent') {
      return `${baseClass} bg-red-50 ${todayClass} ${weekOffClass}`;
    } else if (att?.status === 'leave') {
      return `${baseClass} bg-yellow-50 ${todayClass} ${weekOffClass}`;
    }

    return `${baseClass} ${todayClass} ${weekOffClass}`;
  }

  function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  function isWeekOff(date: Date): boolean {
    const day = format(date, 'eee').toLowerCase();
    return weekOffs.includes(day);
  }

  $: calendarDays = generateCalendarDays(currentDate);
</script>

<div class="calendar-container">
  <!-- Stats Section -->
  <div class="stats-grid mb-6 grid grid-cols-3 gap-4">
    <div class="stat-card p-4 border rounded-lg">
      <h3 class="text-sm text-gray-600">AVG. WORK HRS</h3>
      <p class="text-xl font-semibold">{avgWorkHours}</p>
    </div>
    <div class="stat-card p-4 border rounded-lg">
      <h3 class="text-sm text-gray-600">AVG. ACTUAL WORK HRS</h3>
      <p class="text-xl font-semibold">{avgActualWorkHours}</p>
    </div>
    <div class="stat-card p-4 border rounded-lg">
      <h3 class="text-sm text-gray-600">PENALTY DAYS</h3>
      <p class="text-xl font-semibold">{penaltyDays}</p>
    </div>
  </div>

  <!-- Calendar Header -->
  <div class="calendar-header flex justify-between items-center mb-4">
    <button 
      class="p-2 rounded hover:bg-gray-100"
      on:click={() => navigateMonth('prev')}
    >
      <ArrowLeft class="w-6 h-6" />
    </button>
    <h2 class="text-xl font-semibold">
      {format(currentDate, 'MMMM yyyy')}
    </h2>
    <button 
      class="p-2 rounded hover:bg-gray-100"
      on:click={() => navigateMonth('next')}
    >
      <ArrowRight class="w-6 h-6" />
    </button>
  </div>

  <!-- Calendar Grid -->
  <div class="calendar-grid">
    <!-- Week days header -->
    <div class="grid grid-cols-7 mb-2">
      {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
        <div class="text-center text-sm text-gray-600 py-2">{day}</div>
      {/each}
    </div>

    <!-- Calendar days -->
    <div class="grid grid-cols-7 gap-px bg-gray-200">
      {#each calendarDays as day}
        <div class={getDayClass(day)}>
          <!-- Top-left: Display the day number -->
          <span class="absolute top-2 left-2 text-sm">
            {format(day, 'dd')}
          </span>
          
          <!-- Top-right: Reserved for potential future data -->
          <div class="absolute top-2 right-2 text-xs">
            <!-- Future data -->
          </div>

          <!-- Center: Display the status -->
          {#if getAttendanceForDate(day)}
            <div class="mt-4 text-xs text-gray-600">
              {getAttendanceForDate(day)?.status === 'present' ? 'P' : getAttendanceForDate(day)?.status === 'absent' ? 'A' : 'L'}
            </div>
          {:else if isWeekOff(day)}
            <div class="mt-4 text-xs text-gray-600">
              O
            </div>
          {/if}

          <!-- Bottom-left: Reserved for potential future data -->
          <div class="absolute bottom-2 left-2 text-xs">
            <!-- Future data -->
          </div>

          <!-- Bottom-right: Display shift code -->
          {#if getAttendanceForDate(day)?.status}
            <div class="absolute bottom-2 right-2 text-xs text-gray-600">
              {getAttendanceForDate(day)?.status}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .calendar-container {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  }

  .calendar-day {
    min-height: 100px;
    background-color: white;
    transition: background-color 0.3s;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }

  .calendar-day:hover {
    background-color: #f0f0f0;
  }

  .calendar-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    transition: color 0.3s;
  }

  .calendar-icon:hover {
    color: #555;
  }

  .calendar-grid {
    aspect-ratio: 7/5;
  }

  .stat-card {
    background-color: white;
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .calendar-header button {
    background: none;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .calendar-header button:hover {
    background-color: #f0f0f0;
  }
</style>