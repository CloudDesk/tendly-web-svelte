<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PaginationMeta } from '$lib/types';
  
  type Column<T> = {
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (item: T) => string | HTMLElement;
  };

  export let data: any[] = [];
  export let columns: Column<any>[] = [];
  export let searchable: boolean = true;
  export let loading: boolean = false;
  export let error: string | null = null;
  export let meta: PaginationMeta | null = null;
  export let serverSide: boolean = false;

  let searchQuery = '';
  let sortKey: string | null = null;
  let sortDirection: 'asc' | 'desc' = 'asc';
  let currentPage = 1;
  let itemsPerPage = 10;

  const dispatch = createEventDispatcher();

  $: if (serverSide && meta) {
    currentPage = meta.page;
    itemsPerPage = meta.limit;
  }

  $: filteredData = !serverSide && searchQuery && searchable
    ? data.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data;

  $: sortedData = !serverSide && sortKey
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortKey!];
        const bVal = b[sortKey!];
        const modifier = sortDirection === 'asc' ? 1 : -1;
        
        if (typeof aVal === 'string') {
          return aVal.localeCompare(bVal) * modifier;
        }
        return (aVal - bVal) * modifier;
      })
    : filteredData;

  function handleSort(column: Column<any>) {
    if (!column.sortable) return;

    if (sortKey === column.key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = column.key as string;
      sortDirection = 'asc';
    }

    if (serverSide) {
      dispatch('sort', { key: sortKey, direction: sortDirection });
    }
  }

  function handleSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    if (serverSide) {
      dispatch('search', { query });
    } else {
      searchQuery = query;
    }
  }

  function handlePageChange(page: number) {
    if (serverSide) {
      dispatch('page', { page });
    }
  }

  function handleRowClick(item: any) {
    dispatch('rowClick', item);
  }

  function handleActionClick(event: MouseEvent) {
    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    
    if (action && id) {
      event.stopPropagation();
      dispatch('action', { action, id });
    }
  }
</script>

<div class="table-container">
  {#if searchable}
    <div class="search-container">
      <input
        type="text"
        value={searchQuery}
        on:input={handleSearch}
        placeholder="Search..."
        class="search-input"
      />
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <span class="loader"></span>
      Loading...
    </div>
  {:else if error}
    <div class="error">
      {error}
    </div>
  {:else if sortedData.length === 0}
    <div class="empty">
      No data available
    </div>
  {:else}
    <table>
      <thead>
        <tr>
          {#each columns as column}
            <th 
              class:sortable={column.sortable}
              class:sorted={sortKey === column.key}
              class:asc={sortKey === column.key && sortDirection === 'asc'}
              class:desc={sortKey === column.key && sortDirection === 'desc'}
              on:click={() => handleSort(column)}
            >
              {column.label}
              {#if column.sortable}
                <span class="sort-icon">
                  {#if sortKey === column.key}
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  {:else}
                    ↕
                  {/if}
                </span>
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each sortedData as item}
          <tr 
            on:click={() => handleRowClick(item)}
            class="clickable"
          >
            {#each columns as column}
              <td on:click={handleActionClick}>
                {#if column.render}
                  {@html column.render(item)}
                {:else}
                  {item[column.key]}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>

    {#if meta}
      <div class="pagination">
        <button 
          class="btn-page" 
          disabled={meta.page === 1}
          on:click={() => handlePageChange(meta.page - 1)}
        >
          Previous
        </button>
        
        <div class="page-info">
          Page {meta.page} of {meta.totalPages}
          <span class="total-items">({meta.total} items)</span>
        </div>

        <button 
          class="btn-page" 
          disabled={meta.page === meta.totalPages}
          on:click={() => handlePageChange(meta.page + 1)}
        >
          Next
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .table-container {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1rem;
  }

  .search-container {
    margin-bottom: 1rem;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  th {
    background: #f9fafb;
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 500;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
  }

  th.sortable {
    cursor: pointer;
    user-select: none;
  }

  th.sortable:hover {
    background: #f3f4f6;
  }

  .sort-icon {
    display: inline-block;
    margin-left: 0.5rem;
    color: #9ca3af;
  }

  th.sorted .sort-icon {
    color: #4f46e5;
  }

  td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    color: #1f2937;
  }

  tr.clickable {
    cursor: pointer;
  }

  tr.clickable:hover {
    background: #f9fafb;
  }

  .loading, .error, .empty {
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  }

  .error {
    color: #ef4444;
  }

  .loader {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
    margin-top: 1rem;
  }

  .btn-page {
    padding: 0.5rem 1rem;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 0.375rem;
    color: #374151;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-page:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  .btn-page:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-info {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .total-items {
    margin-left: 0.5rem;
    color: #9ca3af;
  }
</style> 