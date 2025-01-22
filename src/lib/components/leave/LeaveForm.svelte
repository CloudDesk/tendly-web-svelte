<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import '../../styles/form.css'
  import { leaveTypeOptions } from '$lib/constants/leaveTypes';
  import type {LeaveSummary} from '$lib/services/api/leaves'

  interface LeaveFormData {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    leaveTypeId: string;
  }

  interface LeaveSummary {
    [key: string]: {
      alloted: number;
      availed: number;
      remaining: number;
      leaveRequests: string[];
    }
  }

  export let loading = false;
  export let initialValues: LeaveFormData;
  export let summary: LeaveSummary;
console.log(summary,"summary");
  const dispatch = createEventDispatcher<{
    submit: LeaveFormData;
    cancel: void;
  }>();
  
  // Create a writable store for form data
  let formData = initialValues;
  
 // Get remaining leave days based on leave type
const getRemainingDays = (leaveType: string): number => {
  console.log(leaveType, "leaveType");
  
  // Special case for lossOfPay - return a large number since there's no limit
  if (leaveType.toLowerCase() === 'lossofpay') {
    return Number.MAX_SAFE_INTEGER; // Effectively unlimited days
  }

  const typeMapping: { [key: string]: keyof typeof summary } = {
    'annual': 'annual',
    'sick': 'sick',
    'compoff': 'compOff',
    'otherpaid': 'otherPaid',
    'otherunpaid': 'otherUnpaid'
  };

  const summaryKey = typeMapping[leaveType.toLowerCase()];
  return summaryKey && typeof summary[summaryKey] === 'object' ? summary[summaryKey].remaining : 0;
};

  // Form handlers
  const handleSubmit = () => {
    if (!isLeaveBalanceValid) {
      return;
    }
    console.log('Submitting form with data:', formData);
    let newObj = {...formData,noOfDays:numberOfDays}
    dispatch('submit', newObj);
  };

  const handleCancel = () => {
    dispatch('cancel');
  };

  const handleChange = () => {
    console.log('Form changed:', formData);
  };

  // Validation
  $: isEndDateValid = !formData.startDate || !formData.endDate || 
    new Date(formData.endDate) >= new Date(formData.startDate);

  $: numberOfDays = formData.startDate && formData.endDate ? 
    Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) 
    / (1000 * 60 * 60 * 24)) + 1 : 0;

  $: remainingDays = formData.leaveType ? getRemainingDays(formData.leaveType) : 0;
  
  // Update the isLeaveBalanceValid reactive statement to match
$: isLeaveBalanceValid = 
  formData.leaveType?.toLowerCase() === 'lossofpay' || 
  numberOfDays <= remainingDays;

// Update the leaveBalanceMessage reactive statement
$: leaveBalanceMessage = formData.leaveType ? 
  formData.leaveType.toLowerCase() === 'lossofpay' 
    ? '' 
    : `Available balance: ${remainingDays} days${!isLeaveBalanceValid ? ' (Insufficient balance)' : ''}`
  : '';
  
  </script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Leave Type -->
    <div class="form-control">
      <label class="label" for="leaveType">
        <span class="label-text">Leave Type</span>
        <span class="text-error">*</span>
      </label>
      <select
        id="leaveType"
        class="select select-bordered w-full"
        bind:value={formData.leaveType}
        on:change={handleChange}
        required
      >
        <option value="">Select Leave Type</option>
        {#each leaveTypeOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      {#if formData.leaveType && leaveBalanceMessage}
        <div class="label">
          <span class="label-text-alt {!isLeaveBalanceValid ? 'text-error' : 'text-success'}">
            {leaveBalanceMessage}
          </span>
        </div>
      {/if}
    </div>

    <!-- Start Date -->
    <div class="form-control">
      <label class="label" for="startDate">
        <span class="label-text">Start Date</span>
        <span class="text-error">*</span>
      </label>
      <input
        id="startDate"
        type="date"
        class="input input-bordered"
        bind:value={formData.startDate}
        on:change={handleChange}
        required
      />
    </div>

    <!-- End Date -->
    <div class="form-control">
      <label class="label" for="endDate">
        <span class="label-text">End Date</span>
        <span class="text-error">*</span>
      </label>
      <input
        id="endDate"
        type="date"
        class="input input-bordered"
        bind:value={formData.endDate}
        on:change={handleChange}
        required
      />
      {#if !isEndDateValid}
        <div class="label">
          <span class="label-text-alt text-error">End date must be after start date</span>
        </div>
      {/if}
    </div>

    <!-- Reason -->
    <div class="form-control">
      <label class="label" for="reason">
        <span class="label-text">Reason</span>
        <span class="text-error">*</span>
      </label>
      <textarea
        id="reason"
        class="textarea textarea-bordered h-24"
        bind:value={formData.reason}
        on:input={handleChange}
        required
      ></textarea>
    </div>

    <!-- Number of Days -->
    {#if formData.startDate && formData.endDate && isEndDateValid}
      <div class="form-control col-span-full">
        <label class="label" for="numberOfDays">
          <span class="label-text">Number of Days</span>
        </label>
        <div id="numberOfDays" class="text-sm font-medium">
          {numberOfDays} day{numberOfDays !== 1 ? 's' : ''}
        </div>
      </div>
    {/if}
  </div>

  <div class="flex justify-end gap-2">
    <button 
      type="button" 
      class="btn btn-ghost" 
      on:click={handleCancel}
      disabled={loading}
    >
      Cancel
    </button>
    <button 
      type="submit" 
      class="btn btn-primary"
      disabled={loading || !isEndDateValid || !isLeaveBalanceValid}
    >
      {loading ? 'Applying...' : 'Apply'}
    </button>
  </div>
</form>

  <style>
    :global(.form-control) {
      display: flex;
      flex-direction: column;
    }
  
    :global(.label) {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }
  
    :global(.text-error) {
      color: #dc2626;
    }
  </style>