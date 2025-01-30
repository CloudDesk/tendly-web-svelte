<script lang="ts">
  import Table from '$lib/components/common/Table.svelte';
  import Modal from '$lib/components/common/Modal.svelte';
  import { onMount } from 'svelte';
  import type { Shift, User } from '$lib/types';
  import { shiftsApi, employeesApi } from '$lib/services/api/';
  import { page } from '$app/stores';
  import { fromUTCDate, toUTCDate } from '$lib/utils/date';
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

  const employeeColumns = [
    { key: 'name' as keyof User, label: 'Name' },
    { key: 'employeeId' as keyof User, label: 'Employee ID' },
    { 
      key: 'currentShiftAssignment', 
      label: 'Current Shift',
      render: (row: User) => row.currentShiftAssignment 
        ? `${row.currentShiftAssignmentData?.shiftCode} (${fromUTCDate(row.currentShiftAssignmentData?.startDate?.toString())}-${fromUTCDate(row.currentShiftAssignmentData?.endDate?.toString())})`
        : 'No shift assigned'
    },
    { 
      key: 'upcomingShiftAssignment', 
      label: 'Upcoming Shift',
      render: (row: User) => row.upcomingShiftAssignment
        ? `${row.upcomingShiftAssignmentData?.shiftCode} (${fromUTCDate(row.upcomingShiftAssignmentData?.startDate?.toString())}-${fromUTCDate(row.upcomingShiftAssignmentData?.endDate.toString())})`
        : 'No upcoming shift'
    }
  ];

  async function loadShifts() {
    try {
      loading = true;
      const response = await shiftsApi.list({
        page:pagination.page, limit:pagination.limit, search: searchQuery
      });
      console.log(response,"1 leadShifts")
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
      console.log("employeeList",response.data)
     
      if(response.success){
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

  function handleEmployeeSelect(employee: User) {
    if (selectedEmployees.has(employee._id)) {
      selectedEmployees.delete(employee._id);
    } else {
      selectedEmployees.add(employee._id);
    }
    selectedEmployees = selectedEmployees; // Trigger reactivity
  }

  async function handleAssignmentSubmit() {
    try {
      loading = true;
      if (!selectedShift?._id || !assignmentValidFrom) return;
      
      await shiftsApi.assignEmployees(selectedShift._id, selectedShift.code, Array.from(selectedEmployees), {
        validFrom: assignmentValidFrom,
        validTill: assignmentValidTill || undefined
      });
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
  async function handlePageChange(event:CustomEvent) {
    console.log(event,"handlePageChange")
        loading =true
    try{
      const { page: newPage } = event.detail;
      pagination.page = newPage;
      const url = new URL($page.url);
      url.searchParams.set('page', newPage.toString());
      await loadShifts();
    // await  goto(url, { replaceState: true , invalidateAll: true});
    }finally{
      loading=false
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
    
    <!-- <div class="flex justify-center mt-4 gap-2">
      <button 
        class="btn btn-sm" 
        disabled={page === 1}
        on:click={() => {
          page--;
          loadShifts();
        }}
      >Previous</button>
      <span class="py-1">Page {page}</span>
      <button 
        class="btn btn-sm"
        on:click={() => {
          page++;
          loadShifts();
        }}
      >Next</button>
    </div> -->
  {/if}
</div>

<!-- Add,Edit Shift -->
<Modal
  show={showForm}
  title={editingShift._id ? 'Edit Shift' : 'New Shift'}
  onClose={() => {
    showForm = false;
    editingShift = {};
  }}
>
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div class="form-control">
      <label class="label">Name</label>
      <input 
        type="text" 
        class="input input-bordered" 
        bind:value={editingShift.name}
        required
      />
    </div>

    <div class="form-control">
      <label class="label">Code</label>
      <input 
        type="text" 
        class="input input-bordered" 
        bind:value={editingShift.code}
        required
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">Start Time</label>
        <input 
          type="time" 
          class="input input-bordered" 
          bind:value={editingShift.startTime}
          required
        />
      </div>

      <div class="form-control">
        <label class="label">End Time</label>
        <input 
          type="time" 
          class="input input-bordered" 
          bind:value={editingShift.endTime}
          required
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">Shift Window Start</label>
        <input 
          type="time" 
          class="input input-bordered" 
          bind:value={editingShift.shiftWindowStart}
          required
        />
      </div>

      <div class="form-control">
        <label class="label">Shift Window End</label>
        <input 
          type="time" 
          class="input input-bordered" 
          bind:value={editingShift.shiftWindowEnd}
          required
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">Valid From</label>
        <input 
          type="date" 
          class="input input-bordered" 
          bind:value={editingShift.validFrom}
          required
        />
      </div>

      <div class="form-control">
        <label class="label">Valid Till</label>
        <input 
          type="date" 
          class="input input-bordered" 
          bind:value={editingShift.validTill}
        />
      </div>
    </div>

    <div class="form-control">
      <label class="label">Grace Time (minutes)</label>
      <input 
        type="number" 
        class="input input-bordered" 
        bind:value={editingShift.graceTimeInMinutes}
        min="0"
        max="60"
      />
    </div>

    <div class="flex justify-end gap-2">
      <button 
        type="button" 
        class="btn btn-ghost"
        on:click={() => {
          showForm = false;
          editingShift = {};
        }}
      >Cancel</button>
      <button type="submit" class="btn btn-primary">Save</button>
    </div>
  </form>
</Modal> 

<!-- View Action Card -->
<Modal
  show={showDetails}
  title="Shift Details"
  onClose={() => {
    showDetails = false;
    selectedShift = null;
  }}
>
  {#if selectedShift}
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="font-semibold">Name:</label>
          <p>{selectedShift.name}</p>
        </div>
        <div>
          <label class="font-semibold">Code:</label>
          <p>{selectedShift.code}</p>
        </div>
      </div>

      <div>
        <label class="font-semibold">Timing:</label>
        <p>{selectedShift.startTime} - {selectedShift.endTime}</p>
      </div>

      <div>
        <label class="font-semibold">Window:</label>
        <p>{selectedShift.shiftWindowStart} - {selectedShift.shiftWindowEnd}</p>
      </div>

      <div>
        <label class="font-semibold">Validity:</label>
        <p>{selectedShift.validFrom} - {selectedShift.validTill || 'No end date'}</p>
      </div>

      <div>
        <label class="font-semibold">Grace Time:</label>
        <p>{selectedShift.graceTimeInMinutes || 0} minutes</p>
      </div>
    </div>
  {/if}
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
  }}
>
  {#if assignmentStep === 1}
    <div class="space-y-4">
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th class="w-10">
                <input 
                  type="checkbox"
                  class="checkbox"
                  checked={selectedEmployees.size === employees.length}
                  on:change={(e) => {
                    if (e.currentTarget.checked) {
                      employees.forEach(emp => selectedEmployees.add(emp._id));
                    } else {
                      selectedEmployees.clear();
                    }
                    selectedEmployees = selectedEmployees;
                  }}
                />
              </th>
              {#each employeeColumns as column}
                <th>{column.label}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each employees as employee}
              <tr class="hover">
                <td>
                  <input 
                    type="checkbox"
                    class="checkbox"
                    checked={selectedEmployees.has(employee._id)}
                    on:change={() => handleEmployeeSelect(employee)}
                  />
                </td>
                {#each employeeColumns as column}
                  <td>
                    {#if column.render}
                      {@html column.render(employee)}
                    {:else}
                      {employee[column.key]}
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="flex justify-between items-center">
        <p class="text-sm text-base-content/70">
          {selectedEmployees.size} employee{selectedEmployees.size === 1 ? '' : 's'} selected
        </p>
        <button 
          class="btn btn-primary"
          disabled={selectedEmployees.size === 0}
          on:click={() => assignmentStep = 2}
        >
          Next
        </button>
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      <div class="bg-base-200 rounded-lg p-4">
        <h3 class="font-medium mb-2">Selected Shift</h3>
        <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span class="text-base-content/70">Name:</span>
            <span class="ml-1">{selectedShift?.name}</span>
          </div>
          <div>
            <span class="text-base-content/70">Code:</span>
            <span class="ml-1">{selectedShift?.code}</span>
          </div>
          <div>
            <span class="text-base-content/70">Timing:</span>
            <span class="ml-1">{selectedShift?.startTime} - {selectedShift?.endTime}</span>
          </div>
          <div>
            <span class="text-base-content/70">Window:</span>
            <span class="ml-1">{selectedShift?.shiftWindowStart} - {selectedShift?.shiftWindowEnd}</span>
          </div>
          <div>
            <span class="text-base-content/70">Validity:</span>
            <span class="ml-1">{selectedShift?.validFrom} - {selectedShift?.validTill || 'No end date'}</span>
          </div>
          <div>
            <span class="text-base-content/70">Grace Time:</span>
            <span class="ml-1">{selectedShift?.graceTimeInMinutes || 0} minutes</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label">Assignment Valid From</label>
          <input 
            type="date" 
            class="input input-bordered" 
            bind:value={assignmentValidFrom}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <div class="form-control">
          <label class="label">Assignment Valid Till</label>
          <input 
            type="date" 
            class="input input-bordered" 
            bind:value={assignmentValidTill}
            min={assignmentValidFrom ||new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div>
        <h3 class="font-medium mb-2">Selected Employees ({selectedEmployees.size})</h3>
        <div class="max-h-60 overflow-y-auto border border-base-200 rounded-lg divide-y">
          {#each employees.filter(emp => selectedEmployees.has(emp._id)) as employee}
            <div class="p-3">
              <p class="font-medium">{employee.name}</p>
              <p class="text-sm text-base-content/70">
                {employee.employeeId} • 
                {employee.currentShiftAssignment 
                  ? `Current: ${employee.currentShiftAssignment.name}`
                  : 'No current shift'}
              </p>
            </div>
          {/each}
        </div>
      </div>

      <div class="flex justify-between items-center">
        <button 
          class="btn btn-ghost"
          on:click={() => assignmentStep = 1}
        >
          Back
        </button>
        <button 
          class="btn btn-primary"
          disabled={loading}
          on:click={handleAssignmentSubmit}
        >
          {loading ? 'Assigning...' : 'Confirm Assignment'}
        </button>
      </div>
    </div>
  {/if}
</Modal> 