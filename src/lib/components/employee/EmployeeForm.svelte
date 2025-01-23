<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import '../../styles/form.css';
  import { lovsApi } from '$lib/services/api/lovs';
  import { userBloodGroups, userLocations, userRoles } from '$lib/constants/users';
  import { employeesApi } from '$lib/services/api';

  // Field interface defines the structure of form fields
  interface Field {
    key: string;
    label: string;
    inputType: 'text' | 'email' | 'select' | 'date' | 'tel' | 'textarea' | 'manager-lookup';
    required: boolean;
    options?: Array<{ label: string; value: string }>;
    lovType?: string;
  }

  // Interface for Manager User
  interface ManagerUser {
    _id: string;
    name: string;
    email: string;
  }

  // Define the fields for the employee form
  let fields: Field[] = [
    { key: 'name', label: 'Name', inputType: 'text', required: true },
    { key: 'email', label: 'Email', inputType: 'email', required: true },
    { key: 'role', label: 'Role', inputType: 'select', required: true, options: userRoles, lovType: 'UserRole' },
    { key: 'joiningDate', label: 'Joining Date', inputType: 'date', required: false },
    { key: 'phone', label: 'Phone', inputType: 'tel', required: false },
    { key: 'location', label: 'Location', inputType: 'select', options: userLocations, required: false },
    { key: 'emergencyContact', label: 'Emergency Contact', inputType: 'tel', required: false },
    { key: 'address', label: 'Address', inputType: 'textarea', required: false },
    { key: 'bloodGroup', label: 'Blood Group', inputType: 'select', options: userBloodGroups, required: false },
    { key: 'dateOfBirth', label: 'Date of Birth', inputType: 'date', required: false },
    { key: 'managerId', label: 'Manager', inputType: 'manager-lookup', required: false }
  ];

  // Employee form data interface
  interface EmployeeFormData {
    email: string;
    role: string;
    joiningDate: string;
    phone?: string;
    location?: string;
    emergencyContact?: string;
    address?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
    managerId?: string;
    [key: string]?: string | undefined;
  }

  // Component props
  export let loading = false;
  export let initialValues: EmployeeFormData;

  // Event dispatcher for form actions
  const dispatch = createEventDispatcher<{
    submit: EmployeeFormData;
    cancel: void;
  }>();

  // Form data and error tracking
  let formData = initialValues;
  let errors: { [key: string]: string } = {};

  // Managers lookup state
  let managers: ManagerUser[] = [];
  let managerOptions: Array<{ label: string; value: string }> = [];
  let managerLookupLoading = false;

  // Fetch managers based on role
  const fetchManagers = async (role: string) => {
    try {
      managerLookupLoading = true;
      let response;
      if (role === 'admin') {
        response = await employeesApi.getRoles('admin');
      } else if (role === 'manager') {
        response = await employeesApi.getRoles('admin');
      } else if (role === 'staff') {
        response = await employeesApi.getRoles('manager');
      } else {
        managerOptions = [];
        return;
      }

      // Safe initialization with fallback
      managerOptions = response.success && Array.isArray(response.data) 
        ? response.data.map((manager: ManagerUser) => ({
            value: manager._id,
            label: `${manager.name} (${manager.email})`
          }))
        : [];

      // Safely assign managers
      managers = response.success && Array.isArray(response.data) 
        ? response.data 
        : [];
    } catch (error) {
      console.error('Error fetching managers:', error);
      // Optionally set an error state or show a notification
      errors['managerId'] = 'Failed to load managers';
    } finally {
      managerLookupLoading = false;
    }
  };

  // On Mount: Fetch List of Values (LOV) for certain fields
  onMount(async () => {
    for (const field of fields) {
      if (field.lovType) {
        const response = await lovsApi.getByType(field.lovType);
        field.options = response.data.values.map((value: { label: string; value: string }) => ({
          label: value.label,
          value: value.value
        }));
      }
    }

    // Fetch managers based on initial role
    await fetchManagers(formData.role);
  });

  // Reactive statement to watch for changes in the role field
  $: if (formData.role) {
    fetchManagers(formData.role);
  }

  const convertToDateTimeFormat = (dateInput: string | Date): string => {
  // Handle different input types
  const date = dateInput instanceof Date 
    ? dateInput 
    : new Date(dateInput);

  // Validate date
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date input: ${dateInput}`);
    return new Date().toISOString(); // Fallback to current date-time
  }

  // Set a consistent time (e.g., noon or a specific time)
  const formattedDate = new Date(
    date.getFullYear(), 
    date.getMonth(), 
    date.getDate(), 
    12, // Hour
    0,  // Minute
    0,  // Second
    0   // Millisecond
  );

  // Convert to ISO 8601 format
  return formattedDate.toISOString();
};

  // Example usage in form submission or data preparation
const prepareEmployeePayload = (formData: EmployeeFormData) => {
  return {
    ...formData,
    joiningDate: convertToDateTimeFormat(formData.joiningDate),
    dateOfBirth: convertToDateTimeFormat(formData.dateOfBirth),
    password: 'TestPassword123',
    departmentId: '60d5f483f8d2e30db8c1a5e4', 
    isActive: true,
  };
};

  // Handle form submission
  const handleSubmit = async() => {
    // Reset errors
    errors = {};

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      return; // Stop form submission
    }

    // If no errors, proceed with form submission
    console.log('Submitting form with data:', formData);
    const employeePayload = prepareEmployeePayload(formData);

  
    dispatch('submit', employeePayload);
  };

  // Handle form cancellation
  const handleCancel = () => {
    dispatch('cancel');
  };

  // Handle general form changes
  const handleChange = () => {
    console.log('Form changed:', formData);
  };




</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each fields as field}
      <div class="form-control">
        <label class="label" for={field.key}>
          <span class="label-text">{field.label}</span>
          {#if field.required}
            <span class="text-error">*</span>
          {/if}
        </label>

        {#if field.inputType === 'textarea'}
          <textarea
            id={field.key}
            class="textarea textarea-bordered h-24"
            bind:value={formData[field.key]}
            on:input={handleChange}
            required={field.required}
            class:input-error={errors[field.key]}
          ></textarea>
        {:else if field.inputType === 'select'}
          <select
            id={field.key}
            class="select select-bordered w-full"
            bind:value={formData[field.key]}
            on:change={handleChange}
            required={field.required}
            class:input-error={errors[field.key]}
          >
            <option value="">Select {field.label}</option>
            {#each field.options || [] as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        {:else if field.inputType === 'date'}
          <div class="flex flex-col">
            <input
              id={field.key}
              type="date"
              class="input input-bordered"
              bind:value={formData[field.key]}
              required={field.required}
              class:input-error={errors[field.key]}
             />
          </div>
        {:else if field.inputType === 'manager-lookup'}
          <select
            id={field.key}
            class="select select-bordered w-full"
            bind:value={formData[field.key]}
            on:input={handleChange}
            required={field.required}
            disabled={managerLookupLoading}
            class:input-error={errors[field.key]}
          >
            <option value="">
              {managerLookupLoading ? 'Loading managers...' : 'Select Manager'}
            </option>
            {#each managerOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
          {:else if field.inputType === 'email'}
          <input
          id={field.key}
          type="email"
          class="input input-bordered"
          bind:value={formData[field.key]}
          on:input={handleChange}
          required={field.required}
          class:input-error={errors[field.key]}
        />
        {:else}
          <input
            id={field.key}
            type="text"
            class="input input-bordered"
            bind:value={formData[field.key]}
            on:input={handleChange}
            required={field.required}
            class:input-error={errors[field.key]}
          />
        {/if}
      </div>
    {/each}
  </div>

  <div class="flex justify-end gap-2">
    <button 
      type="button" 
      class="btn btn-ghost" 
      on:click={handleCancel}
      disabled={loading}
    >
      Cancel
    </button>
    <button 
      type="submit" 
      class="btn btn-primary"
      disabled={loading}
    >
      {loading ? 'Saving...' : 'Save'}
    </button>
  </div>
</form>

<style>
  .input-error {
    border-color: #dc2626;
  }
</style>