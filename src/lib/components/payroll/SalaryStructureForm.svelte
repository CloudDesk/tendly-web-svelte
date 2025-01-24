<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
  
    export let employeeId: string;
    export let salaryStructure = null;
  
    let formData = {
      employeeId: '',
      basicSalary: '',
      hra: '',
      conveyanceAllowance: '',
      medicalAllowance: '',
      grossSalary: '',
      netSalary: '',
      ctc: '',
      pfDeduction: '',
      incomeTaxDeduction: '',
      pfEmployerContribution: '',
      gratuity: ''
    };
  
    const dispatch = createEventDispatcher();
  
    // Automatically calculate salary components when one of the fields changes
    const calculateSalaryComponents = () => {
      const basicSalary = parseFloat(formData.basicSalary) || 0;
      const hra = parseFloat(formData.hra) || 0;
      const conveyanceAllowance = parseFloat(formData.conveyanceAllowance) || 0;
      const medicalAllowance = parseFloat(formData.medicalAllowance) || 0;
  
      // Calculate PF Deduction (12% of Basic Salary)
      formData.pfDeduction = basicSalary * 0.12;
  
      // Calculate PF Employer Contribution (12% of Basic Salary)
      formData.pfEmployerContribution = basicSalary * 0.12;
  
      // Calculate Gratuity (4.81% of Basic Salary)
      formData.gratuity = basicSalary * 0.0481;
  
      // Calculate Gross Salary
      formData.grossSalary = basicSalary + hra + conveyanceAllowance + medicalAllowance;
  
      // Calculate Income Tax Deduction (10% of Gross Salary)
      formData.incomeTaxDeduction = formData.grossSalary * 0.10;
  
      // Calculate Net Salary
      formData.netSalary = formData.grossSalary - formData.pfDeduction - formData.incomeTaxDeduction;
  
      // Calculate CTC (for 12 months)
      formData.ctc = (formData.grossSalary + formData.pfEmployerContribution + formData.gratuity) * 12;
    };
  
    // Auto-calculate when any of the relevant fields change
    $: formData.basicSalary, formData.hra, formData.conveyanceAllowance, formData.medicalAllowance, calculateSalaryComponents();
  
    onMount(() => {
      if (salaryStructure) {
        formData = { ...salaryStructure };
      } else {
        formData.employeeId = employeeId;
      }
    });
  
    const handleSubmit = async () => {
      // Perform validation here
      if (!formData.basicSalary || !formData.hra || !formData.grossSalary || !formData.netSalary || !formData.ctc) {
        alert('Please fill in all required fields.');
        return;
      }
  
      // Dispatch the submit event with the salary structure data
      dispatch('submit', formData);
    };
  
    const handleCancel = () => {
      dispatch('cancel');
    };
  </script>
  
  <div class="p-6 bg-white shadow-md rounded-lg">
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label" for="basicSalary">Basic Salary</label>
          <input
            id="basicSalary"
            type="number"
            class="input input-bordered"
            bind:value={formData.basicSalary}
            required
          />
        </div>
        <div class="form-control">
          <label class="label" for="hra">HRA</label>
          <input
            id="hra"
            type="number"
            class="input input-bordered"
            bind:value={formData.hra}
            required
          />
        </div>
        <div class="form-control">
          <label class="label" for="conveyanceAllowance">Conveyance Allowance</label>
          <input
            id="conveyanceAllowance"
            type="number"
            class="input input-bordered"
            bind:value={formData.conveyanceAllowance}
          />
        </div>
        <div class="form-control">
          <label class="label" for="medicalAllowance">Medical Allowance</label>
          <input
            id="medicalAllowance"
            type="number"
            class="input input-bordered"
            bind:value={formData.medicalAllowance}
          />
        </div>
        <div class="form-control">
          <label class="label" for="pfDeduction">PF Deduction</label>
          <input
            id="pfDeduction"
            type="number"
            class="input input-bordered"
            bind:value={formData.pfDeduction}
            disabled
          />
        </div>
        <div class="form-control">
          <label class="label" for="incomeTaxDeduction">Income Tax Deduction</label>
          <input
            id="incomeTaxDeduction"
            type="number"
            class="input input-bordered"
            bind:value={formData.incomeTaxDeduction}
            disabled
          />
        </div>
        <div class="form-control">
          <label class="label" for="pfEmployerContribution">PF Employer Contribution</label>
          <input
            id="pfEmployerContribution"
            type="number"
            class="input input-bordered"
            bind:value={formData.pfEmployerContribution}
            disabled
          />
        </div>
        <div class="form-control">
          <label class="label" for="gratuity">Gratuity</label>
          <input
            id="gratuity"
            type="number"
            class="input input-bordered"
            bind:value={formData.gratuity}
            disabled
          />
        </div>
        <div class="form-control">
          <label class="label" for="grossSalary">Gross Salary</label>
          <input
            id="grossSalary"
            type="number"
            class="input input-bordered"
            bind:value={formData.grossSalary}
            disabled
          />
        </div>
        <div class="form-control">
          <label class="label" for="netSalary">Net Salary</label>
          <input
            id="netSalary"
            type="number"
            class="input input-bordered"
            bind:value={formData.netSalary}
            disabled
          />
        </div>
        <div class="form-control">
          <label class="label" for="ctc">CTC</label>
          <input
            id="ctc"
            type="number"
            class="input input-bordered"
            bind:value={formData.ctc}
            disabled
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