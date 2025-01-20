<script lang="ts">
  import Table from '$lib/components/common/Table.svelte';
  import type { LeaveRequest, LeaveSummary } from '$lib/services/api/leaves';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { leavesApi } from '$lib/services/api/leaves';
  import Modal from '$lib/components/common/Modal.svelte';
  import LeaveForm from '$lib/components/leave/LeaveForm.svelte';

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
    leaveTypeId: string;
  };

  $: ({ leaves, pagination, filters, sort ,leaveTypeId } = data);
console.log(leaveTypeId,"leaveTypeId")
  const columns = [
    { key: 'startDate', label: 'Start Date', sortable: true,
      render: (leave: LeaveRequest) => new Date(leave.startDate).toLocaleDateString() },
    { key: 'endDate', label: 'End Date', sortable: true,
      render: (leave: LeaveRequest) => new Date(leave.endDate).toLocaleDateString() },

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
  let loading = false;
  
  // Initialize editingLeave with default values
  let formValues = {
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'Pending',
    leaveTypeId: leaveTypeId|| "678dec1789f768e0b1877aae"
  };


  async function handleLeaveSubmit(event: CustomEvent) {
    loading = true;
    const submittedData = event.detail;
  console.log('Submitted data:', submittedData);
  
    try {
      const values = {
        ...submittedData,
        leaveTypeId: leaveTypeId || "678dec1789f768e0b1877aae"
      };
      
      const res = await leavesApi.create(values);
      console.log('Leave created:', res);
      showApplyForm = false;
    
      // Refresh the page
      goto($page.url, { replaceState: true });
      
    } catch (error) {
      console.error('Error submitting leave:', error);
      // Handle error (show toast, etc.)
    } finally {
      loading = false;
    }
  }
  function openApplyForm() {
    showApplyForm = true;
  }
  function handleFormUpdate(event: CustomEvent) {
    formValues = event.detail;
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
    <Modal
      show={showApplyForm}
      title="Leave Details"
      onClose={() => (showApplyForm = false)}
    >
    <LeaveForm
    {loading}
    initialValues={formValues}
    on:submit={handleLeaveSubmit}
    on:update={handleFormUpdate}
    on:cancel={() => (showApplyForm = false)}
  />
    </Modal>
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

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  

  :global(.btn-primary) {
    background-color: #3b82f6;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    font-weight: 500;
    cursor: pointer;
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
</style>

