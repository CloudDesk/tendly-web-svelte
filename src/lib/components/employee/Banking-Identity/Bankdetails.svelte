<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import "$lib/styles/form.css";
  import { employeesApi } from "$lib/services/api";

  interface IBankDetails {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    isActive: boolean;
  }

  let showForm = false;
  let loading = false;
  let formValid = false;
  let formData: IBankDetails = {
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    isActive: false,
  };
  let errors: { [key: string]: string } = {};
  let bankDetails: IBankDetails[] = [];

  const dispatch = createEventDispatcher<{ 
    refresh: { 
      bankDetails: any[], 
      employeeId: string 
    } 
  }>();


  export let employee;
  console.log(employee,"employeeemployeeemployee")
  const bankNameOptions = [
    { label: "State Bank of India", value: "SBI" },
    { label: "Punjab National Bank", value: "PNB" },
    { label: "Bank of Baroda", value: "BOB" },
    { label: "Canara Bank", value: "Canara" },
    { label: "Union Bank of India", value: "Union" },
    { label: "Bank of India", value: "BOI" },
    { label: "Indian Bank", value: "Indian" },
    { label: "Central Bank of India", value: "Central" },
    { label: "Indian Overseas Bank", value: "IOB" },
    { label: "UCO Bank", value: "UCO" },
    { label: "Bank of Maharashtra", value: "Maharashtra" },
    { label: "Punjab & Sind Bank", value: "PSB" },
  ];

  export let employeeId: string;

  // Function to validate fields
  function validateField(field: string, value: string) {
    switch (field) {
      case "accountHolderName":
        errors.accountHolderName = value.trim() ? "" : "Account Holder Name is required.";
        break;
      case "accountNumber":
        if (!value.trim()) {
          errors.accountNumber = "Account Number is required.";
        } else if (!/^[a-zA-Z0-9]{9,18}$/.test(value)) {
          errors.accountNumber = "Account Number must be between 9 and 18 alphanumeric characters.";
        } else {
          errors.accountNumber = "";
        }
        break;
      case "bankName":
        errors.bankName = value.trim() ? "" : "Bank Name is required.";
        break;
      case "ifscCode":
        if (!value.trim()) {
          errors.ifscCode = "IFSC Code is required.";
        } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
          errors.ifscCode = "Invalid IFSC Code.";
        } else {
          errors.ifscCode = "";
        }
        break;
    }
  }

  // Handle input changes
  function handleInput(event: Event, field: string) {
    const target = event.target as HTMLInputElement;
    formData = { ...formData, [field]: target.value };
    validateField(field, target.value);
    validateForm();
  }

  function handleSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    formData.bankName = target.value;
    validateField("bankName", target.value);
    validateForm();
  }

  function handleCheckbox(event: Event) {
    const target = event.target as HTMLInputElement;
    formData.isActive = target.checked;
    validateForm();
  }

  // Validate entire form
  function validateForm() {
    Object.keys(formData).forEach((key) => validateField(key, (formData as any)[key]));
    formValid = Object.values(errors).every((err) => err === "");
  }

  // Handle form submission
  async function handleSubmit() {
    validateForm();
    if (!formValid) return;

    if (formData.isActive) {
      bankDetails = bankDetails.map(detail => ({ ...detail, isActive: false }));
    }
    
    let newformData = [...bankDetails, formData];
    loading = true;
    try {
      let updateUser = await employeesApi.update(employeeId, {"bankDetails": newformData});
      showForm = false;

      dispatch('refresh', {
        bankDetails: formData, // or updatedEmployee.bank if using API
        employeeId: employeeId
      });
    } catch (error) {
      errors = { ...errors, submit: "Failed to submit bank details." };
    } finally {
      window.location.reload()
      loading = false;
    }
  }

  function handleCancel() {
    showForm = false;
    dispatch("close");
  }

  function handleDeactivate() {
    showForm = true;
    bankDetails = bankDetails.map(detail => ({ ...detail, isActive: false }));
  }

  function handleAddBankDetails() {
    showForm = !showForm;
    if (showForm) {
      bankDetails = [];
    }
  }

  // Watch for form changes to validate
  $: validateForm();
  $: bankDetails = employee?.bankDetails || [];
</script>

{#if bankDetails.length === 0 && !showForm}
  <div class="alert alert-info shadow-lg">
    <div>
      <span>No bank details available.</span>
    </div>
  </div>
{/if}

{#each bankDetails as detail (detail.accountNumber)}
   {#if detail.isActive}
     <div class="bank-card-compact bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
       <div class="p-4">
         <div class="flex justify-between items-center mb-3">
           <span class="badge badge-success text-xs">Active</span>
         </div>
         
         <div class="space-y-2 text-sm">
           <div class="grid grid-cols-[140px_1fr] gap-2">
             <div class="text-gray-600 font-medium">Bank Name:</div>
             <div class="font-semibold">{detail.bankName}</div>
             
             <div class="text-gray-600 font-medium">Account Holder:</div>
             <div class="font-semibold">{detail.accountHolderName}</div>
             
             <div class="text-gray-600 font-medium">Account Number:</div>
             <div class="font-semibold">{detail.accountNumber}</div>
             
             <div class="text-gray-600 font-medium">IFSC Code:</div>
             <div class="font-semibold">{detail.ifscCode}</div>
           </div>
         </div>
         
         <div class="mt-6 flex justify-end">
           <button
             class="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-300 flex items-center space-x-2"
             on:click={handleDeactivate}
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="mr-2">
               <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
               <line x1="12" y1="9" x2="12" y2="13"></line>
               <line x1="12" y1="17" x2="12.01" y2="17"></line>
             </svg>
             Deactivate
           </button>
         </div>
       </div>
     </div>
   {/if}
{/each}

{#if bankDetails.length === 0}
  <button class="btn btn-primary mt-4" on:click={handleAddBankDetails}>
    {showForm ? "Hide Form" : "Add Bank Details"}
  </button>
{/if}

{#if showForm}
  <form on:submit|preventDefault={handleSubmit} class="space-y-6 mt-4 p-4 bg-base-200 rounded-lg shadow-lg">
    <div class="form-control">
      <label for="accountHolderName" class="label">Account Holder Name <span class="text-error">*</span></label>
      <input id="accountHolderName" type="text" class="input input-bordered {errors.accountHolderName ? 'input-error' : ''}" bind:value={formData.accountHolderName} on:input={(e) => handleInput(e, "accountHolderName")} />
      {#if errors.accountHolderName} <span class="text-error text-sm">{errors.accountHolderName}</span> {/if}
    </div>

    <div class="form-control">
      <label for="accountNumber" class="label">Account Number <span class="text-error">*</span></label>
      <input id="accountNumber" type="text" class="input input-bordered {errors.accountNumber ? 'input-error' : ''}" bind:value={formData.accountNumber} on:input={(e) => handleInput(e, "accountNumber")} />
      {#if errors.accountNumber} <span class="text-error text-sm">{errors.accountNumber}</span> {/if}
    </div>

    <div class="form-control">
      <label for="bankName" class="label">Bank Name <span class="text-error">*</span></label>
      <select id="bankName" class="select select-bordered {errors.bankName ? 'input-error' : ''}" bind:value={formData.bankName} on:change={handleSelect}>
        <option value="">Select Bank Name</option>
        {#each bankNameOptions as option} <option value={option.value}>{option.label}</option> {/each}
      </select>
      {#if errors.bankName} <span class="text-error text-sm">{errors.bankName}</span> {/if}
    </div>

    <div class="form-control">
      <label for="ifscCode" class="label">IFSC Code <span class="text-error">*</span></label>
      <input id="ifscCode" type="text" class="input input-bordered {errors.ifscCode ? 'input-error' : ''}" bind:value={formData.ifscCode} on:input={(e) => handleInput(e, "ifscCode")} />
      {#if errors.ifscCode} <span class="text-error text-sm">{errors.ifscCode}</span> {/if}
    </div>

    <div class="form-control">
      <label class="label cursor-pointer">
        Main Salary Account 
        <input type="checkbox" class="checkbox" bind:checked={formData.isActive} on:change={handleCheckbox} />
      </label>
    </div>

    <div class="flex justify-end gap-2">
      <button type="button" class="btn btn-ghost" on:click={handleCancel} disabled={loading}>Cancel</button>
      <button type="submit" class="btn btn-primary" disabled={!formValid || loading}>{loading ? "Saving..." : "Save"}</button>
    </div>
  </form>
{/if}
<style>
    .bank-card-compact {
    max-width: 350px;
    width: 100%;
  }
  
  .badge-success {
    background-color: #10b981;
    color: white;
    padding: 0.15rem 0.35rem;
    border-radius: 0.25rem;
  }
  .input-error {
    border-color: #dc2626;
  }
  .text-error {
    color: #dc2626;
  }
</style>