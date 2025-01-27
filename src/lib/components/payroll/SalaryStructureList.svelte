<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import Modal from '$lib/components/common/Modal.svelte';
  import SalaryStructureForm from './SalaryStructureForm.svelte';
  import { payrollApi } from '$lib/services/api/payroll';
  import { toast } from '../common/stores/toast.store';

  export let employeeId: string;

  let salaryStructure = writable(null);
  let loading = writable(true);
  let error = writable(null);
  let showModal = writable(false);
  let isEditMode = writable(false);

  onMount(async () => {
    await fetchSalaryStructure();
  });

  const fetchSalaryStructure = async () => {
    try {
      loading.set(true);
      const response = await payrollApi.getCurrentSalaryStructure();
      salaryStructure.set(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        salaryStructure.set(null);
      } else {
        error.set(err.message);
      }
    } finally {
      loading.set(false);
    }
  };

  const openModal = (editMode = false) => {
    isEditMode.set(editMode);
    showModal.set(true);
  };

  const closeModal = () => {
    showModal.set(false);
  };

  const handleFormSubmit = async (event) => {
    console.log(event.detail);

    try {
      let result = await payrollApi.createSalaryStructure(event.detail);
      console.log(result, "result");
      if (result.success) {
        await fetchSalaryStructure();
        toast.success('Salary Structure created successfully');
      } else {
        console.error(result, "error in salary structure create");
        toast.error('Error in creating salary structure');
      }
    } catch (err) {
      console.error(err, "error in salary structure create");
      toast.error('Error in creating salary structure');
    } finally {
      closeModal();
    }
  };

  const handleDelete = async () => {
    try {
      await payrollApi.deleteSalaryStructure(salaryStructure.id);
      salaryStructure.set(null);
    } catch (err) {
      error.set(err.message);
    }
  };
</script>

<div class="p-6 bg-white shadow-md rounded-lg">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-semibold">Salary Structure</h2>
  </div>
  {#if $loading}
    <div>Loading...</div>
  {:else if !$salaryStructure}
    <div class="no-records-card">
      <i class="fas fa-exclamation-circle text-4xl text-gray-400 mb-4"></i>
      <p class="text-lg font-semibold">No records found</p>
      <p class="text-gray-500 mb-4">We couldn't find any results matching your search.</p>
      <button class="btn btn-primary" on:click={() => openModal(false)}>
        <i class="fas fa-plus mr-2"></i> Create New Record
      </button>
    </div>
  {:else}
    <div>
      <table class="table-auto w-full">
        <thead>
          <tr>
            <th>Basic Salary</th>
            <th>HRA</th>
            <th>Conveyance Allowance</th>
            <th>Medical Allowance</th>
            <th>Gross Salary</th>
            <th>Net Salary</th>
            <th>CTC</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{$salaryStructure.basicSalary}</td>
            <td>{$salaryStructure.hra}</td>
            <td>{$salaryStructure.conveyanceAllowance}</td>
            <td>{$salaryStructure.medicalAllowance}</td>
            <td>{$salaryStructure.grossSalary}</td>
            <td>{$salaryStructure.netSalary}</td>
            <td>{$salaryStructure.ctc}</td>
            <td>
              <button class="btn btn-secondary" on:click={() => openModal(true)}>Edit</button>
              <button class="btn btn-danger" on:click={handleDelete}>Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  {/if}

  <Modal title="Create Salary Structure" show={$showModal} onClose={closeModal}>
    <SalaryStructureForm 
      employeeId={employeeId} 
      salaryStructure={$isEditMode ? $salaryStructure : null} 
      on:submit={handleFormSubmit} 
    />
  </Modal>
</div>

<style>
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors;
  }
  .btn-primary {
    @apply bg-blue-500 text-white hover:bg-blue-600;
  }
  .btn-secondary {
    @apply bg-gray-500 text-white hover:bg-gray-600;
  }
  .btn-danger {
    @apply bg-red-500 text-white hover:bg-red-600;
  }
  .table-auto {
    @apply w-full border-collapse;
  }
  th, td {
    @apply border px-4 py-2;
  }
  .no-records-card {
    @apply flex flex-col items-center justify-center text-center py-10 bg-gray-100 rounded-lg;
  }
</style>