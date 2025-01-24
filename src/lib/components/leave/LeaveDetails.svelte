<script lang="ts">
    import { onMount } from 'svelte';
    import { leavesApi } from '$lib/services/api/leaves';
    import Modal from '$lib/components/common/Modal.svelte';
    import type { LeaveRequest } from '$lib/types';
    import { 
        Calendar, 
        Clock, 
        MessageSquare, 
        UserCheck, 
        CheckCircle2, 
        X as Close, 
        Check 
    } from 'lucide-svelte';
  import { getLeaveTypeLabel } from '$lib/constants/leaveTypes';
  import { getLeaveButtonVisibility } from '$lib/utils/getLeaveButtonVisibility';
  import { writable } from 'svelte/store';

    export let leaveId: string;

    const buttonVisibility = writable({ 
        canApprove: false, 
        canReject: false, 
        canWithdraw: false 
    });

    let leave: LeaveRequest | null = null;
    let loading = true;
    let error: string | null = null;


    // Modal state
    let showApproveModal = false;
    let showRejectModal = false;
    let remarks = '';

    // Field configuration with Lucide icons
    const fields = [
        { key: 'leaveType', label: 'Leave Type', icon: Calendar  },
        { key: 'status', label: 'Status', icon: CheckCircle2 },
        { key: 'startDate', label: 'Start Date', icon: Calendar },
        { key: 'endDate', label: 'End Date', icon: Calendar },
        { key: 'noOfDays', label: 'Number of Days', icon: Clock },
        { key: 'reason', label: 'Reason', icon: MessageSquare },
        { key: 'user', label: 'Applied By', icon: MessageSquare },
        { key: 'approvedBy', label: 'Approved By', icon: UserCheck, 
          condition: () => ['Approved', 'Rejected'].includes(leave?.status || '') }
    ];

    // Fetch leave details
    onMount(async () => {
        try {
            loading = true;
            const response:any = await leavesApi.getById(leaveId);
            leave = response.data;
            console.log(leave,"leave");
            if (leave) {
                const visibility = await getLeaveButtonVisibility({
                    ...leave,
                    appliedTo: leave.appliedTo || { _id: '', name: '' }
                });
                buttonVisibility.set(visibility);
                console.log('Button Visibility Set:', visibility);
            }
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    });

    $: {
        console.log($buttonVisibility, 'buttonVisibility***');
    }
    // Status update handler
    async function handleStatusUpdate(status: 'Approved' | 'Rejected' | 'Cancelled') {
        if (!leave) return;

        try {
            loading = true;
            await leavesApi.updateStatus(
                leaveId, 
                status, 
                leave.noOfDays || 0, 
                remarks
            );
            
            const updated:any = await leavesApi.getById(leaveId);
            leave = updated.data;
            
            // Reset modal state
            showApproveModal = false;
            showRejectModal = false;
            remarks = '';
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    // Utility functions
    function formatDate(date: string): string {
        return date ? new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'N/A';
    }

        const statusColors: Record<string, string> = {
            'Pending': 'text-amber-700 bg-amber-100',
            'Approved': 'text-emerald-700 bg-emerald-100',
            'Rejected': 'text-rose-700 bg-rose-100',
            'Cancelled': 'text-slate-600 bg-slate-200'
        };

        function getStatusColor(status: string): string {
            return statusColors[status] || 'text-gray-600 bg-gray-100';
        }

</script>

<div class="container mx-auto p-6 bg-white shadow-md rounded-lg">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center">
            <MessageSquare class="mr-3 text-blue-500" size={24} />
            Leave Details
        </h2>
        
        {#if leave?.status === 'Pending'}
        <div class="flex space-x-2">
            {#if $buttonVisibility.canApprove}
                <button 
                    class="btn btn-green" 
                    on:click={() => showApproveModal = true}
                >
                    <Check class="mr-2" size={16} /> Approve
                </button>
            {/if}
            
            {#if $buttonVisibility.canReject}
                <button 
                    class="btn btn-red" 
                    on:click={() => showRejectModal = true}
                >
                    <Close class="mr-2" size={16} /> Reject
                </button>
            {/if}
            
            {#if $buttonVisibility.canWithdraw}
                <button 
                    class="btn btn-red" 
                    on:click={() => handleStatusUpdate('Cancelled')}
                >
                    <Close class="mr-2" size={16} /> Withdraw
                </button>
            {/if}
        </div>
    {/if}
    </div>

    {#if error}
        <div class="alert alert-error">{error}</div>
    {:else if loading}
        <div class="text-center text-gray-500 py-10">
            Loading leave details...
        </div>
    {:else if leave}
        <div class="grid grid-cols-2 gap-6">
            {#each fields as field}
                {#if !field.condition || field.condition()}
                    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
                        <div class="flex items-center mb-2">
                            <svelte:component 
                                this={field.icon} 
                                class="mr-3 text-blue-500" 
                                size={20} 
                            />
                            <h3 class="text-sm font-medium text-gray-600">{field.label}</h3>
                        </div>
                        
                        <div class="text-base font-semibold text-gray-800">
                            {#if field.key === 'status'}
                                <span class={`px-2 py-1 rounded text-sm ${getStatusColor(leave[field.key])}`}>
                                    {leave[field.key]}
                                </span>
                            {:else if field.key === 'leaveType'}
                                { getLeaveTypeLabel(leave[field.key]??'')}
                            {:else if field.key === 'startDate' || field.key === 'endDate'}
                                {formatDate(leave[field.key])}
                            {:else if field.key === 'approvedBy'}
                                {leave[field.key]?.name || 'N/A'}
                            {:else if field.key === 'user'}
                                {leave[field.key]?.name || 'N/A'}
                            {:else}
                                {leave[field.key] || 'N/A'}
                            {/if}
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<!-- Approve Modal -->
<Modal
    show={showApproveModal}
    title="Approve Leave"
    onClose={() => (showApproveModal = false)}
>
    <form on:submit|preventDefault={() => handleStatusUpdate('Approved')} class="space-y-6">
        <div class="form-control">
            <label for="approve-remarks" class="label">Remarks (optional)</label>
            <textarea
                id="approve-remarks"
                class="textarea textarea-bordered h-24"
                bind:value={remarks}
            ></textarea>
        </div>

        <div class="flex justify-end space-x-2">
            <button 
                type="button" 
                class="btn btn-ghost" 
                on:click={() => (showApproveModal = false)}
            >
                Cancel
            </button>
            <button 
                type="submit" 
                class="btn btn-green"
                disabled={loading}
            >
                {loading ? 'Approving...' : 'Approve'}
            </button>
        </div>
    </form>
</Modal>

<!-- Reject Modal -->
<Modal
    show={showRejectModal}
    title="Reject Leave"
    onClose={() => (showRejectModal = false)}
>
    <form on:submit|preventDefault={() => handleStatusUpdate('Rejected')} class="space-y-6">
        <div class="form-control">
            <label for="reject-remarks" class="label">Remarks (optional)</label>
            <textarea
                id="reject-remarks"
                class="textarea textarea-bordered h-24"
                bind:value={remarks}
            ></textarea>
        </div>

        <div class="flex justify-end space-x-2">
            <button 
                type="button" 
                class="btn btn-ghost" 
                on:click={() => (showRejectModal = false)}
            >
                Cancel
            </button>
            <button 
                type="submit" 
                class="btn btn-red"
                disabled={loading}
            >
                {loading ? 'Rejecting...' : 'Reject'}
            </button>
        </div>
    </form>
</Modal>

<style lang="postcss">
    .btn {
        @apply inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors;
    }
    .btn-green {
        @apply bg-green-500 text-white hover:bg-green-600;
    }
    .btn-red {
        @apply bg-red-500 text-white hover:bg-red-600;
    }
    .btn-ghost {
        @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
    }
    .alert-error {
        @apply bg-red-50 text-red-800 p-4 rounded-lg;
    }
    .textarea {
        @apply w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200;
    }
</style>