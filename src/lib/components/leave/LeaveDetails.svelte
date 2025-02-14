<script lang="ts">
    import { onMount } from 'svelte';
    import { leavesApi } from '$lib/services/api/leaves';
    import type { LeaveRequest } from '$lib/types';
    import Modal from '$lib/components/common/Modal.svelte';

    export let leaveId: string;
    
    let leave: LeaveRequest | null = null;
    let loading = true;
    let error: string | null = null;
    let showEditModal = false;
    let showApproveModal = false;
    let showRejectModal = false;
    let remarks = '';

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
        { key: 'type', label: 'Leave Type', inputType: 'text', required: true },
        { key: 'status', label: 'Status', inputType: 'select', required: true, options: [
            { label: 'Pending', value: 'PENDING' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Rejected', value: 'REJECTED' }
        ]},
        { key: 'startDate', label: 'Start Date', inputType: 'date', required: true },
        { key: 'endDate', label: 'End Date', inputType: 'date', required: true },
        { key: 'reason', label: 'Reason', inputType: 'textarea', required: false },
        { key: 'rejectionReason', label: 'Rejection Reason', inputType: 'textarea', required: false, hideInView: true }
    ];

    onMount(async () => {
        try {
            loading = true;
            const response = await leavesApi.getById(leaveId);
            leave = response.data;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    });

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

    async function handleSubmit() {
        try {
            loading = true;
            // Convert dates back to ISO format for API
            const leaveData: Partial<LeaveRequest> = {
                ...editingLeave,
                startDate: editingLeave.startDate ? new Date(editingLeave.startDate).toISOString() : undefined,
                endDate: editingLeave.endDate ? new Date(editingLeave.endDate).toISOString() : undefined
            };
            await leavesApi.update(leaveId, leaveData);
            const updated = await leavesApi.getById(leaveId);
            leave = updated.data;
            showEditModal = false;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handleApprove() {
       
    let user = JSON.parse(localStorage.getItem('user'));   
console.log(user._id, "user");

     try {
            loading = true;

            await leavesApi.updateStatus(leaveId, 'Approved', remarks );
            const updated = await leavesApi.getById(leaveId);
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
            await leavesApi.updateStatus(leaveId, 'Rejected', remarks );
            const updated = await leavesApi.getById(leaveId);
            leave = updated.data;
            showRejectModal = false;
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
</script>

<div class="space-y-6">
    <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">Leave Details</h3>
        <div class="flex gap-2">
            <button class="btn btn-primary btn-sm" on:click={handleEdit}>
                Edit Details
            </button>
            <button class="btn btn-primary btn-sm" on:click={() => showApproveModal = true}>
                Approve
            </button>
            <button class="btn btn-primary btn-sm" on:click={() => showRejectModal = true}>
                Reject
            </button>
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
        </div>
    {/if}
</div>

<Modal
    show={showEditModal}
    title="Edit Leave Details"
    onClose={() => (showEditModal = false)}
>
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each fields as field}
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">{field.label}</span>
                        {#if field.required}
                            <span class="text-error">*</span>
                        {/if}
                    </label>

                    {#if field.inputType === 'textarea'}
                        <textarea
                            class="textarea textarea-bordered h-24"
                            bind:value={editingLeave[field.key]}
                            required={field.required}
                        ></textarea>
                    {:else if field.inputType === 'select'}
                        <select
                            class="select select-bordered w-full"
                            bind:value={editingLeave[field.key]}
                            required={field.required}
                        >
                            <option value="">Select {field.label}</option>
                            {#each field.options || [] as option}
                                <option value={option.value}>{option.label}</option>
                            {/each}
                        </select>
                    {:else if field.inputType === 'date'}
                        <input
                            type="date"
                            class="input input-bordered"
                            bind:value={editingLeave[field.key]}
                            required={field.required}
                        />
                    {:else}
                        <input
                            type="text"
                            class="input input-bordered"
                            bind:value={editingLeave[field.key]}
                            required={field.required}
                        />
                    {/if}
                </div>
            {/each}
        </div>

        <div class="flex justify-end gap-2">
            <button 
                type="button" 
                class="btn btn-ghost" 
                on:click={() => (showEditModal = false)}
            >
                Cancel
            </button>
            <button 
                type="submit" 
                class="btn btn-primary"
                disabled={loading}
            >
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    </form>
</Modal>

<Modal
    show={showApproveModal}
    title="Approve Leave"
    onClose={() => (showApproveModal = false)}
>
    <form on:submit|preventDefault={handleApprove} class="space-y-6">
        <div class="form-control">
            <label class="label">
                <span class="label-text">Remarks (optional)</span>
            </label>
            <textarea
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
            <label class="label">
                <span class="label-text">Remarks (optional)</span>
            </label>
            <textarea
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
        @apply flex justify-center items-center p-8 text-neutral-500;
    }
</style>