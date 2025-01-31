<script lang="ts">
  import Table from '$lib/components/common/Table.svelte';
  import Modal from '$lib/components/common/Modal.svelte';
  import ShiftForm from './ShiftForm.svelte';
  import ShiftDetails from './ShiftDetails.svelte';
  import ShiftAssignment from './ShiftAssignment.svelte';
  import { onMount } from 'svelte';
  import type { Shift, User } from '$lib/types';
  import { shiftsApi, employeesApi } from '$lib/services/api/';
  import { page } from '$app/stores';


  let shifts: Shift[] = [];
  let employees: User[] = [];
  let loading = false;
  let error: string | null = null;
  let showForm = false;
  let showDetails = false;
  let showAssignModal = false;
  let assignmentStep = 1; // 1: Selection, 2: Preview
  let editingShift: Partial<Shift> = {};
  let selectedShift: Shift | null = null;
  let selectedEmployees: Set<string> = new Set();
  let searchQuery = '';
  let assignmentValidFrom = '';
  let assignmentValidTill = '';
  let pagination = {
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { 
      key: 'timing', 
      label: 'Timing',
      render: (row: Shift) => `${row.startTime} - ${row.endTime}`
    },
    { 
      key: 'window', 
      label: 'Window',
      render: (row: Shift) => `${row.shiftWindowStart} - ${row.shiftWindowEnd}`
    },
    { 
      key: 'validity', 
      label: 'Validity',
      render: (row: Shift) => `${row.validFrom} - ${row.validTill || 'No end date'}`
    },
    { 
      key: 'graceTime', 
      label: 'Grace Time',
      render: (row: Shift) => `${row.graceTimeInMinutes || 0} minutes`
    },
    { 
      key: 'actions', 
      label: 'Actions',
      render: (row: Shift) => row?._id ? `
        <button class="btn btn-sm btn-ghost" data-action="view" data-id="${row._id}">View</button>
        <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${row._id}">Edit</button>
        <button class="btn btn-sm btn-ghost" data-action="assign" data-id="${row._id}">Assign</button>
      ` : ''
    }
  ];

  async function loadShifts() {
    try {
      loading = true;
      const response = await shiftsApi.list({
        page:pagination.page, limit:pagination.limit, search: searchQuery
      });
      pagination ={
        total: response.meta?.total || 0,
        page: response.meta?.page || 1,
        limit: response.meta?.limit || 5,
        totalPages: response.meta?.totalPages || 1
      },
      shifts = response.data;
    } catch (err) {
      error = 'Failed to load shifts';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function loadEmployees() {
    try {
      const response = await employeesApi.list({ 
        page: 1,
        limit: 100, // Load more employees for assignment
        search: searchQuery
      });
      if(response.success){
        console.log(response.data,"0.emp")
        employees = response.data as User[];
      }
    } catch (err) {
      error = 'Failed to load employees';
      console.error(err);
    }
  }

  async function handleSubmit() {
    try {
      loading = true;
      if (editingShift._id) {
        await shiftsApi.update(editingShift._id, editingShift);
      } else {
        await shiftsApi.create(editingShift as Omit<Shift, '_id'>);
      }
      showForm = false;
      editingShift = {};
      await loadShifts();
    } catch (err) {
      error = 'Failed to save shift';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // function handleEmployeeSelect(employee: User) {
  //   if (selectedEmployees.has(employee._id)) {
  //     selectedEmployees.delete(employee._id);
  //   } else {
  //     selectedEmployees.add(employee._id);
  //   }
  //   selectedEmployees = selectedEmployees; // Trigger reactivity
  // }

  async function handleAssignmentSubmit(event:CustomEvent) {
    const { shiftId, shiftCode, employees, dates } = event.detail;
    try {
      loading = true;
      await shiftsApi.assignEmployees(shiftId, shiftCode, employees, dates);
      showAssignModal = false;
      assignmentStep = 1;
      selectedEmployees.clear();
      selectedEmployees = selectedEmployees;
      assignmentValidFrom = '';
      assignmentValidTill = '';
      await loadShifts();
    } catch (err) {
      error = 'Failed to assign shift to employees';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handleTableAction(e: CustomEvent) {
    const { action, id } = e.detail;
    const shift = shifts.find(s => s._id === id);
    if (!shift) return;
console.log(action,shift,"1,shift")
    if (action === 'view') {
      selectedShift = shift;
      showDetails = true;
    } else if (action === 'edit') {
      editingShift = { ...shift };
      showForm = true;
    } else if (action === 'assign') {
      selectedShift = shift;
      showAssignModal = true;
      loadEmployees();
    }
  }

  async function handlePageChange(event: CustomEvent) {
    loading = true;
    try {
      const { page: newPage } = event.detail;
      pagination.page = newPage;
      const url = new URL($page.url);
      url.searchParams.set('page', newPage.toString());
      await loadShifts();
    } finally {
      loading = false;
    }
  }

  onMount(loadShifts);

</script>

<div>
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-semibold">Shifts</h2>
    <div class="flex gap-4">
      <input 
        type="text" 
        class="input input-bordered" 
        placeholder="Search shifts..."
        bind:value={searchQuery}
        on:input={() => loadShifts()}
      />
      <button class="btn btn-primary" on:click={() => {
        editingShift = {};
        showForm = true;
      }}>Add New Shift</button>
    </div>
  </div>

  {#if error}
    <div class="alert alert-error">{error}</div>
  {/if}

  {#if loading}
    <div class="loading">Loading...</div>
  {:else}
    <Table {columns} data={shifts} 
    loading={loading}
    serverSide={true}
    meta={pagination} 
    variant='transparent'
    on:action={handleTableAction} 
    on:page={handlePageChange}
    />
  {/if}
</div>

<!-- Add, Edit Shift Modal -->
<Modal
  show={showForm}
  title={editingShift._id ? 'Edit Shift' : 'New Shift'}
  onClose={() => {
    showForm = false;
    editingShift = {};
  }}
>
  <ShiftForm shift={editingShift} on:submit={handleSubmit} />
</Modal> 

<!-- View Shift Details Modal -->
<Modal
  show={showDetails}
  title="Shift Details"
  onClose={() => {
    showDetails = false;
    selectedShift = null;
  }}
>
  <ShiftDetails shift={selectedShift} />
</Modal> 

<!-- Assign Modal with 2 steps  -->
<Modal
  show={showAssignModal}
  title={`Assign ${selectedShift?.name || 'Shift'}`}
  onClose={() => {
    showAssignModal = false;
    assignmentStep = 1;
    selectedEmployees.clear();
    selectedEmployees = selectedEmployees;
    assignmentValidFrom = '';
    assignmentValidTill = '';
  }}
>
  <ShiftAssignment
    shift={selectedShift}
    {employees}
    {selectedEmployees}
    {assignmentStep}
    {assignmentValidFrom}
    {assignmentValidTill}
    on:step={({ detail }) => assignmentStep = detail.step}
    on:submit={handleAssignmentSubmit}
  />
</Modal>