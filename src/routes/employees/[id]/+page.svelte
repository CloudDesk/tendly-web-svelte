<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { api } from '$lib/services/api';
  import Tabs from '$lib/components/common/Tabs.svelte';
  import EmployeeAttendance from '$lib/components/attendance/EmployeeAttendance.svelte';
  import EmployeeDetails from '$lib/components/employee/EmployeeDetails.svelte';
  import EmployeeLeaves from '$lib/components/employee/EmployeeLeaves.svelte';
  import type { User } from '$lib/types';

  const employeeId = $page.params.id;
  let user: User | null = null;
  let loading = true;
  let error: string | null = null;
  let activeTab = 'details';

  onMount(async () => {
    try {
      const response = await api.employees.getById(employeeId);
      user = response.data;
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="employee-details">
  {#if loading}
    <div class="loading">Loading...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if user}
    <header class="page-header">
      <h2>{user.name}</h2>
      <button class="btn-secondary">Edit Profile</button>
    </header>

    <Tabs
      tabs={[
        { id: 'details', label: 'Employee Details' },
        { id: 'leave', label: 'Leave Summary' },
        { id: 'attendance', label: 'Attendance' }
      ]}
      bind:activeTab
    />

    {#if activeTab === 'details'}
      <EmployeeDetails {employeeId} />
    {:else if activeTab === 'attendance'}
      <EmployeeAttendance {employeeId} />
    {:else if activeTab === 'leave'}
      <EmployeeLeaves {employeeId} />
    {/if}
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