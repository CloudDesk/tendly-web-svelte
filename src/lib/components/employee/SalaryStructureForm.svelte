<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { onMount } from 'svelte';
  
    export let employeeId: string;
  
    let salaryStructure = {
      employeeId: '',
      basicSalary: '',
      hra: '',
      conveyanceAllowance: '',
      medicalAllowance: '',
      grossSalary: '',
      netSalary: '',
      ctc: ''
    };
  
    const dispatch = createEventDispatcher();
  
    onMount(() => {
      salaryStructure.employeeId = employeeId;
    });
  
    const handleSubmit = () => {
      // Perform validation here
      if (!salaryStructure.basicSalary || !salaryStructure.hra || !salaryStructure.grossSalary || !salaryStructure.netSalary || !salaryStructure.ctc) {
        alert('Please fill in all required fields.');
        return;
      }
  
      // Dispatch the submit event with the salary structure data
      dispatch('submit', salaryStructure);
    };
  
    const handleCancel = () => {
      dispatch('cancel');
    };
  </script>
  
  <div class="p-6 bg-white shadow-md rounded-lg">
    <h2 class="text-xl font-semibold mb-4">Salary Structure</h2>
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label" for="basicSalary">Basic Salary</label>
          <input
            id="basicSalary"
            type="number"
            class="input input-bordered"
            bind:value={salaryStructure.basicSalary}
            required
          />
        </div>
        <div class="form-control">
          <label class="label" for="hra">HRA</label>
          <input
            id="hra"
            type="number"
            class="input input-bordered"
            bind:value={salaryStructure.hra}
            required
          />
        </div>
        <div class="form-control">
          <label class="label" for="conveyanceAllowance">Conveyance Allowance</label>
          <input
            id="conveyanceAllowance"
            type="number"
            class="input input-bordered"
            bind:value={salaryStructure.conveyanceAllowance}
          />
        </div>
        <div class="form-control">
          <label class="label" for="medicalAllowance">Medical Allowance</label>
          <input
            id="medicalAllowance"
            type="number"
            class="input input-bordered"
            bind:value={salaryStructure.medicalAllowance}
          />
        </div>
        <div class="form-control">
          <label class="label" for="grossSalary">Gross Salary</label>
          <input
            id="grossSalary"
            type="number"
            class="input input-bordered"
            bind:value={salaryStructure.grossSalary}
            required
          />
        </div>
        <div class="form-control">
          <label class="label" for="netSalary">Net Salary</label>
          <input
            id="netSalary"
            type="number"
            class="input input-bordered"
            bind:value={salaryStructure.netSalary}
            required
          />
        </div>
        <div class="form-control">
          <label class="label" for="ctc">CTC</label>
          <input
            id="ctc"
            type="number"
            class="input input-bordered"
            bind:value={salaryStructure.ctc}
            required
          />
        </div>
      </div>
  
      <div class="flex justify-end gap-2">
        <button 
          type="button" 
          class="btn btn-ghost" 
          on:click={handleCancel}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
        >
          Submit
        </button>
      </div>
    </form>
  </div>
  
  <style>
    .form-control {
      display: flex;
      flex-direction: column;
    }
  
    .label {
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
  
    .input {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
    }
  
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
    }
  
    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }
  
    .btn-primary:hover {
      background-color: #2563eb;
    }
  
    .btn-ghost {
      background-color: transparent;
      color: #374151;
    }
  
    .btn-ghost:hover {
      background-color: #f3f4f6;
    }
  </style>