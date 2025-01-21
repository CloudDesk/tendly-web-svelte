<script lang="ts">
  import Table from '$lib/components/common/Table.svelte';
  import type { User } from '$lib/types_old.js';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Modal from '$lib/components/common/Modal.svelte';
  import EmployeeForm from '$lib/components/employee/EmployeeForm.svelte';

  export let data;

  $: ({ employees, pagination, filters, sort } = data);
  console.log(pagination,"pagination")
  const columns = [
    { 
      key: 'name', 
      label: 'Name', 
      sortable: true,
      render: (user: User) => `
        <div class="name-cell">
          <div class="avatar">${user.name[0]}</div>
          <div class="user-info">
            <div class="full-name">${user.name}</div>
            <div class="email">${user.email}</div>
          </div>
        </div>
      `
    },
    { 
      key: 'roleId', 
      label: 'Role', 
      sortable: true,
      render: (user: User) => `
        <div class="role-badge ${user.roleId.toLowerCase()}">${user.roleId}</div>
      `
    },
    { 
      key: 'isActive', 
      label: 'Status', 
      sortable: true,
      render: (user: User) => `
        <div class="status-badge ${user.active ? 'active' : 'inactive'}">
          ${user.active ? 'Active' : 'Inactive'}
        </div>
      `
    },
    {
      key: '_id',
      label: 'Actions',
      render: (user: User) => `
        <div class="actions">
          <button class="btn-action view" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-action edit" title="Edit">
            <i class="fas fa-pencil"></i>
          </button>
          <button class="btn-action more" title="More">
            <i class="fas fa-ellipsis-h"></i>
          </button>
        </div>
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

  function handleRowClick(event: CustomEvent<User>) {
    const user = event.detail;
    goto(`/admin/employees/${user._id}`);
  }

    // Initialize formValues with default values
    let defaultFormValues = {
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'Pending',

  };

  let formValues= {...defaultFormValues};
  let showApplyForm = false;
  let loading = false;

  function openApplyForm() {
    // Reset form values when opening the form
    formValues = { ...defaultFormValues };
    showApplyForm = true;
  }

  async function handleFormSubmit(event:CustomEvent){
    console.log("submitting form with data:",event.detail);
    showApplyForm=false;
  }
  function handleFormUpdate(event: CustomEvent) {
    formValues = event.detail;
  }

</script>

<svelte:head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</svelte:head>

<div class="employees-page">
  <header>
    <div class="header-left">
      <h1>Employees</h1>
      <div class="header-actions">
        <button class="btn-filter">
          <i class="fas fa-filter"></i>
          Filter
        </button>
        <button class="btn-view">
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
        Add Employee
      </button>
    </div>
  </header>


  {#if showApplyForm}
    <Modal
      show={showApplyForm}
      title="New Employee"
      onClose={() => (showApplyForm = false)}
    >
    <EmployeeForm
      {loading}
      initialValues={formValues}
      on:submit={handleFormSubmit}
      on:update={handleFormUpdate}
      on:cancel={() => (showApplyForm = false)}

    />
      <!-- <LeaveForm
        {loading}
        initialValues={formValues}
        on:submit={handleLeaveSubmit}
        on:update={handleFormUpdate}
        on:cancel={() => (showApplyForm = false)}
      /> -->
    </Modal>
  {/if}

  <div class="table-container">
    <Table
      {columns}
      data={employees}
      loading={$page.url.searchParams.toString() !== $page.url.searchParams.toString()}
      meta={pagination}
      currentSort={sort}
      serverSide={true}
      on:search={handleSearch}
      on:sort={handleSort}
      on:page={handlePage}
      on:rowClick={handleRowClick}
    />
  </div>
</div>

<style>
  .employees-page {
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
    gap: 8px;
  }

  .header-right {
    display: flex;
    gap: 12px;
  }

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #323338;
    margin: 0;
  }

  button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #0073ea;
    color: white;
  }

  .btn-primary:hover {
    background: #0060c2;
  }

  .btn-secondary {
    background: white;
    color: #323338;
    border: 1px solid #dcdcdc;
  }

  .btn-secondary:hover {
    background: #f5f6f8;
  }

  .btn-filter, .btn-view {
    background: transparent;
    color: #676879;
    padding: 6px 12px;
  }

  .btn-filter:hover, .btn-view:hover {
    background: #f5f6f8;
  }

  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  :global(.name-cell) {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  :global(.avatar) {
    width: 32px;
    height: 32px;
    background: #e6f2ff;
    color: #0073ea;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 12px;
  }

  :global(.user-info) {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  :global(.full-name) {
    font-weight: 500;
    color: #323338;
  }

  :global(.email) {
    font-size: 12px;
    color: #676879;
  }

  :global(.role-badge) {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    text-transform: capitalize;
  }

  :global(.role-badge.admin) {
    background: #e5f4ff;
    color: #0073ea;
  }

  :global(.role-badge.manager) {
    background: #f5ebff;
    color: #a358df;
  }

  :global(.role-badge.staff) {
    background: #ecf6ec;
    color: #037f4c;
  }

  :global(.status-badge) {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  :global(.status-badge.active) {
    background: #ecf6ec;
    color: #037f4c;
  }

  :global(.status-badge.inactive) {
    background: #ffebeb;
    color: #d83a52;
  }

  :global(.actions) {
    display: flex;
    gap: 4px;
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