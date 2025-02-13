<script lang="ts">
  import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isBefore, isWeekend, isToday } from 'date-fns';
  import { ArrowLeft, ArrowRight } from 'lucide-svelte';
  import { attendanceStore } from '$lib/stores/attendance';
  import { createEventDispatcher, onMount } from 'svelte';
  import { getMonthStartEnd } from '$lib/utils/date';
  import { auth } from '$lib/stores/auth';
  import { writable, derived } from 'svelte/store';


  export let selectedDate: Date;
  export let records: any[];

  const dispatch = createEventDispatcher<{
    dateSelect: Date;
  }>();
  let currentDate = new Date();
  let calendarDays: Date[] = [];
  const userId: string = $auth.user?._id ?? '';
  const isLoading = writable<boolean>(false);

  const ATTENDANCE_LEGEND = [
    { status: 'W', label: 'Weekend', className: 'bg-gray-50 text-gray-500' },
    { status: 'U', label: 'Unknown', className: 'bg-yellow-50 text-yellow-600' },
    { status: 'R', label: 'Needs Regularization', className: 'bg-red-50 text-red-600' },
    { status: 'P', label: 'Present', className: 'bg-green-50 text-green-600' }
  ];

  // Create a derived store for attendance records
  const attendanceRecords = derived(attendanceStore, ($store) => $store.records);

  function generateCalendarDays(date: Date) {
    const start = startOfWeek(startOfMonth(date));
    const end = endOfWeek(endOfMonth(date));
    return eachDayOfInterval({ start, end });
  }

  async function navigateMonth(direction: 'prev' | 'next') {
    currentDate = direction === 'next' 
      ? addMonths(currentDate, 1)
      : subMonths(currentDate, 1);
console.log("nnavigateMonthav",currentDate);
    calendarDays = generateCalendarDays(currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const { start, end } = getMonthStartEnd(year, month);
    isLoading.set(true);
    await attendanceStore.fetch([userId], start, end);
    isLoading.set(false);
  }

  function getAttendanceStatus(date: Date, records: any[]) {
    if (!isBefore(date, new Date())) {
      return null;
    }

    if (isWeekend(date)) {
      return {
        status: 'W',
        className: 'bg-gray-50 text-gray-500'
      };
    }

    const formattedDate = format(date, 'yyyy-MM-dd');
    const record = records.find(a => a.shiftDay.split('T')[0] === formattedDate);
    if (!record) {
      return {
        status: 'U',
        className: 'bg-yellow-50 text-yellow-600'
      };
    }

    if (!record.status.includes('complete') || record.needsRegularization) {
      return {
        status: 'R',
        className: 'bg-red-50 text-red-600'
      };
    }

    return {
      status: 'P',
      className: 'bg-green-50 text-green-600'
    };
  }

  function getShiftCode(date: Date, records: any[]): string | null {
    const record = records.find(a => a.shiftDay.split('T')[0] === format(date, 'yyyy-MM-dd'));
    return record?.shiftCode || null;
  }

  function getDateStyles(date: Date): string {
    const isCurrentMonth = isSameMonth(date, currentDate);
    const todayClass = isToday(date) ? 'border-blue-400 border-2' : 'border-gray-200';
    const monthClass = !isCurrentMonth ? 'text-gray-400 cursor-not-allowed' : '';
    
    return `relative h-24 p-2 border ${todayClass} ${monthClass}`;
  }

  function handleDateSelect(date: Date) {
    if (!isSameMonth(date, currentDate)) {
      return;
    }
    dispatch('dateSelect', date);
  }

  $: {
    if (selectedDate && !isSameMonth(selectedDate, currentDate)) {
      currentDate = selectedDate;
      const { start, end } = getMonthStartEnd(
        currentDate.getFullYear(), 
        currentDate.getMonth() + 1
      );
      attendanceStore.fetch([userId], start, end);
    }
  }
  
  $: calendarDays = generateCalendarDays(currentDate);

  onMount(async () => {
    const { start, end } = getMonthStartEnd();
    isLoading.set(true);
    await attendanceStore.fetch([userId], start, end);
    isLoading.set(false);
  });
</script>

<div class="calendar-container">
  <div class="calendar-header flex items-center justify-between p-4 border-b">
    <button class="flex items-center text-gray-600 hover:text-gray-800" on:click={() => navigateMonth('prev')}>
      <ArrowLeft class="w-4 h-4 mr-1" />
      <span>Prev</span>
    </button>
    <h2 class="text-lg font-medium">{format(currentDate, 'MMMM yyyy')}</h2>
    <button class="flex items-center text-gray-600 hover:text-gray-800" on:click={() => navigateMonth('next')}>
      <span>Next</span>
      <ArrowRight class="w-4 h-4 ml-1" />
    </button>
  </div>

  {#if $isLoading}
    <div class="flex justify-center items-center h-64">
      <div class="loader"></div>
    </div>
  {:else}
    <div class="calendar-body">
      <div class="grid grid-cols-7 text-sm">
        {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
          <div class="p-2 text-center font-medium text-gray-600 border-b border-r">{day}</div>
        {/each}
      </div>

      <div class="grid grid-cols-7">
        {#each calendarDays as day}
          {@const attendance = getAttendanceStatus(day, $attendanceRecords)}
          {@const shiftCode = getShiftCode(day, $attendanceRecords)}
          <button class="day-cell {getDateStyles(day)}"
            disabled={!isSameMonth(day, currentDate)}
            on:click={() => handleDateSelect(day)}
          >
            <div class="text-sm">{format(day, 'dd')}</div>
            {#if attendance}
              <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span class="text-lg font-medium {attendance.className} px-2 py-1 rounded">{attendance.status}</span>
              </div>
            {/if}
            {#if shiftCode}
              <div class="absolute bottom-1 right-2 text-xs text-gray-600">{shiftCode}</div>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="border-t mt-4 p-4">
    <div class="text-sm font-medium mb-2">Legend:</div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      {#each ATTENDANCE_LEGEND as item}
        <div class="flex items-center space-x-2">
          <span class={`inline-flex items-center justify-center w-6 h-6 rounded ${item.className}`}>{item.status}</span>
          <span class="text-sm text-gray-600">{item.label}</span>
        </div>
      {/each}
    </div>
  </div>
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

  :global(.calendar-day) {
    transition: background-color 0.2s ease;
  }

  :global(.calendar-day:hover) {
    background-color: #f7fafc;
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
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .cursor-not-allowed {
    cursor: not-allowed;
  }
</style>