<script lang="ts">
  import Table from '$lib/components/common/Table.svelte';
  import type { User } from '$lib/types';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  export let data;

  $: ({ employees, pagination, filters, sort } = data);

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

  function handleSearch(event: CustomEvent) {
    const { query } = event.detail;
    const url = new URL($page.url);
    url.searchParams.set('search', query);
    url.searchParams.set('page', '1'); // Reset to first page on new search
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

  function handleRowClick(event: CustomEvent<User>) {
    const user = event.detail;
    goto(`/admin/employees/${user._id}`);
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
    loading={$page.url.searchParams.toString() !== $page.url.searchParams.toString()}
    pagination={pagination}
    currentSort={sort}
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