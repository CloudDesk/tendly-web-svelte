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
  export let variant: 'contained' | 'transparent' = 'contained';
  
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

    $: containerClasses = variant === 'contained' 
    ? 'bg-white rounded-lg shadow-sm p-4' 
    : 'bg-transparent';

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
    console.log(serverSide,page,"handlePageChange")
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

<div class={`table-container ${containerClasses}`}>
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
              <div class="th-content">
                {column.label}
                {#if column.sortable}
                  <div class="sort-indicator">
                    <i class="sort-arrow up"></i>
                    <i class="sort-arrow down"></i>
                  </div>
                {/if}
              </div>
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
    /* background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1rem; */
    min-width: 100%;
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
    background: #f6f7fb;
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 500;
    color: #676879;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
  }

  .th-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  th.sortable {
    cursor: pointer;
    user-select: none;
  }

  th.sortable:hover {
    background: #f0f1f5;
  }

  .sort-indicator {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-left: 4px;
    height: 12px;
    opacity: 0.3;
  }

  th.sortable:hover .sort-indicator {
    opacity: 0.5;
  }

  th.sorted .sort-indicator {
    opacity: 1;
  }

  .sort-arrow {
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
  }

  .sort-arrow.up {
    border-bottom: 4px solid #676879;
  }

  .sort-arrow.down {
    border-top: 4px solid #676879;
  }

  th.asc .sort-arrow.up,
  th.desc .sort-arrow.down {
    border-bottom-color: #0073ea;
    border-top-color: #0073ea;
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