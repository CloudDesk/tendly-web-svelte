<script lang="ts">
  import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isBefore, isWeekend, isToday } from 'date-fns';
  import { ArrowLeft, ArrowRight } from 'lucide-svelte';
  import { attendanceStore, fetchAttendanceRecords } from '$lib/stores/attendance';
  import { onMount } from 'svelte';
  import { getMonthStartEnd } from '$lib/utils/date';
  import { auth } from '$lib/stores/auth';

  let currentDate = new Date();
  let calendarDays: Date[] = [];
  const userId: string = $auth.user?._id ?? '';
  const ATTENDANCE_LEGEND = [
    { status: 'W', label: 'Weekend', className: 'bg-gray-50 text-gray-500' },
    { status: '?', label: 'No Record', className: 'bg-yellow-50 text-yellow-600' },
    { status: 'R', label: 'Needs Regularization', className: 'bg-red-50 text-red-600' },
    { status: 'P', label: 'Present', className: 'bg-green-50 text-green-600' }
  ];

  function generateCalendarDays(date: Date) {
    const start = startOfWeek(startOfMonth(date));
    const end = endOfWeek(endOfMonth(date));
    return eachDayOfInterval({ start, end });
  }

  function navigateMonth(direction: 'prev' | 'next') {
    currentDate = direction === 'next' 
      ? addMonths(currentDate, 1)
      : subMonths(currentDate, 1);

    //get start and end dates of the month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth()+1;
    const {start,end}= getMonthStartEnd(year, month);
    fetchAttendanceRecords([userId], start, end);
  }

  interface AttendanceRecord {
    shiftDay: string;
    attendanceStatus: 'incomplete' | 'complete' | 'duplicate_swipes' | 'missing_checkout';
    needsRegularization: boolean;
    shiftCode?: string;
  }

  function getAttendanceStatus(date: Date) {
    if (!isBefore(date, new Date())) {
      return null;
    }

    if (isWeekend(date)) {
      return {
        status: 'W',
        className: 'bg-gray-50 text-gray-500'
      };
    }

    const { records } = $attendanceStore;
    const formattedDate = format(date, 'yyyy-MM-dd');
    const record = records.find(a => a.shiftDay.split('T')[0] === formattedDate);
console.log("date", date, "record", record);
    if (!record) {
      return {
        status: '?',
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

  function getShiftCode(date: Date): string | null {
    const { records } = $attendanceStore;
    const record = records.find(a => a.shiftDay.split('T')[0] === format(date, 'yyyy-MM-dd'));
    return record?.shiftCode || null;
  }

  function getDateStyles(date: Date): string {
    const isCurrentMonth = isSameMonth(date, currentDate);
    const todayClass = isToday(date) ? 'border-blue-400 border-2' : 'border-gray-200';
    const monthClass = !isCurrentMonth ? 'text-gray-400' : '';
    
    return `relative h-24 p-2 border ${todayClass} ${monthClass}`;
  }

  $: calendarDays = generateCalendarDays(currentDate);

  onMount(() => {
    const {start,end} = getMonthStartEnd();
    console.log(start,end);
    fetchAttendanceRecords([userId], start, end);
  });

</script>

<div class="calendar-container">
  <div class="calendar-header flex items-center justify-between p-4 border-b">
    <button 
      class="flex items-center text-gray-600 hover:text-gray-800" 
      on:click={() => navigateMonth('prev')}
    >
      <ArrowLeft class="w-4 h-4 mr-1" />
      <span>Prev</span>
    </button>
    <h2 class="text-lg font-medium">{format(currentDate, 'MMMM yyyy')}</h2>
    <button 
      class="flex items-center text-gray-600 hover:text-gray-800" 
      on:click={() => navigateMonth('next')}
    >
      <span>Next</span>
      <ArrowRight class="w-4 h-4 ml-1" />
    </button>
  </div>

  <div class="calendar-body">
    <div class="grid grid-cols-7 text-sm">
      {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
        <div class="p-2 text-center font-medium text-gray-600 border-b border-r">
          {day}
        </div>
      {/each}
    </div>

    <div class="grid grid-cols-7">
      {#each calendarDays as day}
        {@const attendance = getAttendanceStatus(day)}
        {@const shiftCode = getShiftCode(day)}
        <div class={getDateStyles(day)}>
          <!-- Day number in top-left -->
          <div class="text-sm">
            {format(day, 'dd')}
          </div>
          
          <!-- Status in center -->
          {#if attendance}
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span class="text-lg font-medium {attendance.className} px-2 py-1 rounded">
                {attendance.status}
              </span>
            </div>
          {/if}

          <!-- Shift code in bottom-right -->
          {#if shiftCode}
            <div class="absolute bottom-1 right-2 text-xs text-gray-600">
              {shiftCode}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Legend -->
  <div class="border-t mt-4 p-4">
    <div class="text-sm font-medium mb-2">Legend:</div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      {#each ATTENDANCE_LEGEND as item}
        <div class="flex items-center space-x-2">
          <span class={`inline-flex items-center justify-center w-6 h-6 rounded ${item.className}`}>
            {item.status}
          </span>
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
</style>