<script>
    import { onMount } from 'svelte';
    import { salaryStructureApi } from '$lib/services/api/salaryStructure';
    import Modal from '../common/Modal.svelte';
    import { Plus } from 'lucide-svelte';
    import SalaryStructureForm from './SalaryStructureForm.svelte';
    
    let configurations = [];
    let isLoading = false;
    let isModalOpen = false;
    let modalMode = 'add'; // 'add', 'view', 'edit'
    let selectedConfig = null;
    
    onMount(async () => {
      await fetchData();
    });
    
    async function fetchData() {
      isLoading = true;
      try {
        let result = await salaryStructureApi.list();
        console.log(result,"result");
        configurations = result.data;
      } catch (error) {
        console.error('Error fetching salary configurations:', error);
        // You could add a notification system here
      } finally {
        isLoading = false;
      }
    }
    
    function handleAddClick() {
      modalMode = 'add';
      selectedConfig = null;
      isModalOpen = true;
    }
    
    function handleViewClick(config) {
      modalMode = 'view';
      selectedConfig = { ...config };
      isModalOpen = true;
    }
    
    function handleEditClick(config) {
      modalMode = 'edit';
      selectedConfig = { ...config };
      isModalOpen = true;
    }
    
    function handleModalClose() {
      isModalOpen = false;
    }
    
    async function handleFormSubmit(event) {
      console.log(event ,"event handleFormSubmit");
      const formData = event.detail;
      // isLoading = true;
      
      // try {
      //   if (modalMode === 'add') {
      //     await saveSalaryConfig(formData);
      //   } else if (modalMode === 'edit' && selectedConfig) {
      //     await saveSalaryConfig({ ...formData, _id: selectedConfig._id });
      //   }
      //   await fetchData();
      //   isModalOpen = false;
      // } catch (error) {
      //   console.error('Error saving salary configuration:', error);
      // } finally {
      //   isLoading = false;
      // }
    }

    async function saveSalaryConfig(data) {
      if (modalMode === 'add') {
        await salaryStructureApi.create(data);
      } else if (modalMode === 'edit') {
        await salaryStructureApi.update(data._id,data);
      }
    }

  </script>
  
  <div class="container mx-auto py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Salary Structure Configuration</h1>
      <button 
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1"
        on:click={handleAddClick}
      >
        <Plus class="w-4 h-4" />
        Add Configuration
      </button>
    </div>
    
    {#if isLoading}
      <div class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    {:else if configurations.length === 0}
      <div class="text-center py-8 text-gray-500">
        No salary configurations found
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th class="py-2 px-4 border-b">Basic (% of Gross)</th>
              <th class="py-2 px-4 border-b">HRA (% of Gross)</th>
              <th class="py-2 px-4 border-b">DA (% of Basic)</th>
              <th class="py-2 px-4 border-b">Other Allowance (% of Gross)</th>
              <th class="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each configurations as config}
              <tr class="hover:bg-gray-50">
                <td class="py-2 px-4 border-b text-center">{config.basicPercentage}%</td>
                <td class="py-2 px-4 border-b text-center">{config.hraPercentage}%</td>
                <td class="py-2 px-4 border-b text-center">{config.daPercentage}%</td>
                <td class="py-2 px-4 border-b text-center">{config.otherAllowancePercentage}%</td>
                <td class="py-2 px-4 border-b">
                  <div class="flex space-x-2 justify-center">
                    <button 
                      class="text-blue-500 hover:text-blue-700 px-2 py-1"
                      on:click={() => handleViewClick(config)}
                    >
                      View
                    </button>
                    <button 
                      class="text-green-500 hover:text-green-700 px-2 py-1"
                      on:click={() => handleEditClick(config)}
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    
    {#if isModalOpen}
      <Modal 
        show={isModalOpen}
        title={modalMode === 'add' 
          ? 'Add Salary Configuration' 
          : modalMode === 'edit'
          ? 'Edit Salary Configuration'
          : 'View Salary Configuration'} 
        onClose={handleModalClose}
        wide={true}
      >
        <SalaryStructureForm 
          initialData={null} 
          readOnly={false} 
          on:submit={handleFormSubmit}
        />
      </Modal>
    {/if}
  </div>