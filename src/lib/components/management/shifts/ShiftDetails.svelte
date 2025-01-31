<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Shift } from '$lib/types';
  
    export let show = false;
    export let shift: Shift | null = null;
  </script>
  

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="font-semibold">Name:</label>
            <p>{shift.name}</p>
          </div>
          <div>
            <label class="font-semibold">Code:</label>
            <p>{shift.code}</p>
          </div>
        </div>
  
        <div>
          <label class="font-semibold">Timing:</label>
          <p>{shift.startTime} - {shift.endTime}</p>
        </div>
  
        <div>
          <label class="font-semibold">Window:</label>
          <p>{shift.shiftWindowStart} - {shift.shiftWindowEnd}</p>
        </div>
  
        <div>
          <label class="font-semibold">Validity:</label>
          <p>{shift.validFrom} - {shift.validTill || 'No end date'}</p>
        </div>
  
        <div>
          <label class="font-semibold">Grace Time:</label>
          <p>{shift.graceTimeInMinutes || 0} minutes</p>
        </div>
      </div>
 