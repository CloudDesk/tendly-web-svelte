<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { payrollApi } from '$lib/services/api/payroll';
    import type { SalaryStructure } from '$lib/types/payroll';
    import Modal from '$lib/components/common/Modal.svelte';
    import SalaryStructureForm from './SalaryStructureForm.svelte';
  import { toast } from '$lib/components/common/stores/toast.store';
  
    export let employeeId: string;
  
    let salaryHistory = writable<SalaryStructure[]>([]);
    let loading = writable(true);
    let error = writable(null);
    let showModal = writable(false);
    let selectedRecord = writable<SalaryStructure | null>(null);
  
    // Formatter for currency display
    const formatCurrency = (value: number): string => {
      return `₹${value.toLocaleString('en-IN')}`;
    };
  
    onMount(async () => {
      await fetchSalaryHistory();
    });
  
    const fetchSalaryHistory = async () => {
      try {
        loading.set(true);
        const response = await payrollApi.getSalaryStructureHistoryByUserId(employeeId);
        salaryHistory.set(response.data as SalaryStructure[]);
      } catch (err: any) {
        error.set(err.message);
      } finally {
        loading.set(false);
      }
    };
  
    const openModal = (record: SalaryStructure) => {
      selectedRecord.set(record);
      showModal.set(true);
    };
  
    const closeModal = () => {
      showModal.set(false);
      selectedRecord.set(null);
    };
  
    const handleFormSubmit = async (event:CustomEvent) => {
      // Handle form submission logic here
    //   closeModal();
    try{
        const formData = event.detail;

        console.log(formData,"formData")
       // Extract _id for update and remove it from the formData
       const { _id, userId, ...data } = formData;

        // Check if userId is missing and assign employeeId if so
        const updatedData = {
          ...data,
          userId: userId || employeeId
        };

      let result = await payrollApi.updateSalaryStructure(_id, updatedData);
      if (result.success) {
      await fetchSalaryHistory();
      toast.success(`Salary Structure updated successfully`);
     
    } else {
      toast.error(`Error in updating salary structure`);
    }
    }catch(err){
      console.error(err);
      toast.error(`Error in updating salary structure`);
    }finally{
        closeModal();
    }
    };
  </script>
  
  <div class="p-6 ">
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
      <table class="w-full table-auto">
        <thead>
          <tr class="bg-gray-50">
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Salary</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">HRA</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Conveyance</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Medical</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CTC</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each $salaryHistory as record, index}
            <tr class={index % 2 === 0 ? 'bg-gray-100' : ''}>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{record.isActive ? 'ACTIVE' : 'INACTIVE'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency(record.basic)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency(record.hra)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency(record.conveyanceAllowance)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency(record.medicalAllowance)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency(record.grossSalary)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency(record.netSalary)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency(record.ctc)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                <button class="btn btn-primary" on:click={() => openModal(record)}>View</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  
    <Modal title="View Salary Structure" show={$showModal} onClose={closeModal}>
      <SalaryStructureForm 
        employeeId={employeeId} 
        salaryStructure={$selectedRecord} 
        on:submit={handleFormSubmit} 
        on:cancel={closeModal}
      />
    </Modal>
  </div>
  
  <style>
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }
    .btn-primary:hover {
      background-color: #2563eb;
    }
    .table-auto {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 0.5rem 1rem;
    }
    .text-red-500 {
      color: #ef4444;
    }
    .bg-gray-100 {
      background-color: #f3f4f6;
    }
    .bg-gray-50 {
      background-color: #f9fafb;
    }
  </style>