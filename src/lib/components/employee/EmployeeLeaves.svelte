<script lang="ts">
    import { onMount } from 'svelte';
    import { api } from '$lib/services/api';

    export let employeeId: string;
    let loading = true;
    let error: string | null = null;
    let showRequestForm = false;

    type LeaveType = {
        _id: string;
        name: string;
        description: string;
        daysPerYear: number;
        carryForward: boolean;
        paid: boolean;
    };

    type LeaveRequest = {
        _id: string;
        startDate: string;
        endDate: string;
        status: 'approved' | 'pending' | 'rejected';
        reason: string;
        appliedOn: string;
        approvedBy?: string;
        rejectionReason?: string;
    };

    type LeaveCategory = {
        alloted: number;
        availed: number;
        remaining: number;
        leaveRequests: LeaveRequest[];
    };

    type LeaveSummary = {
        userId: {
            _id: string;
            name: string;
            email: string;
        };
        year: number;
        annual: LeaveCategory;
        sick: LeaveCategory;
    };

    let leaveSummary: LeaveSummary | null = null;
    let leaveTypes: LeaveType[] = [];
    let formError: string | null = null;
    let formLoading = false;
    let activeCategory: 'annual' | 'sick' = 'annual';

    // Form data
    let selectedType = '';
    let startDate = '';
    let endDate = '';
    let reason = '';

    async function loadData() {
        try {
            const [summaryResponse, typesResponse] = await Promise.all([
                api.leaves.getSummary(employeeId),
                api.leaves.getTypes()
            ]);
            leaveSummary = summaryResponse.data[0]; // Get first summary
            leaveTypes = typesResponse.data;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        formError = null;
        formLoading = true;

        try {
            await api.leaves.create({
                userId: employeeId,
                type: selectedType,
                startDate,
                endDate,
                reason
            });

            // Reset form
            selectedType = '';
            startDate = '';
            endDate = '';
            reason = '';
            showRequestForm = false;

            // Reload data
            await loadData();
        } catch (e: any) {
            formError = e.message;
        } finally {
            formLoading = false;
        }
    }

    async function cancelRequest(requestId: string) {
        try {
            await api.leaves.cancel(requestId);
            await loadData();
        } catch (e: any) {
            error = e.message;
        }
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    $: currentCategory = leaveSummary ? leaveSummary[activeCategory] : null;
    $: allLeaveRequests = leaveSummary ? 
        [...leaveSummary.annual.leaveRequests, ...leaveSummary.sick.leaveRequests]
            .sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime()) : [];

    onMount(loadData);
</script>

<div class="leaves-section">
    {#if loading}
        <div class="loading">Loading leave summary...</div>
    {:else if error}
        <div class="error">{error}</div>
    {:else if leaveSummary}
        <div class="header">
            <h3>Leave Summary ({leaveSummary.year})</h3>
            <button class="btn-primary" on:click={() => showRequestForm = !showRequestForm}>
                {showRequestForm ? 'Cancel Request' : 'Request Leave'}
            </button>
        </div>

        {#if showRequestForm}
            <form class="leave-form" on:submit={handleSubmit}>
                {#if formError}
                    <div class="error">{formError}</div>
                {/if}

                <div class="form-group">
                    <label for="type">Leave Type</label>
                    <select id="type" bind:value={selectedType} required>
                        <option value="">Select a type</option>
                        {#each leaveTypes as type}
                            <option value={type._id}>{type.name}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="start-date">Start Date</label>
                        <input type="date" id="start-date" bind:value={startDate} required />
                    </div>

                    <div class="form-group">
                        <label for="end-date">End Date</label>
                        <input type="date" id="end-date" bind:value={endDate} required min={startDate} />
                    </div>
                </div>

                <div class="form-group">
                    <label for="reason">Reason</label>
                    <textarea id="reason" bind:value={reason} required rows="3"></textarea>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary" disabled={formLoading}>
                        {formLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </form>
        {/if}

        <div class="category-tabs">
            <button 
                class="tab-button" 
                class:active={activeCategory === 'annual'}
                on:click={() => activeCategory = 'annual'}
            >
                Annual Leave
            </button>
            <button 
                class="tab-button" 
                class:active={activeCategory === 'sick'}
                on:click={() => activeCategory = 'sick'}
            >
                Sick Leave
            </button>
        </div>

        {#if currentCategory}
            <div class="summary">
                <div class="stat">
                    <span class="label">Alloted</span>
                    <span class="value">{currentCategory.alloted}</span>
                </div>
                <div class="stat">
                    <span class="label">Availed</span>
                    <span class="value">{currentCategory.availed}</span>
                </div>
                <div class="stat">
                    <span class="label">Remaining</span>
                    <span class="value">{currentCategory.remaining}</span>
                </div>
            </div>
        {/if}

        <div class="leave-history">
            <h4>Leave History</h4>
            <table class="leaves-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Applied On</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each allLeaveRequests as request}
                        <tr class={request.status}>
                            <td>{activeCategory.toUpperCase()}</td>
                            <td>
                                {formatDate(request.startDate)}
                                {#if request.startDate !== request.endDate}
                                    - {formatDate(request.endDate)}
                                {/if}
                            </td>
                            <td>
                                <span class="status-badge {request.status}">
                                    {request.status}
                                </span>
                            </td>
                            <td>
                                <div class="reason-cell">
                                    <span class="reason">{request.reason}</span>
                                    {#if request.rejectionReason}
                                        <span class="rejection-reason">
                                            Rejection reason: {request.rejectionReason}
                                        </span>
                                    {/if}
                                </div>
                            </td>
                            <td>{formatDate(request.appliedOn)}</td>
                            <td>
                                {#if request.status === 'pending'}
                                    <button 
                                        class="btn-text" 
                                        on:click={() => cancelRequest(request._id)}
                                    >
                                        Cancel
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

<style>
    .leaves-section {
        padding: 1rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        margin: 0;
    }

    .leave-form {
        background: #f9fafb;
        padding: 1.5rem;
        border-radius: 0.5rem;
        margin-bottom: 2rem;
        border: 1px solid #e5e7eb;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    label {
        display: block;
        font-size: 0.875rem;
        color: #374151;
        margin-bottom: 0.5rem;
    }

    input, select, textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
    }

    textarea {
        resize: vertical;
    }

    .form-actions {
        margin-top: 1.5rem;
        display: flex;
        justify-content: flex-end;
    }

    .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat {
        background: #f3f4f6;
        padding: 1rem;
        border-radius: 0.5rem;
        text-align: center;
    }

    .stat .label {
        display: block;
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
    }

    .stat .value {
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
    }

    .leave-history h4 {
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 1rem;
    }

    .leaves-table {
        width: 100%;
        border-collapse: collapse;
    }

    .leaves-table th,
    .leaves-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
        font-size: 0.875rem;
    }

    .leaves-table th {
        background: #f9fafb;
        font-weight: 500;
        color: #374151;
    }

    .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
    }

    .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
    }

    .status-badge.approved {
        background: #d1fae5;
        color: #065f46;
    }

    .status-badge.rejected {
        background: #fee2e2;
        color: #991b1b;
    }

    .reason-cell {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .rejection-reason {
        font-size: 0.75rem;
        color: #991b1b;
    }

    .btn-primary {
        background: #4f46e5;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .btn-primary:hover {
        background: #4338ca;
    }

    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-text {
        background: none;
        border: none;
        color: #4f46e5;
        font-size: 0.875rem;
        cursor: pointer;
        padding: 0;
    }

    .btn-text:hover {
        text-decoration: underline;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }

    .error {
        text-align: center;
        padding: 1rem;
        color: #991b1b;
        background: #fee2e2;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }

    .category-tabs {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.5rem;
    }

    .tab-button {
        background: none;
        border: none;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        color: #6b7280;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
    }

    .tab-button.active {
        color: #4f46e5;
        border-bottom-color: #4f46e5;
    }

    .tab-button:hover {
        color: #4f46e5;
    }
</style> 