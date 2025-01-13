<script lang="ts">
    import Table from '$lib/components/common/Table.svelte';
    import Modal from '$lib/components/common/Modal.svelte';
    import { onMount } from 'svelte';
    import type { Training, User } from '$lib/types_old';
    import { trainingsApi, employeesApi } from '$lib/services/api/';

    export let isTrainer = false;
  
    let trainings: Training[] = [];
    let employees: User[] = [];
    let loading = false;
    let error: string | null = null;
    let showForm = false;
    let showDetails = false;
    let showAssignModal = false;
    let assignmentStep = 1; // 1: Selection, 2: Preview
    let editingTraining: Partial<Training> = {};
    let selectedTraining: Training | null = null;
    let selectedEmployees: Set<string> = new Set();
    let page = 1;
    let limit = 10;
    let searchQuery = '';
    let assignmentValidFrom = '';
    let assignmentValidTill = '';
  
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'code', label: 'Code' },
      { 
        key: 'timing', 
        label: 'Timing',
        render: (row: Training) => `${row.startTime} - ${row.endTime}`
      },
      { 
        key: 'window', 
        label: 'Window',
        render: (row: Training) => `${row.trainingWindowStart} - ${row.trainingWindowEnd}`
      },
      { 
        key: 'validity', 
        label: 'Validity',
        render: (row: Training) => `${row.validFrom} - ${row.validTill || 'No end date'}`
      },
      { 
        key: 'graceTime', 
        label: 'Grace Time',
        render: (row: Training) => `${row.graceTimeInMinutes || 0} minutes`
      },
      { 
        key: 'actions', 
        label: 'Actions',
        render: (row: Training) => row?._id ? `
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
          ? `${row.currentShiftAssignment.name} (${row.currentShiftAssignment.startTime}-${row.currentShiftAssignment.endTime})`
          : 'No shift assigned'
      },
      { 
        key: 'upcomingShiftAssignment', 
        label: 'Upcoming Shift',
        render: (row: User) => row.upcomingShiftAssignment
          ? `${row.upcomingShiftAssignment.name} (${row.upcomingShiftAssignment.startTime}-${row.upcomingShiftAssignment.endTime})`
          : 'No upcoming shift'
      }
    ];
  
    async function loadTrainings() {
      try {
        loading = true;
        const response = await trainingsApi.list({
          page, limit, search: searchQuery
        });
        trainings = response.data;
      } catch (err) {
        error = 'Failed to load trainings';
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
        employees = response.data;
      } catch (err) {
        error = 'Failed to load employees';
        console.error(err);
      }
    }
  
    async function handleSubmit() {
      try {
        loading = true;
        if (editingTraining._id) {
          const { applicableForRoles, assessmentCriteria, materials, objectives, prerequisites,trainer, ...updateData } = editingTraining;
          await trainingsApi.update(editingTraining._id, updateData);
        } else {
          await trainingsApi.create(editingTraining as Omit<Training, '_id'>);
        }
        showForm = false;
        editingTraining = {};
        await loadTrainings();
      } catch (err) {
        error = 'Failed to save training';
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
        if (!selectedTraining?._id || !assignmentValidFrom) return;
        
        await trainingsApi.assignEmployees(selectedTraining._id, selectedTraining.code, Array.from(selectedEmployees), {
          validFrom: assignmentValidFrom,
          validTill: assignmentValidTill || undefined
        });
        showAssignModal = false;
        assignmentStep = 1;
        selectedEmployees.clear();
        selectedEmployees = selectedEmployees;
        assignmentValidFrom = '';
        assignmentValidTill = '';
        await loadTrainings();
      } catch (err) {
        error = 'Failed to assign training to employees';
        console.error(err);
      } finally {
        loading = false;
      }
    }
  
    async function handleTableAction(e: CustomEvent) {
      const { action, id } = e.detail;
      const training = trainings.find(t => t._id === id);
      if (!training) return;
  
      if (action === 'view') {
        selectedTraining = training;
        showDetails = true;
      } else if (action === 'edit') {
        try {
          loading = true;
          const response = await trainingsApi.getById(id);
          const data = response.data;
          editingTraining = {
            ...data,
            validFrom: data.validFrom ? new Date(data.validFrom).toLocaleDateString('en-CA') : '',
            validTill: data.validTill ? new Date(data.validTill).toLocaleDateString('en-CA') : ''
          };
          showForm = true;
        } catch (err) {
          error = 'Failed to load training details';
          console.error(err);
        } finally {
          loading = false;
        }
      } else if (action === 'assign') {
        selectedTraining = training;
        showAssignModal = true;
        loadEmployees();
      }
    }
  
    function handleAdd() {
      editingTraining = {
        name: '',
        code: '',
        description: '',
        startTime: '',
        endTime: '',
        trainingWindowStart: '',
        trainingWindowEnd: '',
        validFrom: '',
        validTill: '',
        graceTimeInMinutes: 0,
        maxParticipants: 1,
        location: '',
        isActive: true
      };
      showForm = true;
    }
  
    onMount(loadTrainings);
  </script>
  
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Trainings</h2>
      {#if !isTrainer}<div class="flex gap-4">
        <input 
          type="text" 
          class="input input-bordered" 
          placeholder="Search trainings..."
          bind:value={searchQuery}
          on:input={() => loadTrainings()}
        />
        
          <button class="btn btn-primary" on:click={handleAdd}>Add New Training</button>
       
      </div> {/if}
    </div>
  
    {#if error}
      <div class="alert alert-error">{error}</div>
    {/if}
  
    {#if loading}
      <div class="loading">Loading...</div>
    {:else}
      <Table {columns} data={trainings} on:action={handleTableAction} />
      
      <div class="flex justify-center mt-4 gap-2">
        <button 
          class="btn btn-sm" 
          disabled={page === 1}
          on:click={() => {
            page--;
            loadTrainings();
          }}
        >Previous</button>
        <span class="py-1">Page {page}</span>
        <button 
          class="btn btn-sm"
          on:click={() => {
            page++;
            loadTrainings();
          }}
        >Next</button>
      </div>
    {/if}
  </div>
  
  <Modal
    show={showForm}
    title={editingTraining._id ? 'Edit Training' : 'New Training'}
    onClose={() => {
      showForm = false;
      editingTraining = {};
    }}
  >
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="form-control">
        <label class="label">Name</label>
        <input 
          type="text" 
          class="input input-bordered" 
          bind:value={editingTraining.name}
          required
        />
      </div>
  
      <div class="form-control">
        <label class="label">Code</label>
        <input 
          type="text" 
          class="input input-bordered" 
          bind:value={editingTraining.code}
          required
        />
      </div>
  
      <div class="grid grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label">Start Time</label>
          <input 
            type="time" 
            class="input input-bordered" 
            bind:value={editingTraining.startTime}
            required
          />
        </div>
  
        <div class="form-control">
          <label class="label">End Time</label>
          <input 
            type="time" 
            class="input input-bordered" 
            bind:value={editingTraining.endTime}
            required
          />
        </div>
      </div>
  
      <div class="grid grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label">Training Window Start</label>
          <input 
            type="time" 
            class="input input-bordered" 
            bind:value={editingTraining.trainingWindowStart}
            required
          />
        </div>
  
        <div class="form-control">
          <label class="label">Training Window End</label>
          <input 
            type="time" 
            class="input input-bordered" 
            bind:value={editingTraining.trainingWindowEnd}
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
            bind:value={editingTraining.validFrom}
            required
          />
        </div>
  
        <div class="form-control">
          <label class="label">Valid Till</label>
          <input 
            type="date" 
            class="input input-bordered" 
            bind:value={editingTraining.validTill}
          />
        </div>
      </div>
  
      <div class="form-control">
        <label class="label">Grace Time (minutes)</label>
        <input 
          type="number" 
          class="input input-bordered" 
          bind:value={editingTraining.graceTimeInMinutes}
          min="0"
          max="60"
        />
      </div>
  
      <div class="grid grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label">Max Participants</label>
          <input 
            type="number" 
            class="input input-bordered" 
            bind:value={editingTraining.maxParticipants}
            min="1"
            required
          />
        </div>
  
        <div class="form-control">
          <label class="label">Location</label>
          <input 
            type="text" 
            class="input input-bordered" 
            bind:value={editingTraining.location}
            required
          />
        </div>
      </div>
  
      <div class="flex justify-end gap-2">
        <button 
          type="button" 
          class="btn btn-ghost"
          on:click={() => {
            showForm = false;
            editingTraining = {};
          }}
        >Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  </Modal> 
  
  <Modal
    show={showDetails}
    title="Training Details"
    onClose={() => {
      showDetails = false;
      selectedTraining = null;
    }}
  >
    {#if selectedTraining}
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="font-semibold">Name:</label>
            <p>{selectedTraining.name}</p>
          </div>
          <div>
            <label class="font-semibold">Code:</label>
            <p>{selectedTraining.code}</p>
          </div>
        </div>
  
        <div>
          <label class="font-semibold">Timing:</label>
          <p>{selectedTraining.startTime} - {selectedTraining.endTime}</p>
        </div>
  
        <div>
          <label class="font-semibold">Window:</label>
          <p>{selectedTraining.trainingWindowStart} - {selectedTraining.trainingWindowEnd}</p>
        </div>
  
        <div>
          <label class="font-semibold">Validity:</label>
          <p>{selectedTraining.validFrom} - {selectedTraining.validTill || 'No end date'}</p>
        </div>
  
        <div>
          <label class="font-semibold">Grace Time:</label>
          <p>{selectedTraining.graceTimeInMinutes || 0} minutes</p>
        </div>
  
        <div>
          <label class="font-semibold">Max Participants:</label>
          <p>{selectedTraining.maxParticipants}</p>
        </div>
  
        <div>
          <label class="font-semibold">Location:</label>
          <p>{selectedTraining.location}</p>
        </div>
      </div>
    {/if}
  </Modal> 
  
  <Modal
    show={showAssignModal}
    title={`Assign ${selectedTraining?.name || 'Training'}`}
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
              <span class="ml-1">{selectedTraining?.name}</span>
            </div>
            <div>
              <span class="text-base-content/70">Code:</span>
              <span class="ml-1">{selectedTraining?.code}</span>
            </div>
            <div>
              <span class="text-base-content/70">Timing:</span>
              <span class="ml-1">{selectedTraining?.startTime} - {selectedTraining?.endTime}</span>
            </div>
            <div>
              <span class="text-base-content/70">Window:</span>
              <span class="ml-1">{selectedTraining?.trainingWindowStart} - {selectedTraining?.trainingWindowEnd}</span>
            </div>
            <div>
              <span class="text-base-content/70">Validity:</span>
              <span class="ml-1">{selectedTraining?.validFrom} - {selectedTraining?.validTill || 'No end date'}</span>
            </div>
            <div>
              <span class="text-base-content/70">Grace Time:</span>
              <span class="ml-1">{selectedTraining?.graceTimeInMinutes || 0} minutes</span>
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
              min={assignmentValidFrom}
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