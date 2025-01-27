<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import Modal from '$lib/components/common/Modal.svelte';
  import SalaryStructureForm from './SalaryStructureForm.svelte';
  import { payrollApi } from '$lib/services/api/payroll';
  import { toast } from '../../common/stores/toast.store';
  import { DollarSign, Home, Car, Heart, Edit } from 'lucide-svelte';
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
      const response = await payrollApi.getActiveSalaryStructure();
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

  const handleFormSubmit = async (event: CustomEvent) => {
  try {
    const formData = event.detail;

    // Check if it's an update or a create operation
    const isUpdate = Boolean(formData._id);
    let result;

    if (isUpdate) {
      // Extract _id for update and remove it from the formData
      const { _id, ...data } = formData;
      result = await payrollApi.updateSalaryStructure(_id, data);
    } else {
      result = await payrollApi.createSalaryStructure(formData);
    }

    if (result.success) {
      const action = isUpdate ? 'updated' : 'created';
      toast.success(`Salary Structure ${action} successfully`);
      await fetchSalaryStructure(); // Refresh data on success
    } else {
      toast.error(`Error in ${isUpdate ? 'updating' : 'creating'} salary structure`);
    }
  } catch (err) {
    toast.error('Error in processing salary structure');
  } finally {
    closeModal(); 
  }
};



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
  };
</script>

<div class="p-6">
  <div class="flex justify-between items-center mb-6">
    <!-- <h2 class="text-2xl text-gray-800 font-medium">Salary Structure</h2> -->
    {#if !$salaryStructure}
      <button 
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        on:click={() => openModal(false)}
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Create New Record
      </button>
    {/if}
  </div>

  {#if $loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  {:else if !$salaryStructure}
    <div class="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg">
      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-lg text-gray-500">No salary structure found</p>
      <p class="text-sm text-gray-400 mt-1">Create a new record to get started</p>
    </div>
  {:else}
  <div class="space-y-6">
    <!-- Summary Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- CTC Card -->
      <div class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg">
        <div class="flex flex-col">
          <span class="text-blue-900/70 text-sm font-medium">Annual CTC</span>
          <span class="text-blue-900 text-2xl font-semibold mt-1">{formatCurrency($salaryStructure.ctc)}</span>
        </div>
      </div>
      
      <!-- Gross Salary Card -->
      <div class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg">
        <div class="flex flex-col">
          <span class="text-blue-900/70 text-sm font-medium">Gross Salary</span>
          <span class="text-blue-900 text-2xl font-semibold mt-1">{formatCurrency($salaryStructure.grossSalary)}</span>
        </div>
      </div>
      
      <!-- Net Salary Card -->
      <div class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg">
        <div class="flex flex-col">
          <span class="text-blue-900/70 text-sm font-medium">Net Salary</span>
          <span class="text-blue-900 text-2xl font-semibold mt-1">{formatCurrency($salaryStructure.netSalary)}</span>
        </div>
      </div>
    </div>

    <!-- Detailed Salary Components -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Basic Salary -->
      <div class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-blue-900/70 text-sm font-medium">Basic Salary</span>
            <span class="text-blue-900 text-xl mt-1">{formatCurrency($salaryStructure.basic)}</span>
          </div>
          <div class="bg-white/50 p-3 rounded-full">
            <DollarSign class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <!-- HRA -->
      <div class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-blue-900/70 text-sm font-medium">HRA</span>
            <span class="text-blue-900 text-xl mt-1">{formatCurrency($salaryStructure.hra)}</span>
          </div>
          <div class="bg-white/50 p-3 rounded-full">
            <Home class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <!-- Conveyance -->
      <div class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-blue-900/70 text-sm font-medium">Conveyance</span>
            <span class="text-blue-900 text-xl mt-1">{formatCurrency($salaryStructure.conveyanceAllowance)}</span>
          </div>
          <div class="bg-white/50 p-3 rounded-full">
            <Car class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <!-- Medical -->
      <div class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-blue-900/70 text-sm font-medium">Medical</span>
            <span class="text-blue-900 text-xl mt-1">{formatCurrency($salaryStructure.medicalAllowance)}</span>
          </div>
          <div class="bg-white/50 p-3 rounded-full">
            <Heart class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-end mt-6">
      <button 
        class="inline-flex items-center px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 
         text-sm font-medium rounded-lg  transition-colors duration-200 
         ease-in-out shadow-lg"
        on:click={() => openModal(true)}
      >
        <Edit class="w-4 h-4 mr-2 text-current" />
        Edit Salary Structure
      </button>
    </div>
    </div>
    
    {/if}
    <!-- <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50">
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
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency($salaryStructure.basic)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency($salaryStructure.hra)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency($salaryStructure.conveyanceAllowance)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency($salaryStructure.medicalAllowance)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency($salaryStructure.grossSalary)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency($salaryStructure.netSalary)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{formatCurrency($salaryStructure.ctc)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
              <div class="flex justify-center items-center space-x-2">
                <button 
                  class="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  on:click={() => openModal(true)}
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div> -->


  <Modal title="Create Salary Structure" show={$showModal} onClose={closeModal}>
    <SalaryStructureForm 
      employeeId={employeeId} 
      salaryStructure={$isEditMode ? $salaryStructure : null} 
      on:submit={handleFormSubmit} 
    />
  </Modal>
</div>