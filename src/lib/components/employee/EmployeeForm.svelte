<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import '../../styles/form.css';
  import { lovsApi } from '$lib/services/api/lovs';
  import { userBloodGroups, userLocations, userRoles } from '$lib/constants/users';

  // Field interface defines the structure of form fields
  interface Field {
    key: string;
    label: string;
    inputType: 'text' | 'email' | 'select' | 'date' | 'tel' | 'textarea' | 'manager-lookup';
    required: boolean;
    options?: Array<{ label: string; value: string }>;
    lovType?: string;
  }

  // Define the fields for the employee form
  let fields: Field[] = [
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
    [key: string]: string | undefined;
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

  // Validation function for Joining Date
  const validateJoiningDate = (date: string): string | null => {
    if (!date) return 'Joining date is required';

    const selectedDate = new Date(date);
    const today = new Date();
    
    // Calculate 10 days ago
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(today.getDate() - 10);

    // Check if date is in the future
    if (selectedDate > today) {
      return 'Joining date cannot be in the future';
    }

    // Check if date is more than 10 days in the past
    if (selectedDate < tenDaysAgo) {
      return 'Joining date must be within the last 10 days';
    }

    return null;
  };

  // Validation function for Date of Birth
  const validateDateOfBirth = (date: string): string | null => {
    if (!date) return null;

    const selectedDate = new Date(date);
    const today = new Date();
    
    // Calculate 18 years ago
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(today.getFullYear() - 18);

    // Check if user is at least 18 years old
    if (selectedDate > eighteenYearsAgo) {
      return 'You must be at least 18 years old';
    }

    return null;
  };

  // Helper function to get max date for joining date (10 days ago)
  const getTenDaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 10);
    return date.toISOString().split('T')[0];
  };

  // Helper function to get min date for date of birth (18 years ago)
  const getMinDateOfBirth = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split('T')[0];
  };

  // Handle date field changes with validation
  const handleDateChange = (fieldKey: string) => {
    // Clear previous errors for the specific field
    errors[fieldKey] = '';

    // Perform specific validations based on field
    if (fieldKey === 'joiningDate') {
      const error = validateJoiningDate(formData.joiningDate);
      if (error) errors[fieldKey] = error;
    }

    if (fieldKey === 'dateOfBirth') {
      const error = validateDateOfBirth(formData.dateOfBirth);
      if (error) errors[fieldKey] = error;
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
  });

  // Handle form submission
  const handleSubmit = () => {
    // Reset errors
    errors = {};

    // Validate joining date
    if (formData.joiningDate) {
      const joiningDateError = validateJoiningDate(formData.joiningDate);
      if (joiningDateError) {
        errors['joiningDate'] = joiningDateError;
      }
    }

    // Validate date of birth
    if (formData.dateOfBirth) {
      const dateOfBirthError = validateDateOfBirth(formData.dateOfBirth);
      if (dateOfBirthError) {
        errors['dateOfBirth'] = dateOfBirthError;
      }
    }

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      return; // Stop form submission
    }

    // If no errors, proceed with form submission
    console.log('Submitting form with data:', formData);
    dispatch('submit', formData);
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
            <!-- <input
            id={field.key}
            type="date"
            class="input input-bordered"
            bind:value={formData[field.key]}
            on:input={() => handleDateChange(field.key)}
            required={field.required}
            max={field.key === 'joiningDate' ? getTenDaysAgo() : undefined}
            min={field.key === 'dateOfBirth' ? getMinDateOfBirth() : undefined}
            class:input-error={errors[field.key]}
          />
            {#if errors[field.key]}
              <span class="text-error text-sm mt-1">{errors[field.key]}</span>
            {/if} -->
          </div>
        {:else if field.inputType === 'manager-lookup'}
          <input
            id={field.key}
            type="text"
            class="input input-bordered"
            bind:value={formData[field.key]}
            on:input={handleChange}
            required={field.required}
            class:input-error={errors[field.key]}
          />
        {:else}
          <input
            id={field.key}
            type='string'
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