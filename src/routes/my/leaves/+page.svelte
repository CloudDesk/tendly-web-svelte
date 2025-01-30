<script lang="ts">
  import Table from '$lib/components/common/Table.svelte';
  import type { LeaveRequest, LeaveSummary } from '$lib/services/api/leaves';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { leavesApi } from '$lib/services/api/leaves';
  import Modal from '$lib/components/common/Modal.svelte';
  import LeaveForm from '$lib/components/leave/LeaveForm.svelte';
  import { getLeaveTypeLabel, leaveStatusOptions, leaveTypeOptions } from '$lib/constants/leaveTypes.js';
  import { toast } from '$lib/components/common/stores/toast.store.js';
  import Filter from '$lib/components/common/Filter.svelte';
  import { writable, derived } from 'svelte/store';
  import type { LeaveFilterSchema } from '$lib/types';

  export let data;
  let isLoading = false;
  $: ({ leaves, summary, pagination, filters, sort, leaveTypeId } = data);

  const columns = [
    {
      key: 'leaveType',
      label: 'Leave Type',
      sortable: true,
      render: (leave: LeaveRequest) => getLeaveTypeLabel(leave.leaveType || '')
    },
    {
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      render: (leave: LeaveRequest) => new Date(leave.startDate).toLocaleDateString()
    },
    {
      key: 'endDate',
      label: 'End Date',
      sortable: true,
      render: (leave: LeaveRequest) => new Date(leave.endDate).toLocaleDateString()
    },
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
        <a href="/my/leaves/${leave._id}" class="btn btn-sm btn-ghost" data-sveltekit-preload>
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

  async function handlePage(event: CustomEvent) {
    isLoading = true;
    try {
      const { page: newPage } = event.detail;
      const url = new URL($page.url);
      url.searchParams.set('page', newPage.toString());
      await goto(url, { replaceState: true, invalidateAll: true });
    } finally {
      isLoading = false;
    }
  }

  let showApplyForm = false;
  let loading = false;

  // Initialize formValues with default values
  let defaultFormValues = {
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'Pending',
    leaveTypeId: leaveTypeId || "678dec1789f768e0b1877aae"
  };

  let formValues = { ...defaultFormValues };

  function openApplyForm() {
    // Reset form values when opening the form
    formValues = { ...defaultFormValues };
    showApplyForm = true;
  }

  function closeApplyForm() {
    // Reset form values when closing the form
    formValues = { ...defaultFormValues };
    showApplyForm = false;
  }

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
      toast.success('Leave applied successfully');
      showApplyForm = false;

      // Refresh the page data by invalidating current URL
      const currentUrl = new URL($page.url);
      // Add or update a timestamp parameter to force reload
      currentUrl.searchParams.set('t', Date.now().toString());

      // Navigate to the modified URL to trigger a refresh
      await goto(currentUrl, {
        replaceState: true,
        invalidateAll: true // This will force SvelteKit to refetch the page data
      });

    } catch (error) {
      console.log('Error submitting leave:', error);
      toast.error('Failed to apply leave');
      // Handle error (show toast, etc.)
    } finally {
      setTimeout(() => {
        closeApplyForm();
        loading = false;
      }, 500);
    }
  }

  function handleFormUpdate(event: CustomEvent) {
    formValues = event.detail;
  }

  let isFilterOpen = false;
  let filterValues = writable({});
  let appliedFilterValues = writable({}); // Store applied filter values separately

  const filtersSchema: LeaveFilterSchema[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as 'select',
      options: [...leaveStatusOptions, { label: 'Cancelled', value: 'Cancelled' }]
    },
    {
      key: 'leaveType',
      label: 'Leave Type',
      type: 'select',
      options: leaveTypeOptions
    },
    {
      key: 'fromDate',
      label: 'From Date',
      type: 'date'
    },
    {
      key: 'toDate',
      label: 'To Date',
      type: 'date'
    }
  ];

  function toggleFilter() {
    isFilterOpen = !isFilterOpen;
  }

  function handleFilterChange(event: CustomEvent) {
    const { values } = event.detail;
    console.log('Filter values changed:', values);
    filterValues.set(values);   // Update temporary values
    console.log($filterValues, "filterValues");
  }

  async function handleFilterApply(event: CustomEvent) {
    console.log(event.detail,"handleFilterApply")
    const  values  = event.detail;
    console.log(values,"values")
     appliedFilterValues.set(values); // Update applied values
    const url = new URL($page.url);

    // Clear existing filter params
    ['status', 'leaveType', 'fromDate', 'toDate'].forEach(key => {
      url.searchParams.delete(key);
    });

    // Add new filter params, handling arrays for checkbox values
    Object.entries(values).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Join array values with commas for checkbox type
        if (value.length > 0) {
          url.searchParams.set(key, value.join(','));
        }
      } else if (value) {
        url.searchParams.set(key, value.toString());
      }
    });

    // Reset to first page when filtering
    url.searchParams.set('page', '1');

    isLoading = true;
    try {
      await goto(url, { replaceState: true });
    } finally {
      isLoading = false;
      isFilterOpen=false;
    }
  }

  async function handleFilterReset() {
    // Reset local filter values
    filterValues.set({});
    appliedFilterValues.set({})

    // Clear filter-related URL parameters
    const url = new URL($page.url);

    // Get all filter keys from filterConfig
    const filterKeys = filtersSchema.map(filter => filter.key);

    // Clear all filter-related search params
    filterKeys.forEach(key => {
      url.searchParams.delete(key);
    });

    // Reset to first page
    url.searchParams.set('page', '1');

    isLoading = true;
    try {
      await goto(url, { replaceState: true });
    } finally {
      isLoading = false;
      toggleFilter();
    }
  }

  const selectedFilterCount = derived(filterValues, ($filterValues) => {
    return Object.values($filterValues).reduce((count: number, value: any) => {
      if (Array.isArray(value)) {
        return count + value.length;
      } else if (value) {
        return count + 1;
      }
      return count;
    }, 0);
  });
</script>

<svelte:head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</svelte:head>

<div class="leaves-page">
  <header>
    <div class="header-left">
      <h1>Leave Management</h1>
      <div class="header-actions">
        <button 
          class="btn-filter" 
          class:active={isFilterOpen}
          on:click={toggleFilter}
        >
          <i class="fas fa-filter"></i>
          {#if $selectedFilterCount > 0}
            <span class="filter-badge">{$selectedFilterCount}</span>
          {/if}
          Filter
        </button>
        <button 
          class="btn-view"
        >
          <i class="fas fa-table-list"></i>
          View
        </button>
      </div>
    </div>
    <div class="header-right">
      <button class="btn-secondary">
        <i class="fas fa-file-export"></i>
        Export
      </button>
      <button class="btn-primary" on:click={openApplyForm}>
        <i class="fas fa-plus"></i>
        Apply Leave
      </button>
    </div>
  </header>

  {#if showApplyForm}
    <Modal
      show={showApplyForm}
      title="Leave Details"
      onClose={() => (showApplyForm = false)}
    >
      <LeaveForm
        {loading}
        {summary}
        initialValues={formValues}
        on:submit={handleLeaveSubmit}
        on:update={handleFormUpdate}
        on:cancel={() => (showApplyForm = false)}
      />
    </Modal>
  {/if}

  <Filter
    filters={filtersSchema}
    values={$appliedFilterValues}
    isOpen={isFilterOpen}
    on:change={handleFilterChange}
    on:apply={handleFilterApply}
    on:reset={handleFilterReset}
    on:close={() => isFilterOpen = false}
  />

  <div class="table-container">
    <Table
      {columns}
      data={leaves}
      loading={isLoading}
      meta={pagination}
      serverSide={true}
      on:search={handleSearch}
      on:sort={handleSort}
      on:page={handlePage}
    />
  </div>
</div>

<style>
 .leaves-page {
  padding: 24px;
  background: #f6f7fb;
  min-height: 100vh;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  /* background: #f0f1f5; */
  padding: 2px;
  border-radius: 6px;
}

h1 {
  font-size: 24px;
  font-weight: 600;
  color: #323338;
  margin: 0;
}

/* Base button styles */
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

/* Filter and View button styles */
.btn-filter, 
.btn-view {
  background: #f0f1f5;
  color: #4b4b4b;
  padding: 8px 12px;
  font-weight: 500;
  position: relative;
  min-width: 90px;
}

/* Active/Selected state for filter/view buttons */
.btn-filter.active, 
.btn-view.active {
  background: white;
  color: #0073ea;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Hover state for filter/view buttons */
.btn-filter:hover, 
.btn-view:hover {
  background: white;
  color: #0073ea;
}

/* Filter badge styling */
.filter-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff3b30;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #f6f7fb;
}

/* Right side action buttons */
.header-right {
  display: flex;
  gap: 12px;
}

/* Primary button style */
.btn-primary {
  background: #0073ea;
  color: white;
  padding: 10px 18px;
  box-shadow: 0 2px 4px rgba(0, 115, 234, 0.2);
}

.btn-primary:hover {
  background: #0060c2;
  box-shadow: 0 4px 6px rgba(0, 115, 234, 0.25);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 115, 234, 0.2);
}

/* Secondary button style */
.btn-secondary {
  background: white;
  color: #323338;
  border: 1px solid #e0e0e0;
  padding: 9px 18px;
}

.btn-secondary:hover {
  background: #f8f9fc;
  border-color: #d0d0d0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-secondary:active {
  background: #f0f1f5;
  border-color: #d0d0d0;
}

/* Icon styles */
button i {
  font-size: 16px;
}

.btn-primary i,
.btn-secondary i {
  font-size: 14px;
}

/* Disabled state for all buttons */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

  .filter-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: red;
    color: white;
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: bold;
  }

  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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

  :global(.btn-action) {
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 4px;
    background: transparent;
    color: #676879;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.btn-action:hover) {
    background: #f5f6f8;
    color: #323338;
  }
</style>