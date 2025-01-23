<script lang="ts">
    import { onMount } from 'svelte';
    import { leavesApi } from '$lib/services/api/leaves';
    import Modal from '$lib/components/common/Modal.svelte';
    import LeaveForm from '$lib/components/leave/LeaveForm.svelte';
    import type { LeaveRequest } from '$lib/types';
  import { leaveStatusOptions, leaveTypeOptions } from '$lib/constants/leaveTypes';
  import { getRoleFlags, userPermissions } from '$lib/stores/authPermissions';
  import { auth } from '$lib/stores/auth';

    export let leaveId: string;
 
    let leave: LeaveRequest | null = null;
    let loading = true;
    let error: string | null = null;
    let showEditModal = false;
    let showApproveModal = false;
    let showRejectModal = false;
    let showWithdrawModal = false;
    let remarks = '';
    let userRoleFlags = getRoleFlags(location.href);
    console.log(leave, "userRoleFlags")
    type EditingLeave = Partial<LeaveRequest> & {
        startDate?: string;
        endDate?: string;
    };

    let editingLeave: EditingLeave = {};
    
    type Field = {
        key: keyof LeaveRequest;
        label: string;
        inputType: 'text' | 'date' | 'textarea' | 'select';
        required: boolean;
        options?: Array<{label: string, value: string}>;
        hideInView?: boolean;
    };

 

  let fields: Field[] = [
    { key: 'leaveType', label: 'Leave Type', inputType: 'select', required: true, options: leaveTypeOptions },
    { key: 'status', label: 'Status', inputType: 'select', required: true, options: leaveStatusOptions },
    { key: 'startDate', label: 'Start Date', inputType: 'date', required: true },
    { key: 'endDate', label: 'End Date', inputType: 'date', required: true },
    { key: 'reason', label: 'Reason', inputType: 'textarea', required: false },
];
    onMount(async () => {
        try {
            loading = true;
            const response:any = await leavesApi.getById(leaveId);
            console.log(response.data, "response.data")
            leave = response.data;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    });
    console.log(leave,"Leave request changed:")
    $: if (leave) {
    // Logic to run when leave is updated
    console.log('Leave request changed:', leave);
}
    function handleEdit() {
        if (leave) {
            // Format date fields to YYYY-MM-DD for input[type="date"]
            editingLeave = {
                ...leave,
                startDate: leave.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : undefined,
                endDate: leave.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : undefined
            };
            showEditModal = true;
        }
    }

    async function handleLeaveSubmit(event: CustomEvent) {
        loading = true;
        const submittedData = event.detail;
        console.log('Submitted data:', submittedData);
    
        try {
            const leaveData: Partial<LeaveRequest> = {
                ...submittedData,
                startDate: submittedData.startDate ? new Date(submittedData.startDate).toISOString() : undefined,
                endDate: submittedData.endDate ? new Date(submittedData.endDate).toISOString() : undefined
            };
            // await leavesApi.update(leaveId, leaveData);
            // const updated:any = await leavesApi.getById(leaveId);
            // leave = updated.data;
            showEditModal = false;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handleApprove() {
        try {
            loading = true;
            await leavesApi.updateStatus(leaveId, 'Approved',leave?.noOfDays||0, remarks );
            const updated:any = await leavesApi.getById(leaveId);
            leave = updated.data;
            showApproveModal = false;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handleReject() {
        try {
            loading = true;
            await leavesApi.updateStatus(leaveId, 'Rejected',leave?.noOfDays ||0, remarks );
            const updated:any = await leavesApi.getById(leaveId);
            leave = updated.data;
            showRejectModal = false;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handleWithdraw() {
        console.log("confirmAction")
        try {
            loading = true;
            await leavesApi.updateStatus(leaveId, 'Cancelled',leave?.noOfDays ||0, remarks );
            const updated:any = await leavesApi.getById(leaveId);
            leave = updated.data;
            showWithdrawModal = false;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    function formatDate(dateStr: any): string {
        if (!dateStr || typeof dateStr !== 'string') return '';
        return new Date(dateStr).toLocaleDateString();
    }

    // Helper to avoid TypeScript index errors
    function safeAccess<T extends keyof LeaveRequest>(key: T): string | undefined {
        if (!leave) return undefined;
        const value = (leave as LeaveRequest)[key];
        return value ? String(value) : undefined;
    }

    function getDisplayValue(field: Field, value: any): string {
        if (!value) return '';
        
        if (field.inputType === 'select' && Array.isArray(field.options)) {
            const option = field.options.find(opt => opt.value === value);
            return option ? option.label : String(value);
        }

        if (field.inputType === 'date') {
            return formatDate(value);
        }

        return String(value);
    }

    function calculateNumberOfDays(startDate: string, endDate: string): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    //need to modify the dialog confirm call below method, now directly called 
   async function confirmAction () {
    handleWithdraw()
        }   


</script>

<div class="space-y-6">
    <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">Leave Details</h3>
        <div class="flex gap-2">
            {#if leave?.status === 'Pending'}
                <button class="btn btn-primary btn-sm" on:click={() => showApproveModal = true}>
                    Approve
                </button>
                <button class="btn btn-primary btn-sm" on:click={() => showRejectModal = true}>
                    Reject
                </button>
          
        {:else}
                <button class="btn btn-primary btn-sm" disabled style="opacity: 0.5;">
                    Approve
                </button>
                <button class="btn btn-primary btn-sm" disabled style="opacity: 0.5;">
                    Reject
                </button>
        {/if}
        </div>
    </div>

    {#if error}
        <div class="alert alert-error">{error}</div>
    {:else if loading}
        <div class="loading">Loading leave details...</div>
    {:else if leave}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each fields as field}
                {#if !field.hideInView}
                    <div class="card bg-base-100">
                        <div class="card-body">
                            <h3 class="text-sm font-medium text-neutral-500">{field.label}</h3>
                            <p class="mt-1 text-base">
                                {getDisplayValue(field, safeAccess(field.key))}
                            </p>
                        </div>
                    </div>
                {/if}
            {/each}
            <div class="card bg-base-100">
                <div class="card-body">
                    <h3 class="text-sm font-medium text-neutral-500">Number of Days</h3>
                    <p class="mt-1 text-base">
                        {#if leave.startDate && leave.endDate}
                            {calculateNumberOfDays(leave.startDate, leave.endDate)}
                        {:else}
                            N/A
                        {/if}
                    </p>
                </div>
            </div>
        </div>
    {/if}
</div>

<Modal
    show={showEditModal}
    title="Edit Leave Details"
    onClose={() => (showEditModal = false)}
>
    <!-- <LeaveForm
        {loading}
        initialValues={editingLeave}
        on:submit={handleLeaveSubmit}
        on:cancel={() => (showEditModal = false)}
    /> -->
</Modal>

<Modal
    show={showApproveModal}
    title="Approve Leave"
    onClose={() => (showApproveModal = false)}
>
    <form on:submit|preventDefault={handleApprove} class="space-y-6">
        <div class="form-control">
            <label class="label" for="remarks">
                <span class="label-text">Remarks (optional)</span>
            </label>
            <textarea
                id="remarks"
                class="textarea textarea-bordered h-24"
                bind:value={remarks}
            ></textarea>
        </div>

        <div class="flex justify-end gap-2">
            <button 
                type="button" 
                class="btn btn-ghost" 
                on:click={() => (showApproveModal = false)}
            >
                Close
            </button>
            <button 
                type="submit" 
                class="btn btn-primary"
                disabled={loading}
            >
                {loading ? 'Approving...' : 'Approve'}
            </button>
        </div>
    </form>
</Modal>

<Modal
    show={showRejectModal}
    title="Reject Leave"
    onClose={() => (showRejectModal = false)}
>
    <form on:submit|preventDefault={handleReject} class="space-y-6">
        <div class="form-control">
            <label class="label" for="reject-remarks">
                <span class="label-text">Remarks (optional)</span>
            </label>
            <textarea
                id="reject-remarks"
                class="textarea textarea-bordered h-24"
                bind:value={remarks}
            ></textarea>
        </div>

        <div class="flex justify-end gap-2">
            <button 
                type="button" 
                class="btn btn-ghost" 
                on:click={() => (showRejectModal = false)}
            >
                Close
            </button>
            <button 
                type="submit" 
                class="btn btn-primary"
                disabled={loading}
            >
                {loading ? 'Rejecting...' : 'Reject'}
            </button>
        </div>
    </form>
</Modal>

<style>
  .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      color: #6b7280; /* Neutral-500 */
  }

  .space-y-6 > * + * {
      margin-top: 1.5rem;
  }

  .flex {
      display: flex;
  }

  .justify-between {
      justify-content: space-between;
  }

  .items-center {
      align-items: center;
  }

  .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
  }

  .btn-primary {
      background-color: #3b82f6; /* Blue-500 */
      color: white;
  }
  .btn-warning {
      background-color: #ffc107; /* Blue-500 */
      color: white;
  }

  .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
  }

  .alert {
      padding: 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
  }

  .alert-error {
      background-color: #fee2e2; /* Red-100 */
      color: #991b1b; /* Red-800 */
  }

  .grid {
      display: grid;
      gap: 1.5rem;
  }

  .grid-cols-1 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .md\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lg\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .card {
      background-color: #ffffff; /* Base-100 */
      border-radius: 0.375rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Shadow-sm */
  }

  .card-body {
      padding: 1rem;
  }

  .text-lg {
      font-size: 1.125rem;
      line-height: 1.75rem;
  }

  .font-semibold {
      font-weight: 600;
  }

  .text-sm {
      font-size: 0.875rem;
      line-height: 1.25rem;
  }

  .text-neutral-500 {
      color: #6b7280; /* Neutral-500 */
  }

  .mt-1 {
      margin-top: 0.25rem;
  }

  .text-base {
      font-size: 1rem;
      line-height: 1.5rem;
  }

  .form-control {
      margin-bottom: 1rem;
  }

  .label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-weight: 500;
  }

  .label-text {
      font-size: 0.875rem;
      color: #374151; /* Neutral-700 */
  }

  .text-error {
      color: #b91c1c; /* Red-700 */
  }

  .input,
  .select,
  .textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e5e7eb; /* Gray-200 */
      border-radius: 0.375rem;
      background-color: white;
  }

  .textarea {
      min-height: 6rem;
      resize: vertical;
  }

  .flex.justify-end {
      justify-content: flex-end;
  }

  .gap-2 > * + * {
      margin-left: 0.5rem;
  }

  .btn-ghost {
      background-color: transparent;
      color: #374151; /* Neutral-700 */
  }

  .manager-search-results {
      background-color: white;
      border: 1px solid #e5e7eb; /* Gray-200 */
      border-radius: 0.375rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* Shadow-sm */
  }

  .manager-search-results ul {
      list-style: none;
      margin: 0;
      padding: 0;
  }

  .manager-search-results li {
      padding: 0.5rem 1rem;
      cursor: pointer;
  }

  .manager-search-results li:hover {
      background-color: #f3f4f6; /* Gray-100 */
  }
</style>