<script lang="ts">
  import { onMount } from "svelte";
  import { createEventDispatcher } from 'svelte';
  import { employeesApi } from "$lib/services/api";
  let governmentIds: Record<string, string> = {
    panNumber: "",
    aadhaarNumber: "",
    passportNumber: "",
    voterId: "",
    drivingLicense: "",
  };

  let errors: Record<string, string> = {};
  let showForm = false;
  let loading = false;
  let formValid = false;
  let errorMessage = "";
  let initialGovernmentIds = { ...governmentIds };
  let formChanged = false;
  let showValidationErrors = false;

  const dispatch = createEventDispatcher<{ 
    refresh: { 
      governmentIds: any, 
      employeeId: string 
    } 
  }>();

  function addDocument() {
    showForm = true;
    showValidationErrors = false;
  }

  function closeForm() {
    showForm = false;
    governmentIds = {
      panNumber: "",
      aadhaarNumber: "",
      passportNumber: "",
      voterId: "",
      drivingLicense: "",
    };
    errors = {};
    errorMessage = "";
    showValidationErrors = false;
  }

  export let employee;
  export let employeeId: string;

  $: validateForm();

  function validateForm() {
    errors = {}; // Reset errors

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(governmentIds.panNumber)) {
      errors.panNumber = "Invalid PAN Number (Format: ABCDE1234F)";
    }

    if (!/^\d{12}$/.test(governmentIds.aadhaarNumber)) {
      errors.aadhaarNumber = "Aadhaar must be 12 digits";
    }

    if (!/^[A-Z]{1}[0-9]{7}$/.test(governmentIds.passportNumber)) {
      errors.passportNumber = "Invalid Passport Number (Format: A1234567)";
    }

    if (!/^[A-Z]{2}[0-9]{8}$/.test(governmentIds.voterId)) {
      errors.voterId = "Invalid Voter ID (Format: AB12345678)";
    }

    if (governmentIds.drivingLicense.length < 10) {
      errors.drivingLicense = "Driving License must be at least 10 characters";
    }

    formValid = Object.values(errors).every((error) => !error);
  }

  async function submitForm() {
    if (!formValid) return;

    loading = true;
    try {
      let updateUser = await employeesApi.update(employeeId, {"governmentIds": governmentIds});
      showForm = false;

      dispatch('refresh', { 
        governmentIds:  governmentIds, 
        employeeId: employeeId 
      });

    } catch (error) {
      errors = { ...errors, submit: "Failed to submit bank details." };
    } finally {
      window.location.reload()
      loading = false;
    }
  }

  function editDocument() {
    governmentIds = { ...employee.governmentIds };
    initialGovernmentIds = { ...employee.governmentIds };
    showForm = true;
    showValidationErrors = false;
  }

  function handleInputChange(field: string, value: string) {
    governmentIds[field] = value;
    validateForm();
    formValid = Object.values(errors).every((error) => !error);
    formChanged = JSON.stringify(governmentIds) !== JSON.stringify(initialGovernmentIds);
    showValidationErrors = true;
  }

  $: formChanged = JSON.stringify(governmentIds) !== JSON.stringify(initialGovernmentIds);
</script>

{#if showForm}
  <form on:submit|preventDefault={submitForm} class="space-y-6">
    <div class="form-control">
      <label class="label" for="panNumber">
        <span class="label-text">PAN Number</span>
        <span class="text-error">*</span>
      </label>
      <input
        id="panNumber"
        type="text"
        class="input input-bordered"
        bind:value={governmentIds.panNumber}
        class:input-error={errors.panNumber && showValidationErrors}
        on:input={(e) => handleInputChange('panNumber', e.target.value)}
      />
      {#if errors.panNumber && showValidationErrors}
        <span class="text-error text-sm">{errors.panNumber}</span>
      {/if}
    </div>

    <div class="form-control">
      <label class="label" for="aadhaarNumber">
        <span class="label-text">Aadhaar Number</span>
        <span class="text-error">*</span>
      </label>
      <input
        id="aadhaarNumber"
        type="text"
        class="input input-bordered"
        bind:value={governmentIds.aadhaarNumber}
        class:input-error={errors.aadhaarNumber && showValidationErrors}
        on:input={(e) => handleInputChange('aadhaarNumber', e.target.value)}
      />
      {#if errors.aadhaarNumber && showValidationErrors}
        <span class="text-error text-sm">{errors.aadhaarNumber}</span>
      {/if}
    </div>

    <div class="form-control">
      <label class="label" for="passportNumber">
        <span class="label-text">Passport Number</span>
        <span class="text-error">*</span>
      </label>
      <input
        id="passportNumber"
        type="text"
        class="input input-bordered"
        bind:value={governmentIds.passportNumber}
        class:input-error={errors.passportNumber && showValidationErrors}
        on:input={(e) => handleInputChange('passportNumber', e.target.value)}
      />
      {#if errors.passportNumber && showValidationErrors}
        <span class="text-error text-sm">{errors.passportNumber}</span>
      {/if}
    </div>

    <div class="form-control">
      <label class="label" for="voterId">
        <span class="label-text">Voter ID</span>
        <span class="text-error">*</span>
      </label>
      <input
        id="voterId"
        type="text"
        class="input input-bordered"
        bind:value={governmentIds.voterId}
        class:input-error={errors.voterId && showValidationErrors}
        on:input={(e) => handleInputChange('voterId', e.target.value)}
      />
      {#if errors.voterId && showValidationErrors}
        <span class="text-error text-sm">{errors.voterId}</span>
      {/if}
    </div>

    <div class="form-control">
      <label class="label" for="drivingLicense">
        <span class="label-text">Driving License</span>
        <span class="text-error">*</span>
      </label>
      <input
        id="drivingLicense"
        type="text"
        class="input input-bordered"
        bind:value={governmentIds.drivingLicense}
        class:input-error={errors.drivingLicense && showValidationErrors}
        on:input={(e) => handleInputChange('drivingLicense', e.target.value)}
      />
      {#if errors.drivingLicense && showValidationErrors}
        <span class="text-error text-sm">{errors.drivingLicense}</span>
      {/if}
    </div>

    {#if errorMessage}
      <div class="text-error text-sm">{errorMessage}</div>
    {/if}

    <div class="flex justify-end gap-2">
      <button
        type="button"
        class="btn btn-ghost"
        on:click={closeForm}
        disabled={loading}
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        disabled={!formValid || loading || !formChanged}
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  </form>
{:else}
  {#if employee.governmentIds && Object.keys(employee.governmentIds).length > 0}
    <div class="bg-white shadow-lg rounded-xl p-6 w-full max-w-md mx-auto">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Document Details</h2>
      <div class="space-y-3 text-gray-700">
        {#if employee.governmentIds.panNumber}
          <div class="flex justify-between border-b pb-2">
            <span class="font-medium">PAN Number:</span>
            <span>{employee.governmentIds.panNumber}</span>
          </div>
        {/if}
        {#if employee.governmentIds.aadhaarNumber}
          <div class="flex justify-between border-b pb-2">
            <span class="font-medium">Aadhaar Number:</span>
            <span>{employee.governmentIds.aadhaarNumber}</span>
          </div>
        {/if}
        {#if employee.governmentIds.passportNumber}
          <div class="flex justify-between border-b pb-2">
            <span class="font-medium">Passport Number:</span>
            <span>{employee.governmentIds.passportNumber}</span>
          </div>
        {/if}
        {#if employee.governmentIds.voterId}
          <div class="flex justify-between border-b pb-2">
            <span class="font-medium">Voter ID:</span>
            <span>{employee.governmentIds.voterId}</span>
          </div>
        {/if}
        {#if employee.governmentIds.drivingLicense}
          <div class="flex justify-between">
            <span class="font-medium">Driving License:</span>
            <span>{employee.governmentIds.drivingLicense}</span>
          </div>
        {/if}
      </div>
      <button class="btn btn-primary mt-4" on:click={editDocument}>Edit</button>
    </div>
  {:else}
    <p class="text-gray-500 text-center">No document details available.</p>
    <button class="btn btn-primary mt-4" on:click={addDocument}>Add Document</button>
  {/if}
{/if}

<style>b    
  .input-error {
    border-color: #dc2626;
  }
  .text-error {
    color: #dc2626;
  }
  .card {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    background-color: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  .card-content p {
    margin: 0.5rem 0;
  }
</style>
