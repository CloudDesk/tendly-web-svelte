<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { User, Shift } from '$lib/types';
  import { fromUTCDate } from '$lib/utils/date';
  import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';

  export let shift: Shift | null = null;
  export let employees: User[] = [];
  export let selectedEmployees: Set<string>;
  export let assignmentStep = 1;
  export let assignmentValidFrom = '';
  export let assignmentValidTill = '';

  const dispatch = createEventDispatcher();

  let showDialog = false;
  let dialogConfig = {
    title: 'Confirm Shift Assignment',
    message: '',
    confirmText: 'Proceed with Valid Assignments',
    cancelText: 'Cancel',
    type: 'warning' as const
  };

  let confirmationData = {
    validEmployees: [],
    invalidEmployees: []
  };

  $: dateError = validateDates();

  function validateDates(): string {
    const fromDate = new Date(assignmentValidFrom);
    const tillDate = assignmentValidTill ? new Date(assignmentValidTill) : null;

    if (tillDate && tillDate <= fromDate) {
      return 'End date must be after start date';
    }

    return '';
  }

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
        ? `${row.upcomingShiftAssignmentData?.shiftCode} (${fromUTCDate(row.upcomingShiftAssignmentData?.startDate?.toString())}-${fromUTCDate(row.upcomingShiftAssignmentData?.endDate?.toString())})`
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

  function getValidationError(employee: User): string {
    if (employee.upcomingShiftAssignment) {
      return 'Cannot assign shift - Employee has an upcoming shift scheduled';
    }

    if (!assignmentValidFrom) return '';
    
    const assignmentFromDate = new Date(assignmentValidFrom);
    const assignmentTillDate = assignmentValidTill ? new Date(assignmentValidTill) : null;

    if (employee.currentShiftAssignment) {
      const currentEndDate = new Date(employee.currentShiftAssignmentData?.endDate.toString());
      
      if (assignmentFromDate < currentEndDate) {
        return `New assignment must start after current assignment ends (${fromUTCDate(currentEndDate.toString())})`;
      }
    }

    if (assignmentTillDate && assignmentTillDate <= assignmentFromDate) {
      return 'End date must be after start date';
    }

    return '';
  }

  function validateAssignment(employee: User): boolean {
    return !getValidationError(employee);
  }

  function isEmployeeSelectable(employee: User): boolean {
    return !employee.upcomingShiftAssignment;
  }

  $: if (assignmentValidFrom || assignmentValidTill) {
    selectedEmployees = new Set(Array.from(selectedEmployees));
  }

  function prepareConfirmation() {
    const valid = [];
    const invalid = [];
    
    for (const empId of selectedEmployees) {
      const employee = employees.find(e => e._id === empId);
      if (employee) {
        if (validateAssignment(employee)) {
          valid.push(employee);
        } else {
          invalid.push(employee);
        }
      }
    }

    confirmationData = {
      validEmployees: valid,
      invalidEmployees: invalid
    };

    let message = `You are about to assign shifts to ${valid.length} employee(s).\n\n`;
    
    if (invalid.length > 0) {
      message += 'The following employees will be excluded due to validation issues:\n';
      message += invalid.map(emp => `- ${emp.name}: ${getValidationError(emp)}`).join('\n');
      message += '\n\n';
    }
    
    message += 'Do you want to proceed with the valid assignments?';

    dialogConfig = {
      ...dialogConfig,
      message
    };

    showDialog = true;
  }

  function handleDialogConfirm() {
    handleAssignmentSubmit();
    showDialog = false;
  }

  function handleDialogCancel() {
    showDialog = false;
  }

  async function handleAssignmentSubmit() {
    if (!shift?._id || !assignmentValidFrom) return;
    
    const validEmployees = confirmationData.validEmployees.map(emp => emp._id);
    
    if (validEmployees.length === 0) {
      return;
    }
    
    dispatch('submit', {
      shiftId: shift._id,
      shiftCode: shift.code,
      employees: validEmployees,
      dates: {
        validFrom: assignmentValidFrom,
        validTill: assignmentValidTill || undefined
      }
    });
  }
</script>

{#if assignmentStep === 1}
  <div class="space-y-4">
    {#if dateError}
      <div class="alert alert-error">
        <span class="text-red-500">{dateError}</span>
      </div>
    {/if}

    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th class="w-10">
              <input 
                type="checkbox"
                class="checkbox"
                checked={selectedEmployees.size === employees.filter(isEmployeeSelectable).length}
                on:change={(e) => {
                  if (e.currentTarget.checked) {
                    employees.forEach(emp => {
                      if (isEmployeeSelectable(emp)) {
                        selectedEmployees.add(emp._id);
                      }
                    });
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
                  disabled={!isEmployeeSelectable(employee)}
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
      {#if employees.some(emp => !isEmployeeSelectable(emp))}
        <p class="text-sm text-red-500">
          * Some employees have upcoming shifts and cannot be selected for this assignment.
        </p>
      {/if}
      <button 
        class="btn btn-primary"
        disabled={selectedEmployees.size === 0 || dateError}
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

    {#if dateError}
      <div class="alert alert-error">
        <span class="text-red-500">{dateError}</span>
      </div>
    {/if}

    <div class="grid grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">Assignment Start Date*</label>
        <input 
          type="date" 
          class="input input-bordered" 
          bind:value={assignmentValidFrom}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>
      <div class="form-control">
        <label class="label">Assignment End Date</label>
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
              {employee.employeeId}
              {#if employee.currentShiftAssignment}
                <span class="text-sm text-base-content/70">
                  Current Shift: {employee.currentShiftAssignmentData?.shiftCode} ({fromUTCDate(employee.currentShiftAssignmentData?.startDate?.toString())} - {fromUTCDate(employee.currentShiftAssignmentData?.endDate?.toString())})
                </span>
              {/if}
              {#if getValidationError(employee)}
                <span class="text-error  ml-2">
                  {getValidationError(employee)}
                </span>
              {/if}
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
        disabled={dateError || !assignmentValidFrom || Array.from(selectedEmployees).every(id => {
          const employee = employees.find(e => e._id === id);
          return !employee || !validateAssignment(employee);
        })}
        on:click={prepareConfirmation}
      >
        Confirm Assignment
      </button>
    </div>
  </div>
{/if}

<ConfirmDialog
  bind:show={showDialog}
  config={dialogConfig}
  on:confirm={handleDialogConfirm}
  on:cancel={handleDialogCancel}
/>