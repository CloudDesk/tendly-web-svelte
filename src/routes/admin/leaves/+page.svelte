<script lang="ts">
  import Table from '$lib/components/common/Table.svelte';
  import type { LeaveRequest, LeaveSummary } from '$lib/services/api/leaves';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { leavesApi } from '$lib/services/api/leaves';
  import Modal from '$lib/components/common/Modal.svelte';

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
  let loading = false;
  
  // Initialize editingLeave with default values
  let editingLeave = {
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'Pending',
  };

  // Define form fields configuration
  const fields = [
    {
      key: 'type',
      label: 'Leave Type',
      required: true,
      inputType: 'select',
      options: [
        { value: 'annual', label: 'Annual Leave' },
        { value: 'sick', label: 'Sick Leave' },
        { value: 'compOff', label: 'Comp Off' },
        { value: 'lossOfPay', label: 'Loss of Pay' }
      ]
    },
    {
      key: 'startDate',
      label: 'Start Date',
      required: true,
      inputType: 'date'
    },
    {
      key: 'endDate',
      label: 'End Date',
      required: true,
      inputType: 'date'
    },
    {
      key: 'reason',
      label: 'Reason',
      required: true,
      inputType: 'textarea'
    }
  ];

  async function handleSubmit(event: Event) {
    event.preventDefault();
    loading = true;
    
    let values ={...editingLeave ,leaveTypeId :editingLeave.type}
    try {
      console.log('Form data:', values);
    
        let res = await leavesApi.create(values)
      console.log(res,"res handleSubmit");
      showApplyForm = false;
      // Reset form
      editingLeave = {
        type: '',
        startDate: '',
        endDate: '',
        reason: '',
        status: ''
      };
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle error (show toast, etc.)
    } finally {
      loading = false;
    }
  }

  function openApplyForm() {
    console.log("apply")
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
    <Modal
      show={showApplyForm}
      title="Leave Details"
      onClose={() => (showApplyForm = false)}
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
            on:click={() => (showApplyForm = false)}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </form>
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

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-container {
    background: white;
    border-radius: 0.5rem;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-content {
    padding: 2rem;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #374151;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    background-color: white;
  }

  .form-group textarea {
    min-height: 100px;
    resize: vertical;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
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

  :global(.btn-secondary) {
    background-color: #e5e7eb;
    color: #374151;
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