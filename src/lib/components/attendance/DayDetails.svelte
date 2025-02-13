<script lang="ts">
    import { format } from 'date-fns';
    import type { AttendanceRecord } from '$lib/types/attendance';
    import { createEventDispatcher } from 'svelte';
  
    export let selectedDate: Date;
    export let records: AttendanceRecord[];
  
    const dispatch = createEventDispatcher();
  
    $: console.log("DayDetails date changed:", selectedDate);
    $: console.log("DayDetails records:", records);

  $: formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
  $: isToday = formattedSelectedDate === format(new Date(), 'yyyy-MM-dd');


  $: record = records?.find(r => {
    const formattedShiftDay = format(new Date(r.shiftDay), 'yyyy-MM-dd');
    console.log("Comparing:", formattedShiftDay, formattedSelectedDate);
    return formattedShiftDay === formattedSelectedDate;
  });

  $: console.log("DayDetails found record:", record);

  async function handleApplyRegularization(record: AttendanceRecord) {
    console.log("Applying regularization", record);
    dispatch('applyRegularization', record);
  }

  </script>
  
  <div class="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 h-full space-y-6">
    <h3 class="text-2xl font-semibold text-gray-800">
      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
    </h3>
  
    {#if record}
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <span class="text-sm text-gray-500">Shift</span>
            <p class="text-lg font-semibold text-gray-900">{record.shiftCode}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Status</span>
            <p class="text-lg font-semibold text-gray-900">{record.status}</p>
          </div>
        </div>
  
        <div class="grid grid-cols-2 gap-6">
          <div>
            <span class="text-sm text-gray-500">Shift Start</span>
            <p class="text-lg font-semibold text-gray-900">
              {record.shiftStart
                ? format(new Date(record.shiftStart), 'hh:mm a')
                : '-'}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Shift End</span>
            <p class="text-lg font-semibold text-gray-900">
              {record.shiftEnd
                ? format(new Date(record.shiftEnd), 'hh:mm a')
                : '-'}
            </p>
          </div>
        </div>
  
        <div class="grid grid-cols-2 gap-6">
          <div>
            <span class="text-sm text-gray-500">First In</span>
            <p class="text-lg font-semibold text-gray-900">
              {record.firstIn
                ? format(new Date(record.firstIn), 'hh:mm a')
                : '-'}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Last Out</span>
            <p class="text-lg font-semibold text-gray-900">
              {record.lastOut && record.lastOut !== record.firstIn
                ? format(new Date(record.lastOut), 'hh:mm a')
                : '-'}
            </p>
          </div>
        </div>
  
        <div class="grid grid-cols-2 gap-6">
          <div>
            <span class="text-sm text-gray-500">Shift Hours</span>
            <p class="text-lg font-semibold text-gray-900">{record.shiftHours}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Actual Work Hours</span>
            <p class="text-lg font-semibold text-gray-900">{record.actualWorkHours}</p>
          </div>
        </div>
  
        <div class="grid grid-cols-2 gap-6">
          <div>
            <span class="text-sm text-gray-500">Shortfall Hours</span>
            <p class="text-lg font-semibold text-gray-900">{record.shortfallHours}</p>
          </div>
        </div>
  
        {#if record.needsRegularization && !isToday}
          <div class="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-300">
            <span class="font-semibold">Needs Regularization</span>
          </div>
          {#if record.outOfWindowSwipes && record.outOfWindowSwipes?.length > 0}
            <div class="bg-red-50 text-red-600 p-4 rounded-md border border-red-300">
              <div class="font-semibold">Reason: {record.outOfWindowSwipes[0]?.reason}</div>
              <span>Check-in: {record.outOfWindowSwipes[0]?.timestamp
                ? format(new Date(record.outOfWindowSwipes[0]?.timestamp), 'hh:mm a')
                : '-'}</span>
            </div>
          {/if}
          <div class="flex justify-center">
            <button 
              class="text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-6 py-2.5 shadow-lg"
              on:click={() => handleApplyRegularization(record)}
            >
              Apply Regularization
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-gray-500 text-lg">No attendance record for this date</p>
    {/if}
  </div>
  