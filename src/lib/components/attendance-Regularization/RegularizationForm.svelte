<script lang="ts">
    import { writable } from 'svelte/store';
    import { auth } from '$lib/stores/auth';
    import { createEventDispatcher } from 'svelte';
    import { format, parseISO } from 'date-fns';
    import type { AttendanceRecord } from '$lib/types';
    
    export let attendance: AttendanceRecord;
    const dispatch = createEventDispatcher();
  
    // Convert UTC times to local for display only
    const shiftStartLocal = new Date(attendance.shiftStart);
    const shiftEndLocal = new Date(attendance.shiftEnd);
    const shiftDateLocal = new Date(attendance.shiftDay);
    
    const reason = writable('');
    const managerName = $auth.user?.managerName || '';
    const managerId = $auth.user?.managerId || '';
  
    function handleSubmit() {
      const regularizationData = {
        attendanceId: attendance._id,
        from: attendance.shiftStart,
        to: attendance.shiftEnd,
        shiftDay: attendance.shiftDay,
        reason: $reason,
        approver: {
          name: managerName,
          id: managerId
        },
        status: 'Pending'
      };
      dispatch('submit', regularizationData);
    }
  </script>
  
  <div class="max-w-2xl mx-auto">
    <!-- <div class="bg-white rounded-xl shadow-lg overflow-hidden"> -->

      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
        <!-- Date and Shift Info Card -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-500">Date</label>
              <div class="mt-1 text-sm font-semibold text-gray-800">
                {format(shiftDateLocal, 'dd MMM yyyy')}
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500">Shift Code</label>
              <div class="mt-1 text-sm font-semibold text-gray-800">
                {attendance?.shiftCode}
              </div>
            </div>
          </div>
          
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-500">Shift Timing</label>
            <div class="mt-1 flex items-center space-x-2 text-sm font-semibold text-gray-800">
              <span class="px-3 py-1 bg-white rounded border border-gray-200">
                {format(shiftStartLocal, 'HH:mm')}
              </span>
              <span class="text-gray-400">to</span>
              <span class="px-3 py-1 bg-white rounded border border-gray-200">
                {format(shiftEndLocal, 'HH:mm')}
              </span>
            </div>
          </div>
        </div>
  
        <!-- Reason Field -->
        <div>
          <label for="reason" class="block text-sm font-medium text-gray-700">
            Reason for Regularization
          </label>
          <div class="mt-1">
            <textarea 
              id="reason" 
              bind:value={$reason} 
              rows="4"
              placeholder="Please provide a detailed reason for regularization request..."
              class="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
              required
            ></textarea>
          </div>
        </div>
  
        <!-- Approver Info -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label class="block text-sm font-medium text-gray-500">Approver Details</label>
          <div class="mt-2 flex items-center">
            <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span class="text-indigo-600 font-semibold text-sm">
                {managerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-700">{managerName}</p>
              <p class="text-xs text-gray-500">Reporting Manager</p>
            </div>
          </div>
        </div>
  
        <!-- Submit Button -->
        <div class="pt-4 flex justify-end gap-4">
          <button 
            type="submit" 
            class=" flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Submit 
          </button>
        </div>
      </form>
    <!-- </div> -->
  </div>