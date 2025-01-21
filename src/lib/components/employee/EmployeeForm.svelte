<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import '../../styles/form.css';
    import { lovsApi } from '$lib/services/api/lovs';
  
    interface Field {
      key: string;
      label: string;
      inputType: 'text' | 'email' | 'select' | 'date' | 'tel' | 'textarea' | 'manager-lookup';
      required: boolean;
      options?: Array<{ label: string; value: string }>;
      lovType?: string;
    }
  
    let fields: Field[] = [
      { key: 'email', label: 'Email', inputType: 'email', required: true },
      { key: 'roleId', label: 'Role', inputType: 'select', required: true, options: [], lovType: 'UserRole' },
      { key: 'joiningDate', label: 'Joining Date', inputType: 'date', required: true },
      { key: 'phone', label: 'Phone', inputType: 'tel', required: false },
      { key: 'location', label: 'Location', inputType: 'text', required: false },
      { key: 'emergencyContact', label: 'Emergency Contact', inputType: 'tel', required: false },
      { key: 'address', label: 'Address', inputType: 'textarea', required: false },
      { key: 'bloodGroup', label: 'Blood Group', inputType: 'text', required: false },
      { key: 'dateOfBirth', label: 'Date of Birth', inputType: 'date', required: false },
      { key: 'managerId', label: 'Manager', inputType: 'manager-lookup', required: false }
    ];
  
    interface EmployeeFormData {
      email: string;
      roleId: string;
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
  
    export let loading = false;
    export let initialValues: EmployeeFormData;
  
    const dispatch = createEventDispatcher<{
      submit: EmployeeFormData;
      cancel: void;
    }>();
  
    let formData = initialValues;
  
    onMount(async () => {
      // Fetch LOV options for fields with lovType
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
  
    const handleSubmit = () => {
      console.log('Submitting form with data:', formData);
      dispatch('submit', formData);
    };
  
    const handleCancel = () => {
      dispatch('cancel');
    };
  
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
            ></textarea>
          {:else if field.inputType === 'select'}
            <select
              id={field.key}
              class="select select-bordered w-full"
              bind:value={formData[field.key]}
              on:change={handleChange}
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {#each field.options || [] as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          {:else if field.inputType === 'manager-lookup'}
            <!-- Custom manager lookup component can be implemented here -->
            <input
              id={field.key}
              type="text"
              class="input input-bordered"
              bind:value={formData[field.key]}
              on:input={handleChange}
              required={field.required}
            />
          {:else}
            <input
              id={field.key}
              type="text"
              class="input input-bordered"
              bind:value={formData[field.key]}
              on:input={handleChange}
              required={field.required}
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
    :global(.form-control) {
      display: flex;
      flex-direction: column;
    }
  
    :global(.label) {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }
  
    :global(.text-error) {
      color: #dc2626;
    }
  </style>