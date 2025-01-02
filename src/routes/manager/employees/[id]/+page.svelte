<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { employeesApi } from '$lib/services/api';
  import Tabs from '$lib/components/common/Tabs.svelte';
  import EmployeeAttendance from '$lib/components/attendance/EmployeeAttendance.svelte';
  import EmployeeDetails from '$lib/components/employee/EmployeeDetails.svelte';
  import EmployeeLeaves from '$lib/components/employee/EmployeeLeaves.svelte';
  import type { User } from '$lib/types';

  const employeeId = $page.params.id;
  let user: User | null = null;
  let loading = true;
  let error: string | null = null;

  const tabs = [
    { id: 'details', label: 'Employee Details' },
    { id: 'leaves', label: 'Leaves' },
    { id: 'attendance', label: 'Attendance' }
  ];

  $: activeTab = $page.url.searchParams.get('tab') || tabs[0]?.id;

  onMount(async () => {
    try {
      const response = await employeesApi.getById(employeeId);
      user = response.data;
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="p-4">
  {#if loading}
    <div class="loading-spinner">Loading...</div>
  {:else if error}
    <div class="alert alert-error">{error}</div>
  {:else if user}
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-neutral">{user.name}</h1>
      <button class="btn btn-primary">Edit Profile</button>
    </div>

    <div class="card">
      <div class="card-body">
        <Tabs {tabs}>
          {#if activeTab === 'details'}
            <EmployeeDetails {employeeId} />
          {:else if activeTab === 'attendance'}
            <EmployeeAttendance {employeeId} />
          {:else if activeTab === 'leaves'}
            <EmployeeLeaves {employeeId} />
          {/if}
        </Tabs>
      </div>
    </div>
  {/if}
</div>

<style>
  .employee-details {
    padding: 1rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .page-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .error {
    text-align: center;
    padding: 2rem;
    color: #991b1b;
    background: #fee2e2;
    border-radius: 0.5rem;
  }
</style> 