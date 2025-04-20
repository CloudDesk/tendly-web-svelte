<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { employeesApi } from '$lib/services/api';
    import type { User } from '$lib/types/user';
  
    export let employeeId: string;
    export let employee: User;
  
    const dispatch = createEventDispatcher<{
      refresh: { employee: User; employeeId: string };
    }>();
  
    // Tab management
    const tabs = ['Basic Info', 'Bank Information', 'Document Details'];
    let activeTab = tabs[0];
  
    // Basic Info
    let basicInfo = {
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role || '',
      joiningDate: employee.joiningDate || ''
    };
    let basicInfoErrors: Record<string, string> = {};
    let basicInfoFormValid = false;
    let basicInfoLoading = false;
  
    // Bank Information
    interface IBankDetails {
      accountHolderName: string;
      accountNumber: string;
      bankName: string;
      ifscCode: string;
      isActive: boolean;
    }
  
    let bankDetails: IBankDetails[] = employee.bankDetails || [];
    let showBankForm = false;
    let bankFormData: IBankDetails = {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      isActive: false
    };
    let bankErrors: Record<string, string> = {};
    let bankFormValid = false;
    let bankLoading = false;
  
    const bankNameOptions = [
      { label: 'State Bank of India', value: 'SBI' },
      { label: 'Punjab National Bank', value: 'PNB' },
      { label: 'Bank of Baroda', value: 'BOB' },
      { label: 'Canara Bank', value: 'Canara' },
      { label: 'Union Bank of India', value: 'Union' },
      { label: 'Bank of India', value: 'BOI' },
      { label: 'Indian Bank', value: 'Indian' },
      { label: 'Central Bank of India', value: 'Central' },
      { label: 'Indian Overseas Bank', value: 'IOB' },
      { label: 'UCO Bank', value: 'UCO' },
      { label: 'Bank of Maharashtra', value: 'Maharashtra' },
      { label: 'Punjab & Sind Bank', value: 'PSB' }
    ];
  
    // Document Details
    interface IGovernmentIds {
      panNumber: string;
      aadhaarNumber: string;
      passportNumber: string;
      voterId: string;
      drivingLicense: string;
    }
  
    let governmentIds: IGovernmentIds = employee.governmentIds || {
      panNumber: '',
      aadhaarNumber: '',
      passportNumber: '',
      voterId: '',
      drivingLicense: ''
    };
    let showDocumentForm = false;
    let documentErrors: Record<string, string> = {};
    let documentFormValid = false;
    let documentLoading = false;
    let initialGovernmentIds = { ...governmentIds };
    let documentFormChanged = false;
  
    // Attachment Management
    let attachments: { id: string; name: string; url: string; file?: File }[] = [];
    let attachmentErrors: string[] = [];
  
    // Format date utility
    function formatDate(date: string | undefined): string {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString();
    }
  
    // Basic Info Validation
    function validateBasicInfoField(field: string, value: string) {
      switch (field) {
        case 'firstName':
          basicInfoErrors.firstName = value.trim() ? '' : 'First Name is required';
          break;
        case 'lastName':
          basicInfoErrors.lastName = value.trim() ? '' : 'Last Name is required';
          break;
        case 'email':
          if (!value.trim()) {
            basicInfoErrors.email = 'Email is required';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            basicInfoErrors.email = 'Invalid email format';
          } else {
            basicInfoErrors.email = '';
          }
          break;
        case 'phone':
          if (!value.trim()) {
            basicInfoErrors.phone = 'Phone is required';
          } else if (!/^\d{10}$/.test(value)) {
            basicInfoErrors(phone = 'Phone must be 10 digits');
          } else {
            basicInfoErrors.phone = '';
          }
          break;
      }
    }
  
    function validateBasicInfoForm() {
      Object.keys(basicInfo).forEach((key) => validateBasicInfoField(key, basicInfo[key]));
      basicInfoFormValid = Object.values(basicInfoErrors).every((err) => err === '');
    }
  
    function handleBasicInfoInput(field: string, value: string) {
      basicInfo = { ...basicInfo, [field]: value };
      validateBasicInfoField(field, value);
      validateBasicInfoForm();
    }
  
    async function handleBasicInfoSubmit() {
      validateBasicInfoForm();
      if (!basicInfoFormValid) return;
  
      basicInfoLoading = true;
      try {
        const updatedEmployee = await employeesApi.update(employeeId, {
          firstName: basicInfo.firstName,
          lastName: basicInfo.lastName,
          email: basicInfo.email,
          phone: basicInfo.phone,
          role: basicInfo.role,
          joiningDate: basicInfo.joiningDate
        });
        employee = updatedEmployee;
        dispatch('refresh', { employee: updatedEmployee, employeeId });
      } catch (error) {
        basicInfoErrors.submit = 'Failed to update basic info';
      } finally {
        basicInfoLoading = false;
      }
    }
  
    // Bank Info Validation
    function validateBankField(field: string, value: string) {
      switch (field) {
        case 'accountHolderName':
          bankErrors.accountHolderName = value.trim() ? '' : 'Account Holder Name is required';
          break;
        case 'accountNumber':
          if (!value.trim()) {
            bankErrors.accountNumber = 'Account Number is required';
          } else if (!/^[a-zA-Z0-9]{9,18}$/.test(value)) {
            bankErrors.accountNumber = 'Account Number must be 9-18 alphanumeric characters';
          } else {
            bankErrors.accountNumber = '';
          }
          break;
        case 'bankName':
          bankErrors.bankName = value.trim() ? '' : 'Bank Name is required';
          break;
        case 'ifscCode':
          if (!value.trim()) {
            bankErrors.ifscCode = 'IFSC Code is required';
          } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
            bankErrors.ifscCode = 'Invalid IFSC Code';
          } else {
            bankErrors.ifscCode = '';
          }
          break;
      }
    }
  
    function validateBankForm() {
      Object.keys(bankFormData).forEach((key) => validateBankField(key, bankFormData[key]));
      bankFormValid = Object.values(bankErrors).every((err) => err === '');
    }
  
    function handleBankInput(field: string, value: string) {
      bankFormData = { ...bankFormData, [field]: value };
      validateBankField(field, value);
      validateBankForm();
    }
  
    function handleBankSelect(value: string) {
      bankFormData.bankName = value;
      validateBankField('bankName', value);
      validateBankForm();
    }
  
    function handleBankCheckbox(checked: boolean) {
      bankFormData.isActive = checked;
      validateBankForm();
    }
  
    async function handleBankSubmit() {
      validateBankForm();
      if (!bankFormValid) return;
  
      if (bankFormData.isActive) {
        bankDetails = bankDetails.map((detail) => ({ ...detail, isActive: false }));
      }
  
      const newBankDetails = [...bankDetails, bankFormData];
      bankLoading = true;
      try {
        const updatedEmployee = await employeesApi.update(employeeId, {
          bankDetails: newBankDetails
        });
        bankDetails = updatedEmployee.bankDetails;
        showBankForm = false;
        bankFormData = {
          accountHolderName: '',
          accountNumber: '',
          bankName: '',
          ifscCode: '',
          isActive: false
        };
        employee = updatedEmployee;
        dispatch('refresh', { employee: updatedEmployee, employeeId });
      } catch (error) {
        bankErrors.submit = 'Failed to submit bank details';
      } finally {
        bankLoading = false;
      }
    }
  
    function handleBankDeactivate() {
      bankDetails = bankDetails.map((detail) => ({ ...detail, isActive: false }));
      showBankForm = true;
    }
  
    // Document Validation
    function validateDocumentForm() {
      documentErrors = {};
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(governmentIds.panNumber)) {
        documentErrors.panNumber = 'Invalid PAN Number (Format: ABCDE1234F)';
      }
      if (!/^\d{12}$/.test(governmentIds.aadhaarNumber)) {
        documentErrors.aadhaarNumber = 'Aadhaar must be 12 digits';
      }
      if (!/^[A-Z]{1}[0-9]{7}$/.test(governmentIds.passportNumber)) {
        documentErrors.passportNumber = 'Invalid Passport Number (Format: A1234567)';
      }
      if (!/^[A-Z]{2}[0-9]{8}$/.test(governmentIds.voterId)) {
        documentErrors.voterId = 'Invalid Voter ID (Format: AB12345678)';
      }
      if (governmentIds.drivingLicense.length < 10) {
        documentErrors.drivingLicense = 'Driving License must be at least 10 characters';
      }
      documentFormValid = Object.values(documentErrors).every((error) => !error);
      documentFormChanged = JSON.stringify(governmentIds) !== JSON.stringify(initialGovernmentIds);
    }
  
    function handleDocumentInput(field: string, value: string) {
      governmentIds = { ...governmentIds, [field]: value };
      validateDocumentForm();
    }
  
    async function handleDocumentSubmit() {
      validateDocumentForm();
      if (!documentFormValid) return;
  
      documentLoading = true;
      try {
        const updatedEmployee = await employeesApi.update(employeeId, {
          governmentIds
        });
        employee = updatedEmployee;
        showDocumentForm = false;
        initialGovernmentIds = { ...governmentIds };
        dispatch('refresh', { employee: updatedEmployee, employeeId });
      } catch (error) {
        documentErrors.submit = 'Failed to submit document details';
      } finally {
        documentLoading = false;
      }
    }
  
    // Attachment Handlers
    async function handleFileUpload(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          attachmentErrors = ['File size exceeds 5MB limit'];
          return;
        }
        const id = crypto.randomUUID();
        const url = URL.createObjectURL(file);
        attachments = [...attachments, { id, name: file.name, url, file }];
        attachmentErrors = [];
      }
    }
  
    function previewAttachment(attachment: { url: string; name: string }) {
      window.open(attachment.url, '_blank');
    }
  
    async function replaceAttachment(id: string, event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        if (file.size > 5 * 1024 * 1024) {
          attachmentErrors = ['File size exceeds 5MB limit'];
          return;
        }
        const url = URL.createObjectURL(file);
        attachments = attachments.map((att) =>
          att.id === id ? { ...att, name: file.name, url, file } : att
        );
        attachmentErrors = [];
      }
    }
  
    function deleteAttachment(id: string) {
      attachments = attachments.filter((att) => att.id !== id);
    }
  
    async function handleAttachmentSubmit() {
      if (attachments.length === 0) return;
      documentLoading = true;
      try {
        // Simulate API call to upload attachments
        const updatedEmployee = await employeesApi.update(employeeId, {
          attachments: attachments.map(({ id, name, url }) => ({ id, name, url }))
        });
        employee = updatedEmployee;
        attachments = [];
        dispatch('refresh', { employee: updatedEmployee, employeeId });
      } catch (error) {
        attachmentErrors = ['Failed to upload attachments'];
      } finally {
        documentLoading = false;
      }
    }
  
    // Watch for form changes
    $: validateBasicInfoForm();
    $: validateBankForm();
    $: validateDocumentForm();
  </script>
  
  <div class="container mx-auto p-6">
    <!-- Tab Navigation -->
    <div class="flex justify-end items-center mb-4">
      <div class="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
        {#each tabs as tab, index}
          <button
            on:click={() => (activeTab = tab)}
            class="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out
              {activeTab === tab ? 'bg-[#e0effe] text-blue-900' : 'text-gray-500 hover:text-gray-700'}"
          >
            {tab}
          </button>
        {/each}
      </div>
    </div>
  
    <!-- Basic Info Section -->
    {#if activeTab === 'Basic Info'}
  <div class="bg-white shadow-lg rounded-xl p-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
      <div class="info-item">
        <h3 class="text-sm font-medium text-gray-500">Full Name</h3>
        <p class="mt-1 text-base font-semibold text-gray-900">{basicInfo.name} </p>
      </div>
      
      <div class="info-item">
        <h3 class="text-sm font-medium text-gray-500">Email</h3>
        <p class="mt-1 text-base text-gray-900">{basicInfo.email || 'N/A'}</p>
      </div>
      
      <div class="info-item">
        <h3 class="text-sm font-medium text-gray-500">Phone</h3>
        <p class="mt-1 text-base text-gray-900">{basicInfo.phone || 'N/A'}</p>
      </div>
      
      <div class="info-item">
        <h3 class="text-sm font-medium text-gray-500">Role</h3>
        <p class="mt-1 text-base text-gray-900">{basicInfo.role || 'N/A'}</p>
      </div>
      
      <div class="info-item">
        <h3 class="text-sm font-medium text-gray-500">Manager</h3>
        <p class="mt-1 text-base text-gray-900">{employee.manager?.name || 'N/A'}</p>
      </div>
      
      <div class="info-item">
        <h3 class="text-sm font-medium text-gray-500">Location</h3>
        <p class="mt-1 text-base text-gray-900">{employee.location || 'N/A'}</p>
      </div>
      
      <div class="info-item">
        <h3 class="text-sm font-medium text-gray-500">Joining Date</h3>
        <p class="mt-1 text-base text-gray-900">{formatDate(basicInfo.joiningDate)}</p>
      </div>
      
      <div class="info-item">
        <h3 class="text-sm font-medium text-gray-500">Employee ID</h3>
        <p class="mt-1 text-base text-gray-900">{employeeId}</p>
      </div>
    </div>
    </div>
    {/if}
  
    <!-- Bank Information Section -->
    {#if activeTab === 'Bank Information'}
      <div class="bg-white shadow-lg rounded-xl p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Bank Information</h2>
        {#if bankDetails.length === 0 && !showBankForm}
          <div class="alert alert-info shadow-lg">
            <span>No bank details available.</span>
          </div>
        {/if}
        {#each bankDetails as detail (detail.accountNumber)}
          {#if detail.isActive}
            <div class="bank-card-compact bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 mb-4">
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
                    on:click={handleBankDeactivate}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      class="mr-2"
                    >
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
          <button class="btn btn-primary mt-4" on:click={() => (showBankForm = !showBankForm)}>
            {showBankForm ? 'Hide Form' : 'Add Bank Details'}
          </button>
        {/if}
        {#if showBankForm}
          <form on:submit|preventDefault={handleBankSubmit} class="space-y-6 mt-4 p-4 bg-base-200 rounded-lg shadow-lg">
            <div class="form-control">
              <label for="accountHolderName" class="label">
                Account Holder Name <span class="text-error">*</span>
              </label>
              <input
                id="accountHolderName"
                type="text"
                class="input input-bordered {bankErrors.accountHolderName ? 'input-error' : ''}"
                bind:value={bankFormData.accountHolderName}
                on:input={(e) => handleBankInput('accountHolderName', e.target.value)}
              />
              {#if bankErrors.accountHolderName}
                <span class="text-error text-sm">{bankErrors.accountHolderName}</span>
              {/if}
            </div>
            <div class="form-control">
              <label for="accountNumber" class="label">
                Account Number <span class="text-error">*</span>
              </label>
              <input
                id="accountNumber"
                type="text"
                class="input input-bordered {bankErrors.accountNumber ? 'input-error' : ''}"
                bind:value={bankFormData.accountNumber}
                on:input={(e) => handleBankInput('accountNumber', e.target.value)}
              />
              {#if bankErrors.accountNumber}
                <span class="text-error text-sm">{bankErrors.accountNumber}</span>
              {/if}
            </div>
            <div class="form-control">
              <label for="bankName" class="label">
                Bank Name <span class="text-error">*</span>
              </label>
              <select
                id="bankName"
                class="select select-bordered {bankErrors.bankName ? 'input-error' : ''}"
                bind:value={bankFormData.bankName}
                on:change={(e) => handleBankSelect(e.target.value)}
              >
                <option value="">Select Bank Name</option>
                {#each bankNameOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              {#if bankErrors.bankName}
                <span class="text-error text-sm">{bankErrors.bankName}</span>
              {/if}
            </div>
            <div class="form-control">
              <label for="ifscCode" class="label">
                IFSC Code <span class="text-error">*</span>
              </label>
              <input
                id="ifscCode"
                type="text"
                class="input input-bordered {bankErrors.ifscCode ? 'input-error' : ''}"
                bind:value={bankFormData.ifscCode}
                on:input={(e) => handleBankInput('ifscCode', e.target.value)}
              />
              {#if bankErrors.ifscCode}
                <span class="text-error text-sm">{bankErrors.ifscCode}</span>
              {/if}
            </div>
            <div class="form-control">
              <label class="label cursor-pointer">
                Main Salary Account
                <input
                  type="checkbox"
                  class="checkbox"
                  bind:checked={bankFormData.isActive}
                  on:change={(e) => handleBankCheckbox(e.target.checked)}
                />
              </label>
            </div>
            {#if bankErrors.submit}
              <span class="text-error text-sm">{bankErrors.submit}</span>
            {/if}
            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="btn btn-ghost"
                on:click={() => (showBankForm = false)}
                disabled={bankLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                disabled={!bankFormValid || bankLoading}
              >
                {bankLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        {/if}
      </div>
    {/if}
  
    <!-- Document Details Section -->
    {#if activeTab === 'Document Details'}
      <div class="bg-white shadow-lg rounded-xl p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Document Details</h2>
        {#if !showDocumentForm && employee.governmentIds && Object.keys(employee.governmentIds).length > 0}
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
          <button class="btn btn-primary mt-4" on:click={() => (showDocumentForm = true)}>
            Edit
          </button>
        {:else if !showDocumentForm}
          <p class="text-gray-500 text-center">No document details available.</p>
          <button class="btn btn-primary mt-4" on:click={() => (showDocumentForm = true)}>
            Add Document
          </button>
        {/if}
        {#if showDocumentForm}
          <form on:submit|preventDefault={handleDocumentSubmit} class="space-y-6">
            <div class="form-control">
              <label class="label" for="panNumber">
                PAN Number <span class="text-error">*</span>
              </label>
              <input
                id="panNumber"
                type="text"
                class="input input-bordered {documentErrors.panNumber ? 'input-error' : ''}"
                bind:value={governmentIds.panNumber}
                on:input={(e) => handleDocumentInput('panNumber', e.target.value)}
              />
              {#if documentErrors.panNumber}
                <span class="text-error text-sm">{documentErrors.panNumber}</span>
              {/if}
            </div>
            <div class="form-control">
              <label class="label" for="aadhaarNumber">
                Aadhaar Number <span class="text-error">*</span>
              </label>
              <input
                id="aadhaarNumber"
                type="text"
                class="input input-bordered {documentErrors.aadhaarNumber ? 'input-error' : ''}"
                bind:value={governmentIds.aadhaarNumber}
                on:input={(e) => handleDocumentInput('aadhaarNumber', e.target.value)}
              />
              {#if documentErrors.aadhaarNumber}
                <span class="text-error text-sm">{documentErrors.aadhaarNumber}</span>
              {/if}
            </div>
            <div class="form-control">
              <label class="label" for="passportNumber">
                Passport Number <span class="text-error">*</span>
              </label>
              <input
                id="passportNumber"
                type="text"
                class="input input-bordered {documentErrors.passportNumber ? 'input-error' : ''}"
                bind:value={governmentIds.passportNumber}
                on:input={(e) => handleDocumentInput('passportNumber', e.target.value)}
              />
              {#if documentErrors.passportNumber}
                <span class="text-error text-sm">{documentErrors.passportNumber}</span>
              {/if}
            </div>
            <div class="form-control">
              <label class="label" for="voterId">
                Voter ID <span class="text-error">*</span>
              </label>
              <input
                id="voterId"
                type="text"
                class="input input-bordered {documentErrors.voterId ? 'input-error' : ''}"
                bind:value={governmentIds.voterId}
                on:input={(e) => handleDocumentInput('voterId', e.target.value)}
              />
              {#if documentErrors.voterId}
                <span class="text-error text-sm">{documentErrors.voterId}</span>
              {/if}
            </div>
            <div class="form-control">
              <label class="label" for="drivingLicense">
                Driving License <span class="text-error">*</span>
              </label>
              <input
                id="drivingLicense"
                type="text"
                class="input input-bordered {documentErrors.drivingLicense ? 'input-error' : ''}"
                bind:value={governmentIds.drivingLicense}
                on:input={(e) => handleDocumentInput('drivingLicense', e.target.value)}
              />
              {#if documentErrors.drivingLicense}
                <span class="text-error text-sm">{documentErrors.drivingLicense}</span>
              {/if}
            </div>
            {#if documentErrors.submit}
              <span class="text-error text-sm">{documentErrors.submit}</span>
            {/if}
            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="btn btn-ghost"
                on:click={() => (showDocumentForm = false)}
                disabled={documentLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                disabled={!documentFormValid || documentLoading || !documentFormChanged}
              >
                {documentLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        {/if}
        <!-- Attachment Section -->
        <div class="mt-6">
          <h3 class="text-lg font-medium text-gray-800 mb-4">Document Attachments</h3>
          <div class="form-control">
            <label class="label">
              Upload Document
              <input
                type="file"
                class="input input-bordered"
                accept=".pdf,.jpg,.jpeg,.png"
                on:change={handleFileUpload}
              />
            </label>
            {#if attachmentErrors.length > 0}
              {#each attachmentErrors as error}
                <span class="text-error text-sm">{error}</span>
              {/each}
            {/if}
          </div>
          {#if attachments.length > 0}
            <div class="mt-4">
              <h4 class="text-md font-medium text-gray-700 mb-2">Uploaded Files</h4>
              {#each attachments as attachment (attachment.id)}
                <div class="flex items-center justify-between p-2 border-b">
                  <span class="text-sm">{attachment.name}</span>
                  <div class="flex gap-2">
                    <button
                      class="btn btn-ghost btn-sm"
                      on:click={() => previewAttachment(attachment)}
                    >
                      Preview
                    </button>
                    <label class="btn btn-ghost btn-sm">
                      Replace
                      <input
                        type="file"
                        class="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        on:change={(e) => replaceAttachment(attachment.id, e)}
                      />
                    </label>
                    <button
                      class="btn btn-ghost btn-sm text-red-600"
                      on:click={() => deleteAttachment(attachment.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              {/each}
              <button
                class="btn btn-primary mt-4"
                on:click={handleAttachmentSubmit}
                disabled={documentLoading || attachments.length === 0}
              >
                {documentLoading ? 'Uploading...' : 'Upload Attachments'}
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
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
    :global(.transition-all) {
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 200ms;
    }
  </style>