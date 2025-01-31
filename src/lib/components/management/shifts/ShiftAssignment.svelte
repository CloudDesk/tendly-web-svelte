<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Shift, User } from '$lib/types';
  import { shiftsApi } from '$lib/services/api/';
  import { fromUTCDate } from '$lib/utils/date';

  export let shift: Shift | null = null;
  export let employees: User[] = [];
  export let selectedEmployees: Set<string>;
  export let assignmentStep = 1;
  export let assignmentValidFrom = '';
  export let assignmentValidTill = '';

  const dispatch = createEventDispatcher();

  const employeeColumns = [
    { key: 'name' as keyof User, label: 'Name' },
    { key: 'employeeId' as keyof User, label: 'Employee ID' },
    { 
      key: 'currentShiftAssignment', 
      label: 'Current Shift',
      render: (row: User) => row.currentShiftAssignment 
        ? `${row.currentShiftAssignmentData?.shiftCode} (${fromUTCDate(row.currentShiftAssignmentData?.startDate?.toString())}-${fromUTCDate(row.currentShiftAssignmentData?.endDate?.toString())})`
        : 'No shift assigned'
    },
    { 
      key: 'upcomingShiftAssignment', 
      label: 'Upcoming Shift',
      render: (row: User) => row.upcomingShiftAssignment
        ? `${row.upcomingShiftAssignmentData?.shiftCode} (${fromUTCDate(row.upcomingShiftAssignmentData?.startDate?.toString())}-${fromUTCDate(row.upcomingShiftAssignmentData?.endDate.toString())})`
        : 'No upcoming shift'
    }
  ];

  function handleEmployeeSelect(employee: User) {
    if (selectedEmployees.has(employee._id)) {
      selectedEmployees.delete(employee._id);
    } else {
      selectedEmployees.add(employee._id);
    }
    selectedEmployees = selectedEmployees;
  }

  async function handleAssignmentSubmit() {
    if (!shift?._id || !assignmentValidFrom) return;
    
    dispatch('submit', {
      shiftId: shift._id,
      shiftCode: shift.code,
      employees: Array.from(selectedEmployees),
      dates: {
        validFrom: assignmentValidFrom,
        validTill: assignmentValidTill || undefined
      }
    });
  }
</script>

{#if assignmentStep === 1}
  <div class="space-y-4">
    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th class="w-10">
              <input 
                type="checkbox"
                class="checkbox"
                checked={selectedEmployees.size === employees.length}
                on:change={(e) => {
                  if (e.currentTarget.checked) {
                    employees.forEach(emp => selectedEmployees.add(emp._id));
                  } else {
                    selectedEmployees.clear();
                  }
                  selectedEmployees = selectedEmployees;
                }}
              />
            </th>
            {#each employeeColumns as column}
              <th>{column.label}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each employees as employee}
            <tr class="hover">
              <td>
                <input 
                  type="checkbox"
                  class="checkbox"
                  checked={selectedEmployees.has(employee._id)}
                  on:change={() => handleEmployeeSelect(employee)}
                />
              </td>
              {#each employeeColumns as column}
                <td>
                  {#if column.render}
                    {@html column.render(employee)}
                  {:else}
                    {employee[column.key]}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex justify-between items-center">
      <p class="text-sm text-base-content/70">
        {selectedEmployees.size} employee{selectedEmployees.size === 1 ? '' : 's'} selected
      </p>
      <button 
        class="btn btn-primary"
        disabled={selectedEmployees.size === 0}
        on:click={() => dispatch('step', { step: 2 })}
      >
        Next
      </button>
    </div>
  </div>
{:else}
  <div class="space-y-4">
    <div class="bg-base-200 rounded-lg p-4">
      <h3 class="font-medium mb-2">Selected Shift</h3>
      <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span class="text-base-content/70">Name:</span>
          <span class="ml-1">{shift?.name}</span>
        </div>
        <div>
          <span class="text-base-content/70">Code:</span>
          <span class="ml-1">{shift?.code}</span>
        </div>
        <div>
          <span class="text-base-content/70">Timing:</span>
          <span class="ml-1">{shift?.startTime} - {shift?.endTime}</span>
        </div>
        <div>
          <span class="text-base-content/70">Window:</span>
          <span class="ml-1">{shift?.shiftWindowStart} - {shift?.shiftWindowEnd}</span>
        </div>
        <div>
          <span class="text-base-content/70">Validity:</span>
          <span class="ml-1">{shift?.validFrom} - {shift?.validTill || 'No end date'}</span>
        </div>
        <div>
          <span class="text-base-content/70">Grace Time:</span>
          <span class="ml-1">{shift?.graceTimeInMinutes || 0} minutes</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">Assignment Valid From</label>
        <input 
          type="date" 
          class="input input-bordered" 
          bind:value={assignmentValidFrom}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>
      <div class="form-control">
        <label class="label">Assignment Valid Till</label>
        <input 
          type="date" 
          class="input input-bordered" 
          bind:value={assignmentValidTill}
          min={assignmentValidFrom || new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>

    <div>
      <h3 class="font-medium mb-2">Selected Employees ({selectedEmployees.size})</h3>
      <div class="max-h-60 overflow-y-auto border border-base-200 rounded-lg divide-y">
        {#each employees.filter(emp => selectedEmployees.has(emp._id)) as employee}
          <div class="p-3">
            <p class="font-medium">{employee.name}</p>
            <p class="text-sm text-base-content/70">
              {employee.employeeId} • 
              {employee.currentShiftAssignment 
                ? `Current: ${employee.currentShiftAssignmentData?.shiftCode}`
                : 'No current shift'}
            </p>
          </div>
        {/each}
      </div>
    </div>

    <div class="flex justify-between items-center">
      <button 
        class="btn btn-ghost"
        on:click={() => dispatch('step', { step: 1 })}
      >
        Back
      </button>
      <button 
        class="btn btn-primary"
        disabled={!assignmentValidFrom}
        on:click={handleAssignmentSubmit}
      >
        Confirm Assignment
      </button>
    </div>
  </div>
{/if}