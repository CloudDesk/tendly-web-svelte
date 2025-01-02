<script lang="ts">
  import { onMount } from 'svelte';
  import { employeesApi } from '$lib/services/api';
  import Table from '$lib/components/common/Table.svelte';
  import type { User, PaginationMeta } from '$lib/types';
  import { goto } from '$app/navigation';

  let employees: User[] = [];
  let loading = true;
  let error: string | null = null;
  let meta: PaginationMeta | null = null;
  let currentQuery = '';
  let currentSort: { key: string; direction: 'asc' | 'desc' } | null = null;

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { 
      key: 'active', 
      label: 'Status', 
      sortable: true,
      render: (user: User) => `
        <span class="status ${user.active ? 'active' : 'inactive'}">
          ${user.active ? 'Active' : 'Inactive'}
        </span>
      `
    },
    {
      key: '_id',
      label: 'Actions',
      render: (user: User) => `
        <a href="/admin/employees/${user._id}" class="btn-action" data-sveltekit-preload>
          View
        </a>
        <button class="btn-action">
          Edit
        </button>
      `
    }
  ];

  async function fetchEmployees(params = {}) {
    loading = true;
    error = null;
    
    try {
      const response = await employeesApi.list(params);
      employees = response.data;
      meta = response.meta;
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchEmployees({ page: 1, limit: 10 });
  });

  function handleSearch(event: CustomEvent) {
    const { query } = event.detail;
    currentQuery = query;
    fetchEmployees({ 
      page: 1, 
      limit: meta?.limit || 10,
      search: query,
      ...(currentSort && { 
        sortBy: currentSort.key,
        sortOrder: currentSort.direction 
      })
    });
  }

  function handleSort(event: CustomEvent) {
    const { key, direction } = event.detail;
    currentSort = { key, direction };
    fetchEmployees({
      page: meta?.page || 1,
      limit: meta?.limit || 10,
      ...(currentQuery && { search: currentQuery }),
      sortBy: key,
      sortOrder: direction
    });
  }

  function handlePage(event: CustomEvent) {
    const { page } = event.detail;
    fetchEmployees({
      page,
      limit: meta?.limit || 10,
      ...(currentQuery && { search: currentQuery }),
      ...(currentSort && { 
        sortBy: currentSort.key,
        sortOrder: currentSort.direction 
      })
    });
  }

  async function handleRowClick(event: CustomEvent<User>) {
    const user = event.detail;
    await goto(`/admin/employees/${user._id}`);
  }
</script>

<div class="employees-page">
  <header>
    <h1>Employees</h1>
    <a href="/admin/employees/new" class="btn-primary" data-sveltekit-preload>Add Employee</a>
  </header>

  <Table
    {columns}
    data={employees}
    {loading}
    {error}
    {meta}
    serverSide={true}
    on:search={handleSearch}
    on:sort={handleSort}
    on:page={handlePage}
    on:rowClick={handleRowClick}
  />
</div>

<style>
  .employees-page {
    max-width: 1200px;
    margin: 0 auto;
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

  :global(.status.active) {
    background: #dcfce7;
    color: #166534;
  }

  :global(.status.inactive) {
    background: #fee2e2;
    color: #991b1b;
  }

  :global(.actions) {
    display: flex;
    gap: 0.5rem;
  }

  :global(.btn-action) {
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    text-decoration: none;
    background: #f3f4f6;
    color: #374151;
    border: none;
    cursor: pointer;
  }

  :global(.btn-action:hover) {
    background: #e5e7eb;
  }
</style> 