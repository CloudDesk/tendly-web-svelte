<script lang="ts">
    import { onMount } from 'svelte';
    import { writable, get } from 'svelte/store';
    import { leavesApi } from '$lib/services/api/leaves';
    import Table from '$lib/components/common/Table.svelte';
    import { getLeaveTypeLabel } from '$lib/constants/leaveTypes.js';
    import { toast } from '$lib/components/common/stores/toast.store.js';
    import type { LeaveFilters, LeaveRequest } from '$lib/services/api/leaves';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
  
    let leaves = writable<LeaveRequest[]>([]);
    let pagination = writable({ total: 0, page: 1, limit: 5, totalPages: 1 });
    let isLoading = writable(false);
    
    const columns = [
      {
        key: 'leaveType',
        label: 'Leave Type',
        sortable: true,
        render: (leave: LeaveRequest) => getLeaveTypeLabel(leave.leaveType || '')
      },
      {
        key: 'user',
        label: 'User',
        sortable: true,
        render: (leave: LeaveRequest) => `${leave.user?.name}`
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
          <a href="/manager/actions/leaves/${leave._id}" class="btn btn-sm btn-ghost" data-sveltekit-preload>
            View
          </a>
        `
      }
    ];

    // Helper function to get URL param with null/undefined handling
    function getUrlParam(searchParams: URLSearchParams, key: string) {
        const value = searchParams.get(key);
        return value || undefined; // Convert null to undefined
    }
    
    // Initialize filters with URL params, converting null to undefined
    let filters = writable<LeaveFilters>({
        page: Number(getUrlParam($page.url.searchParams, 'page')) || 1,
        limit: Number(getUrlParam($page.url.searchParams, 'limit')) || 5,
        search: getUrlParam($page.url.searchParams, 'search'),
        sortBy: getUrlParam($page.url.searchParams, 'sortBy'),
        sortOrder: getUrlParam($page.url.searchParams, 'sortOrder') as 'asc' | 'desc' | undefined
    });


    // Update URL and filters, then fetch data
    async function updateFiltersAndFetch(newParams: Record<string, string | undefined>) {
        const url = new URL($page.url);
        
        // Update URL params, handling undefined/null values
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) {
                url.searchParams.set(key, value);
            } else {
                url.searchParams.delete(key);
            }
        });

        // Update the URL without page reload
        await goto(url, { replaceState: true });

        // Update filters store with new values from URL
        filters.set({
            page: Number(getUrlParam(url.searchParams, 'page')) || 1,
            limit: Number(getUrlParam(url.searchParams, 'limit')) || 5,
            search: getUrlParam(url.searchParams, 'search'),
            sortBy: getUrlParam(url.searchParams, 'sortBy'),
            sortOrder: getUrlParam(url.searchParams, 'sortOrder') as 'asc' | 'desc' | undefined
        });
    }
  
    async function fetchLeaves() {
        const currentFilters = get(filters);
        
        // Clean up filters before sending to API
        const cleanFilters = Object.fromEntries(
            Object.entries(currentFilters).filter(([_, value]) => 
                value !== null && value !== undefined && value !== ''
            )
        );
        
        console.log("0. fetchLeaves clean filters:", cleanFilters);
        
        isLoading.set(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await leavesApi.getLeavesByAssignedId(user._id, cleanFilters);
            
            if (response.success) {
                leaves.set(response.data);
                pagination.set({
                    total: response.meta?.total || 0,
                    page: response.meta?.page || 1,
                    limit: response.meta?.limit || 10,
                    totalPages: response.meta?.totalPages || 1
                });
            }
        } catch (error) {
            console.error('Failed to fetch leaves:', error);
            toast.error('Failed to fetch leave records');
        } finally {
            isLoading.set(false);
        }
    }

    // Update filters when URL changes
    $: {
        if ($page.url.searchParams) {
            filters.set({
                page: Number(getUrlParam($page.url.searchParams, 'page')) || 1,
                limit: Number(getUrlParam($page.url.searchParams, 'limit')) || 5,
                search: getUrlParam($page.url.searchParams, 'search'),
                sortBy: getUrlParam($page.url.searchParams, 'sortBy'),
                sortOrder: getUrlParam($page.url.searchParams, 'sortOrder') as 'asc' | 'desc' | undefined
            });
        }
    }
  
    // Watch for filter changes and fetch data
    $: $filters, fetchLeaves();
  
    function handleSort(event: CustomEvent) {
        const { key, direction } = event.detail;
        // Only update sort params if direction is provided
        const updates: Record<string, string | undefined> = {
            sortBy: direction ? key : undefined,
            sortOrder: direction || undefined
        };
        updateFiltersAndFetch(updates);
    }
    
    function handleSearch(event: CustomEvent) {
        const { query } = event.detail;
        updateFiltersAndFetch({
            search: query || undefined,
            page: '1' // Reset to first page on new search
        });
    }
    
    function handlePage(event: CustomEvent) {
        const { page: newPage } = event.detail;
        updateFiltersAndFetch({
            page: newPage.toString()
        });
    }
  
    onMount(() => {
        fetchLeaves();
    });
</script>
  
<div class="assigned-leaves">
    <!-- <header>
        <h2 class="text-xl font-semibold mb-4">Assigned Leaves</h2>
    </header> -->
  
    <div class="table-container">
        <Table
            {columns}
            data={$leaves}
            loading={$isLoading}
            meta={$pagination}
            serverSide={true}
            on:search={handleSearch}
            on:sort={handleSort}
            on:page={handlePage}
        />
    </div>
</div>


  <style>
    .assigned-leaves {
      padding: 24px;
      background: #f6f7fb;
      min-height: 100vh;
    }
  
    header {
      margin-bottom: 24px;
    }
  
    h2 {
      font-size: 24px;
      font-weight: 600;
      color: #323338;
      margin: 0;
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
      background: #d1fae5;
      color: #047857;
    }
  
    :global(.status.pending) {
      background: #fef3c7;
      color: #b45309;
    }
  
    :global(.status.rejected) {
      background: #fee2e2;
      color: #b91c1c;
    }
  
    :global(.status.cancelled) {
      background: #f3f4f6;
      color: #4b5563;
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