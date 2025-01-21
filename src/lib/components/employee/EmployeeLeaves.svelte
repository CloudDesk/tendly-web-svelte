<script lang="ts">
    import { onMount } from 'svelte';
    import { leavesApi } from '$lib/services/api';
    import Tabs from '$lib/components/common/Tabs.svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import type { LeaveRequest, LeaveCategory, LeaveSummary } from '$lib/services/api/leaves';

    export let employeeId: string;
    export let showEditAllotments = true;
    
    let loading = false;
    let error: string | null = null;
    let showEditModal = false;
    let editingAllotments: Record<LeaveType, number> = {} as Record<LeaveType, number>;

    // Current year for filtering
    const currentYear = new Date().getFullYear();

    const leaveTypes = {
        annual: { label: 'Annual Leave', isEditable: true },
        sick: { label: 'Sick Leave', isEditable: true },
        lossOfPay: { label: 'Loss of Pay', isEditable: false },
        otherPaid: { label: 'Other Paid', isEditable: true },
        otherUnpaid: { label: 'Other Unpaid', isEditable: true }
    } as const;

    type LeaveType = keyof typeof leaveTypes;
    
    let leaveSummary: Array<{
        type: LeaveType;
        alloted: number;
        availed: number;
        remaining: number;
        leaveRequests: LeaveRequest[];
    }> = [];

    let compOffRequests: Array<{
        _id: string;
        date: string;
        hours: number;
        status: 'approved' | 'pending' | 'rejected';
        reason: string;
        appliedOn: string;
    }> = [];

    const tabs = [
        { id: 'leaves', label: 'Leave Requests' },
        { id: 'compoff', label: 'Comp Off Requests' }
    ];

    function processLeaveSummary(summary: LeaveSummary): Array<{
        type: LeaveType;
        alloted: number;
        availed: number;
        remaining: number;
        leaveRequests: LeaveRequest[];
    }> {
        console.log(summary,"summary");
        return (Object.entries(summary) as Array<[LeaveType, LeaveCategory]>)
            .filter(([key]) => key in leaveTypes)
            .map(([key, value]) => ({
                type: key,
                alloted: value.alloted,
                availed: value.availed,
                remaining: value.remaining,
                leaveRequests: value.leaveRequests
            }));
    }

    async function loadLeaveSummary() {
        try {
            loading = true;
            const response = await leavesApi.getSummary(employeeId);
            leaveSummary = processLeaveSummary(response.data);
        } catch (err) {
            error = 'Failed to load leave summary';
            console.error(err);
        } finally {
            loading = false;
        }
    }

    async function loadCompOffRequests() {
        try {
            loading = true;
            const response = await leavesApi.getCompOffRequests(employeeId);
            compOffRequests = response.data;
        } catch (err) {
            error = 'Failed to load comp off requests';
            console.error(err);
        } finally {
            loading = false;
        }
    }

    function handleEditAllotments() {
        editingAllotments = Object.fromEntries(
            leaveSummary.map(leave => [leave.type, leave.alloted])
        ) as Record<LeaveType, number>;
        showEditModal = true;
    }

    async function handleAllotmentUpdate() {
        try {
            loading = true;
            await leavesApi.updateAllotments(employeeId, currentYear, editingAllotments);
            showEditModal = false;  
            editingAllotments = {} as Record<LeaveType, number>;
            await loadLeaveSummary();
            console.log(leaveSummary);
        } catch (err) {
            error = 'Failed to update leave allotments';
            console.error(err);
        } finally {
            loading = false;
        }
    }

    function handleApplyLeave(type: LeaveType) {
        // TODO: Implement apply leave functionality
        console.log('Apply leave for type:', type);
    }

    onMount(() => {
        loadLeaveSummary();
        //loadCompOffRequests();
    });
</script>

<div class="space-y-6">
    <!-- Leave Summary Section -->
    <div class="card">
        <div class="card-body">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-text">Leave Summary ({currentYear})</h3>
                {#if showEditAllotments}
                    <button 
                        class="btn btn-primary btn-sm"
                        on:click={handleEditAllotments}
                    >
                        Edit Allotments
                    </button>
                {/if}
            </div>
            
            {#if loading}
                <div class="loading">Loading...</div>
            {:else if error}
                <div class="alert alert-error">{error}</div>
            {:else}
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Alloted</th>
                                <th>Availed</th>
                                <th>Remaining</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each leaveSummary as leave}
                                {@const leaveType = leaveTypes[leave.type]}
                                <tr>
                                    <td class="font-medium">{leaveType.label}</td>
                                    <td>{leave.alloted}</td>
                                    <td>{leave.availed}</td>
                                    <td>
                                        <span class="font-medium {leave.remaining > 0 ? 'text-success' : 'text-danger'}">
                                            {leave.remaining}
                                        </span>
                                    </td>
                                    <td>
                                        {#if leave.remaining > 0}
                                            <button 
                                                class="btn btn-primary btn-sm"
                                                on:click={() => handleApplyLeave(leave.type)}
                                            >
                                                Apply
                                            </button>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    </div>

    <!-- Requests Section -->
    <div class="card">
        <div class="card-body">
            <Tabs tabs={tabs} urlParam="request-type" let:activeTab>
                {#if activeTab === 'leaves'}
                    <div class="overflow-x-auto">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Period</th>
                                    <th>Days</th>
                                    <th>Status</th>
                                    <th>Applied On</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each leaveSummary as leave}
                                    {@const leaveType = leaveTypes[leave.type]}
                                    {#each leave.leaveRequests.filter(req => new Date(req.startDate).getFullYear() === currentYear) as request}
                                        <tr>
                                            <td>{leaveType.label}</td>
                                            <td>
                                                {new Date(request.startDate).toLocaleDateString()} - 
                                                {new Date(request.endDate).toLocaleDateString()}
                                            </td>
                                            <td>
                                                {Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                                            </td>
                                            <td>
                                                <span class="badge {request.status === 'approved' ? 'badge-success' : request.status === 'rejected' ? 'badge-danger' : 'badge-warning'}">
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td>{new Date(request.appliedOn).toLocaleDateString()}</td>
                                            <td class="max-w-xs truncate">{request.reason}</td>
                                        </tr>
                                    {/each}
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Hours</th>
                                    <th>Status</th>
                                    <th>Applied On</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each compOffRequests as request}
                                    <tr>
                                        <td>{new Date(request.date).toLocaleDateString()}</td>
                                        <td>{request.hours}</td>
                                        <td>
                                            <span class="badge {request.status === 'approved' ? 'badge-success' : request.status === 'rejected' ? 'badge-danger' : 'badge-warning'}">
                                                {request.status}
                                            </span>
                                        </td>
                                        <td>{new Date(request.appliedOn).toLocaleDateString()}</td>
                                        <td class="max-w-xs truncate">{request.reason}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </Tabs>
        </div>
    </div>
</div>

<Modal
    show={showEditModal}
    title="Edit Leave Allotments"
    onClose={() => {
        showEditModal = false;
    }}
>
    <form on:submit|preventDefault={handleAllotmentUpdate} class="space-y-4">
        {#each leaveSummary as leave}
            {@const leaveType = leaveTypes[leave.type]}
            {#if leaveType.isEditable}
                <div class="form-group">
                    <label class="form-label">{leaveType.label}</label>
                    <input 
                        type="number" 
                        class="form-input" 
                        bind:value={editingAllotments[leave.type]}
                        min="0"
                        required
                    />
                </div>
            {/if}
        {/each}

        <div class="flex justify-end gap-2">
            <button 
                type="button" 
                class="btn btn-secondary"
                on:click={() => {
                    showEditModal = false;
                }}
            >
                Cancel
            </button>
            <button type="submit" class="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
            </button>
        </div>
    </form>
</Modal> 