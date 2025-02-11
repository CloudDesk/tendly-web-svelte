<script lang="ts">
    import { format } from 'date-fns';
    import type { AttendanceRecord } from '$lib/types/attendance';
  
    export let date: Date;
    export let records: AttendanceRecord[];
  
  
    $: console.log("DayDetails date changed:", date);
  $: console.log("DayDetails records:", records);

  $: formattedSelectedDate = format(date, 'yyyy-MM-dd');
  $: record = records?.find(r => {
    const formattedShiftDay = format(new Date(r.shiftDay), 'yyyy-MM-dd');
    console.log("Comparing:", formattedShiftDay, formattedSelectedDate);
    return formattedShiftDay === formattedSelectedDate;
  });

  $: console.log("DayDetails found record:", record);


  </script>
  
  <div class="bg-white p-4 rounded-lg shadow-md border border-gray-200 h-full">
    <h3 class="text-lg font-medium mb-4">{format(date, 'EEEE, MMMM d, yyyy')}</h3>
  
    {#if record}
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-500">Shift</span>
            <p class="font-medium">{record.shiftCode}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Status</span>
            <p class="font-medium">{record.status}</p>
          </div>
        </div>
  
        <div>
          <span class="text-sm text-gray-500">Check In</span>
          <p class="font-medium">
            {record.firstIn ? format(new Date(record.firstIn), 'hh:mm a') : '-'}
          </p>
        </div>
  
        <div>
          <span class="text-sm text-gray-500">Check Out</span>
          <p class="font-medium">
            {record.lastOut && record.lastOut !== record.firstIn
              ? format(new Date(record.lastOut), 'hh:mm a')
              : '-'}
          </p>
        </div>
  
        {#if record.needsRegularization}
          <div class="bg-red-50 text-red-600 p-3 rounded">
            Needs regularization
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-gray-500">No attendance record for this date</p>
    {/if}
  </div>