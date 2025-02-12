<script lang="ts">
    import { format } from 'date-fns';
    import type { AttendanceRecord } from '$lib/types/attendance';
  import { writable } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';
  
    export let date: Date;
    export let records: AttendanceRecord[];
  
    const dispatch = createEventDispatcher();
  
    $: console.log("DayDetails date changed:", date);
  $: console.log("DayDetails records:", records);

  $: formattedSelectedDate = format(date, 'yyyy-MM-dd');
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
        <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-sm text-gray-500">Shift Start</span>
          <p class="font-medium">
            <!-- {record.firstIn ? format(new Date(record.firstIn), 'hh:mm a') : '-'} -->
            {record.shiftStart
              ? format(new Date(record.shiftStart), 'hh:mm a')
              : '-'}
          </p>
        </div>
  
        <div>
          <span class="text-sm text-gray-500">Shift End</span>
          <p class="font-medium">
            {record.shiftEnd 
              ? format(new Date(record.shiftEnd), 'hh:mm a')
              : '-'}
          </p>
        </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <span class="text-sm text-gray-500">First In</span>
                <p class="font-medium">
                  <!-- {record.firstIn ? format(new Date(record.firstIn), 'hh:mm a') : '-'} -->
                  {record.firstIn
                    ? format(new Date(record.firstIn), 'hh:mm a')
                    : '-'}
                </p>
              </div>
        
              <div>
                <span class="text-sm text-gray-500">Last Out</span>
                <p class="font-medium">
                  {record.lastOut && record.lastOut !== record.firstIn
                    ? format(new Date(record.lastOut), 'hh:mm a')
                    : '-'}
                </p>
              </div>
            </div>

  <div>
    <span class="text-sm text-gray-500">shiftHours</span>
              <p class="font-medium">{record.shiftHours}</p>
  </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-sm text-gray-500">actualWorkHours</span>
              <p class="font-medium">{record.actualWorkHours}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">shortfallHours</span>
              <p class="font-medium">{record.shortfallHours}</p>
            </div>
          </div>


        {#if record.needsRegularization}
          <div class="bg-red-50 text-red-600 p-3 rounded">
            Needs regularization
          </div>
          {#if record.outOfWindowSwipes&& record.outOfWindowSwipes?.length>0}
            <div class="bg-red-50 text-red-600 p-3 rounded">
             <div>Reason: {record.outOfWindowSwipes[0]?.reason}</div> 
             <span> Check-in : { record.outOfWindowSwipes[0]?.timestamp   ? format(new Date(record.outOfWindowSwipes[0]?.timestamp), 'hh:mm a')
                    : '-'}</span>
             
            </div>
          {/if}
            <div class="flex justify-center">
                <button class="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    on:click={()=>handleApplyRegularization(record)}
                >
                    Apply Regularization
                  </button>
            </div>

        {/if}
      </div>
    {:else}
      <p class="text-gray-500">No attendance record for this date</p>
    {/if}
  </div>