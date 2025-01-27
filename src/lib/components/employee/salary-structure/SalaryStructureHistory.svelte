<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { payrollApi } from '$lib/services/api/payroll';
  
    export let employeeId: string;
  
    let salaryHistory = writable([]);
    let loading = writable(true);
    let error = writable(null);
  
    onMount(async () => {
      await fetchSalaryHistory();
    });
  
    const fetchSalaryHistory = async () => {
      try {
        loading.set(true);
        const response = await payrollApi.getSalaryStructureHistory(employeeId);
        salaryHistory.set(response.data);
      } catch (err) {
        error.set(err.message);
      } finally {
        loading.set(false);
      }
    };
  </script>
  
  <div class="p-6 bg-white shadow-md rounded-lg">
    {#if $loading}
      <div>Loading...</div>
    {:else if $error}
      <div class="text-red-500">Error: {$error}</div>
    {:else if $salaryHistory.length === 0}
      <div class="flex flex-col items-center justify-center text-center py-10 bg-gray-100 rounded-lg">
        <i class="fas fa-exclamation-circle text-4xl text-gray-400 mb-4"></i>
        <p class="text-lg font-semibold">No records found</p>
        <p class="text-gray-500 mb-4">We couldn't find any salary structure history for this employee.</p>
      </div>
    {:else}
      <table class="table-auto w-full">
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Effective Date</th>
            <th>Salary</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each $salaryHistory as record, index}
            <tr class={index % 2 === 0 ? 'bg-gray-100' : ''}>
              <td>{record.employeeName}</td>
              <td>{new Date(record.effectiveDate).toLocaleDateString()}</td>
              <td>{record.salary}</td>
              <td>{record.status}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
  
  <style>
    .table-auto {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 0.5rem 1rem;
    }
  </style>