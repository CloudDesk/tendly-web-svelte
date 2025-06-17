<script lang="ts">
    import Table from "$lib/components/common/Table.svelte";
    import Filter from "$lib/components/common/Filter.svelte";
    import { leavesApi, type LeaveFilters ,type LeaveRequest } from "$lib/services/api";
   
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { writable, derived } from "svelte/store";
    import { getLeaveTypeLabel, leaveStatusOptions, leaveTypeOptions } from "$lib/constants/leaveTypes.js";
    import type { LeaveFilterSchema } from "$lib/types";
  
    export let userId: string;
  
    let isLoading = false;
    let isFilterOpen = false;
    let filterValues = writable({});
    let appliedFilterValues = writable({});
    let leaves: LeaveRequest[] = [];
    let pagination = {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1
    };
    let sort: { key: string; direction: 'asc' | 'desc' } | null = null;
  
    // Define table columns
    const columns = [
      {
        key: "leaveType",
        label: "Leave Type",
        sortable: true,
        render: (leave: LeaveRequest) => getLeaveTypeLabel(leave.leaveType || ""),
      },
      {
        key: "startDate",
        label: "Start Date",
        sortable: true,
        render: (leave: LeaveRequest) =>
          new Date(leave.startDate).toLocaleDateString(),
      },
      {
        key: "endDate",
        label: "End Date",
        sortable: true,
        render: (leave: LeaveRequest) =>
          new Date(leave.endDate).toLocaleDateString(),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (leave: LeaveRequest) => `
          <span class="status ${leave.status.toLowerCase()}">
            ${leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
          </span>
        `,
      },
      {
        key: "_id",
        label: "Actions",
        render: (leave: LeaveRequest) => `
          <a href="/my/leaves/${leave._id}" class="btn btn-sm btn-ghost" data-sveltekit-preload>
            View
          </a>
        `,
      },
    ];
  
    // Define filter schema
    const filtersSchema: LeaveFilterSchema[] = [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          ...leaveStatusOptions,
          { label: "Cancelled", value: "Cancelled" },
        ],
      },
      {
        key: "leaveType",
        label: "Leave Type",
        type: "select",
        options: leaveTypeOptions,
      },
      {
        key: "fromDate",
        label: "From Date",
        type: "date",
      },
      {
        key: "toDate",
        label: "To Date",
        type: "date",
      },
    ];
  
    // Derived store for selected filter count
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
  
    // Fetch leaves data
    async function fetchLeaves() {
      isLoading = true;
      try {
        const url = new URL($page.url);
        const filters: LeaveFilters = {
          page: Number(url.searchParams.get('page')) || 1,
          limit: Number(url.searchParams.get('limit')) || 20,
          search: url.searchParams.get('search') || undefined,
          status: url.searchParams.get('status') || undefined,
          leaveType: url.searchParams.get('leaveType') || undefined,
          userId: userId,
          fromDate: url.searchParams.get('fromDate') || undefined,
          toDate: url.searchParams.get('toDate') || undefined
        };
  
        const sortBy = url.searchParams.get('sortBy');
        const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
  
        const response = await leavesApi.myList(userId, {
          ...filters,
          ...(sortBy && sortOrder && { sortBy, sortOrder })
        });
  
        leaves = response.data || [];
        pagination = {
          total: response.meta?.total || 0,
          page: response.meta?.page || 1,
          limit: response.meta?.limit || 20,
          totalPages: response.meta?.totalPages || 1
        };
        sort = sortBy && sortOrder ? { key: sortBy, direction: sortOrder } : null;
      } catch (error) {
        console.error('Failed to load leaves:', error);
        leaves = [];
        pagination = { total: 0, page: 1, limit: 20, totalPages: 1 };
        sort = null;
      } finally {
        isLoading = false;
      }
    }
  
    // Initial fetch and refetch on URL changes
    $: {
      fetchLeaves();
    }
  
    // Handle search event
    function handleSearch(event: CustomEvent) {
      const { query } = event.detail;
      const url = new URL($page.url);
      url.searchParams.set("search", query);
      url.searchParams.set("page", "1");
      goto(url, { replaceState: true });
    }
  
    // Handle sort event
    function handleSort(event: CustomEvent) {
      const { key, direction } = event.detail;
      const url = new URL($page.url);
      url.searchParams.set("sortBy", key);
      url.searchParams.set("sortOrder", direction);
      goto(url, { replaceState: true });
    }
  
    // Handle page change event
    async function handlePage(event: CustomEvent) {
      isLoading = true;
      try {
        const { page: newPage } = event.detail;
        const url = new URL($page.url);
        url.searchParams.set("page", newPage.toString());
        await goto(url, { replaceState: true, invalidateAll: true });
      } finally {
        isLoading = false;
      }
    }
  
    // Toggle filter panel
    function toggleFilter() {
      isFilterOpen = !isFilterOpen;
    }
  
    // Handle filter change
    function handleFilterChange(event: CustomEvent) {
      const { values } = event.detail;
      filterValues.set(values);
    }
  
    // Handle filter apply
    async function handleFilterApply(event: CustomEvent) {
      const values = event.detail;
      appliedFilterValues.set(values);
      const url = new URL($page.url);
  
      ["status", "leaveType", "fromDate", "toDate"].forEach((key) => {
        url.searchParams.delete(key);
      });
  
      Object.entries(values).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            url.searchParams.set(key, value.join(","));
          }
        } else if (value) {
          url.searchParams.set(key, value.toString());
        }
      });
  
      url.searchParams.set("page", "1");
  
      isLoading = true;
      try {
        await goto(url, { replaceState: true });
      } finally {
        isLoading = false;
        isFilterOpen = false;
      }
    }
  
    // Handle filter reset
    async function handleFilterReset() {
      filterValues.set({});
      appliedFilterValues.set({});
  
      const url = new URL($page.url);
      const filterKeys = filtersSchema.map((filter) => filter.key);
  
      filterKeys.forEach((key) => {
        url.searchParams.delete(key);
      });
  
      url.searchParams.set("page", "1");
  
      isLoading = true;
      try {
        await goto(url, { replaceState: true });
      } finally {
        isLoading = false;
        toggleFilter();
      }
    }
  </script>
  
  <svelte:head>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
    />
  </svelte:head>
  
  <div class="leaves-table-container">
    <div class="filter-toggle">
      <button on:click={toggleFilter} class="btn btn-sm btn-ghost">
        <i class="fas fa-filter"></i>
        Filters
        {#if $selectedFilterCount > 0}
          <span class="badge badge-primary">{$selectedFilterCount}</span>
        {/if}
      </button>
    </div>
  
    <Table
      {columns}
      data={leaves}
      loading={isLoading}
      searchable={false}
      meta={pagination}
      serverSide={true}
      on:search={handleSearch}
      on:sort={handleSort}
      on:page={handlePage}
    />
  
    <Filter
      filters={filtersSchema}
      values={$appliedFilterValues}
      isOpen={isFilterOpen}
      on:change={handleFilterChange}
      on:apply={handleFilterApply}
      on:reset={handleFilterReset}
      on:close={() => (isFilterOpen = false)}
    />
  </div>
  
  <style>
    .leaves-table-container {
      padding: 1rem;
    }
    .filter-toggle {
        display: flex;
        justify-content: flex-end;
      margin-bottom: 1rem;
    }
    .status {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      display: inline-block;
    }
    .status.pending { background-color: #fefcbf; color: #b7791f; }
    .status.approved { background-color: #c6f6d5; color: #2f855a; }
    .status.rejected { background-color: #fed7d7; color: #c53030; }
    .status.cancelled { background-color: #e2e8f0; color: #4a5568; }
  </style>