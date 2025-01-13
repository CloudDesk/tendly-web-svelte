<script lang="ts">
  import { onMount } from 'svelte';
  import { attendanceApi, employeesApi } from '$lib/services/api';
  import type { User } from '$lib/types_old';
  import Tabs from '$lib/components/common/Tabs.svelte';
  import EmployeeAttendance from '$lib/components/attendance/EmployeeAttendance.svelte';
  import EmployeeTrainingAttendance from '$lib/components/attendance/EmployeeTrainingAttendance.svelte';
  import { page } from '$app/stores';
  import { navigationContext } from '$lib/stores/navigation';

  let loading = false;
  let error: string | null = null;
  let employees: User[] = [];
  let selectedEmployeeIds: Set<string> = new Set();

  const tabs = [
    { id: 'shift', label: 'Shift Attendance' },
    { id: 'training', label: 'Training Attendance' }
  ];

  $: activeTab = $page.url.searchParams.get('tab') || tabs[0]?.id;

  async function loadEmployees() {
    try {
      loading = true;
      const response = await employeesApi.list({
        page: 1,
        limit: 100 // Load more employees for better filtering
      });
      employees = response.data;
    } catch (err) {
      error = 'Failed to load employees';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      selectedEmployeeIds = new Set(employees.map(emp => emp._id));
    } else {
      selectedEmployeeIds.clear();
    }
    selectedEmployeeIds = selectedEmployeeIds;
  }

  function handleEmployeeSelect(employeeId: string) {
    if (selectedEmployeeIds.has(employeeId)) {
      selectedEmployeeIds.delete(employeeId);
    } else {
      selectedEmployeeIds.add(employeeId);
    }
    selectedEmployeeIds = selectedEmployeeIds;
  }

  onMount(() => {
    navigationContext.set('admin');
    loadEmployees();
  });
</script>

<div class="p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Attendance Management</h1>
  </div>

  <div class="card bg-base-100">
    <div class="card-body">
      <div class="mb-4">
        <!-- <div class="flex items-center gap-4 mb-2">
          <label class="flex items-center gap-2">
            <input 
              type="checkbox" 
              class="checkbox"
              checked={selectedEmployeeIds.size === employees.length}
              on:change={(e) => handleSelectAll(e.currentTarget.checked)}
            />
            <span>Select All</span>
          </label>
          <span class="text-sm text-base-content/70">
            {selectedEmployeeIds.size} employee{selectedEmployeeIds.size === 1 ? '' : 's'} selected
          </span>
        </div> -->

        <!-- <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {#each employees as employee}
            <label class="flex items-center gap-2">
              <input 
                type="checkbox" 
                class="checkbox"
                checked={selectedEmployeeIds.has(employee._id)}
                on:change={() => handleEmployeeSelect(employee._id)}
              />
              <span>{employee.name} ({employee.employeeId})</span>
            </label>
          {/each}
        </div> -->
      </div>

      {#if error}
        <div class="alert alert-error">{error}</div>
      {:else if loading}
        <div class="loading">Loading...</div>
      {:else}
        <Tabs {tabs}>
          {#if activeTab === 'shift'}
            <EmployeeAttendance mode="multi" employeeIds={Array.from(selectedEmployeeIds)} />
          {:else if activeTab === 'training'}
            <EmployeeTrainingAttendance mode="multi" employeeIds={Array.from(selectedEmployeeIds)} />
          {:else}
            <div class="alert alert-info">Please select at least one employee to view attendance records.</div>
          {/if}
        </Tabs>
      {/if}
    </div>
  </div>
</div>

<style>
  .loading {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }
</style> 