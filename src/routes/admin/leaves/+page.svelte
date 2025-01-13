<script lang="ts">
  import Table from '$lib/components/common/Table.svelte';
  import type { LeaveRequest, LeaveSummary } from '$lib/services/api/leaves';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { leavesApi } from '$lib/services/api/leaves';

  export let data: {
    leaves: LeaveRequest[];
    summary: LeaveSummary;
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
    filters: any;
    sort: { key: string; direction: 'asc' | 'desc' } | null;
  };

  $: ({ leaves, pagination, filters, sort } = data);

  const columns = [
    { key: 'startDate', label: 'Start Date', sortable: true,
      render: (leave: LeaveRequest) => new Date(leave.startDate).toLocaleDateString() },
    { key: 'endDate', label: 'End Date', sortable: true,
      render: (leave: LeaveRequest) => new Date(leave.endDate).toLocaleDateString() },
    { key: 'reason', label: 'Reason', sortable: false },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (leave: LeaveRequest) => `
        <span class="status ${leave.status.toLowerCase()}">
          ${leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
        </span>
      `
    },
    {
      key: 'appliedOn',
      label: 'Applied On',
      sortable: true,
      render: (leave: LeaveRequest) => new Date(leave.appliedOn).toLocaleDateString()
    },
    {
      key: '_id',
      label: 'Actions',
      render: (leave: LeaveRequest) => `
        <a href="/admin/leaves/${leave._id}" class="btn-action" data-sveltekit-preload>
          View
        </a>
      `
    }
 
  ];

  function handleSearch(event: CustomEvent) {
    const { query } = event.detail;
    const url = new URL($page.url);
    url.searchParams.set('search', query);
    url.searchParams.set('page', '1');
    goto(url, { replaceState: true });
  }

  function handleSort(event: CustomEvent) {
    const { key, direction } = event.detail;
    const url = new URL($page.url);
    url.searchParams.set('sortBy', key);
    url.searchParams.set('sortOrder', direction);
    goto(url, { replaceState: true });
  }

  function handlePage(event: CustomEvent) {
    const { page: newPage } = event.detail;
    const url = new URL($page.url);
    url.searchParams.set('page', newPage.toString());
    goto(url, { replaceState: true });
  }

  let showApplyForm = false;
  let newLeave = {
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: ''
  };

  async function handleApplyLeave() {
    try {
      await leavesApi.create({
        userId: $page.params.userId,
        ...newLeave
      });
      showApplyForm = false;
      // Refresh the page to show new leave request
      goto($page.url, { invalidateAll: true });
    } catch (error) {
      console.error('Failed to apply leave:', error);
      // Handle error (show toast notification, etc.)
    }
  }

  function openApplyForm() {
    showApplyForm = true;
  }
</script>

<div class="leaves-page">
  <header>
    <h1>Leave Management</h1>
    <button class="btn-primary" on:click={openApplyForm}>
      Apply Leave
    </button>
  </header>

  {#if showApplyForm}
    <div class="modal" on:click|self={() => showApplyForm = false}>
      <div class="modal-content">
        <h2>Apply Leave</h2>
        <form on:submit|preventDefault={handleApplyLeave}>
          <div class="form-group">
            <label for="leaveType">Leave Type</label>
            <select id="leaveType" bind:value={newLeave.type}>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="compOff">Comp Off</option>
              <option value="lossOfPay">Loss of Pay</option>
            </select>
          </div>
          <div class="form-group">
            <label for="startDate">Start Date</label>
            <input type="date" id="startDate" bind:value={newLeave.startDate} required>
          </div>
          <div class="form-group">
            <label for="endDate">End Date</label>
            <input type="date" id="endDate" bind:value={newLeave.endDate} required>
          </div>
          <div class="form-group">
            <label for="reason">Reason</label>
            <textarea id="reason" bind:value={newLeave.reason} required></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" on:click={() => showApplyForm = false}>
              Cancel
            </button>
            <button type="submit" class="btn-primary">Apply</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <Table
    {columns}
    data={leaves}
    loading={$page.url.searchParams.toString() !== $page.url.searchParams.toString()}
    {pagination}
    currentSort={sort}
    serverSide={true}
    on:search={handleSearch}
    on:sort={handleSort}
    on:page={handlePage}
  />
</div>

<style>
  .leaves-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  :global(.status) {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  :global(.status.approved) {
    background: #dcfce7;
    color: #166534;
  }

  :global(.status.pending) {
    background: #fef9c3;
    color: #854d0e;
  }

  :global(.status.rejected) {
    background: #fee2e2;
    color: #991b1b;
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    width: 100%;
    max-width: 500px;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }
</style>