<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import "../../styles/form.css";
  import { lovsApi } from "$lib/services/api/lovs";
  import { employeesApi } from "$lib/services/api";

  // Field interface defines the structure of form fields
  interface Field {
    key: string;
    label: string;
    inputType:
      | "text"
      | "email"
      | "select"
      | "date"
      | "tel"
      | "textarea"
      | "manager-lookup";
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

  // Component props with default value for initialValues
  export let loading = false;
  let formValid = false; // ✅ Initialize formValid
  export let initialValues: EmployeeFormData = {
    email: "",
    role: "",
    joiningDate: "",
  };
  let userRoles: Array<{ label: string; value: string }> = [];
  console.log(userRoles, "userRolesuserRolesuserRoles");
  let userLocations: Array<{ label: string; value: string }> = [];
  let userBloodGroups: Array<{ label: string; value: string }> = [];

  // Event dispatcher for form actions
  const dispatch = createEventDispatcher<{
    submit: EmployeeFormData;
    cancel: void;
  }>();

  // Form data and error tracking
  let formData = { ...initialValues }; // Spread to ensure a new object
  let errors: { [key: string]: string } = {};

  // Managers lookup state
  let managers: ManagerUser[] = [];
  let managerOptions: Array<{ label: string; value: string }> = [];
  let managerLookupLoading = false;

  // Define the fields for the employee form as a const to prevent runtime modifications
  const fields: Field[] = [
    { key: "name", label: "Name", inputType: "text", required: true },
    { key: "email", label: "Email", inputType: "email", required: true },
    {
      key: "role",
      label: "Role",
      inputType: "select",
      required: true,
      options: [],
      lovType: "UserRole",
    },
    {
      key: "joiningDate",
      label: "Joining Date",
      inputType: "date",
      required: false,
    },
    { key: "phone", label: "Phone", inputType: "tel", required: false },
    {
      key: "location",
      label: "Location",
      inputType: "select",
      options: [],
      required: false,
    },
    {
      key: "emergencyContact",
      label: "Emergency Contact",
      inputType: "tel",
      required: false,
    },
    {
      key: "address",
      label: "Address",
      inputType: "textarea",
      required: false,
    },
    {
      key: "bloodGroup",
      label: "Blood Group",
      inputType: "select",
      options: [],
      required: false,
    },
    {
      key: "dateOfBirth",
      label: "Date of Birth",
      inputType: "date",
      required: false,
    },
    {
      key: "managerId",
      label: "Manager",
      inputType: "manager-lookup",
      required: true,
    },
  ];

  // Fetch managers based on role
  async function fetchManagers(role: string) {
    try {
      managerLookupLoading = true;
      let response;
      if (role === "admin" || role === "manager") {
        response = await employeesApi.getRoles("admin");
      } else if (role === "staff") {
        response = await employeesApi.getRoles("manager");
      } else {
        managerOptions = [];
        return;
      }

      managerOptions =
        response.success && Array.isArray(response.data)
          ? response.data.map((manager: ManagerUser) => ({
              value: manager._id,
              label: `${manager.name} (${manager.email})`,
            }))
          : [];
      managers =
        response.success && Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching managers:", error);
      errors["managerId"] = "Failed to load managers";
    } finally {
      managerLookupLoading = false;
    }
  }

  $: updatedFields = fields.map((field) => ({
    ...field,
    options:
      field.key === "role"
        ? userRoles
        : field.key === "location"
          ? userLocations
          : field.key === "bloodGroup"
            ? userBloodGroups
            : field.options,
  }));
  // Fetch list of values (LOVs) from API on component mount
  onMount(async () => {
    try {
      const rolesResponse: any = await lovsApi.getByType("role");
      if (rolesResponse.success) {
        userRoles = rolesResponse?.data?.values.map((role: any) => ({
          label: role.label,
          value: role.value,
        }));
      }

      const locationsResponse: any = await lovsApi.getByType("city");
      if (locationsResponse.success) {
        userLocations = locationsResponse.data.values.map((location: any) => ({
          label: location.label,
          value: location.value,
        }));
      }

      const bloodGroupsResponse: any = await lovsApi.getByType("bloodgroup");
      if (bloodGroupsResponse.success) {
        userBloodGroups = bloodGroupsResponse.data.values.map((bg: any) => ({
          label: bg.label,
          value: bg.value,
        }));
      }
      // Fetch managers only if role is defined
      if (formData.role) {
        await fetchManagers(formData.role);
      }
    } catch (error) {
      console.error("Error fetching LOVs:", error);
    }
  });

  // Reactive statement to watch role changes
  $: formData.role && fetchManagers(formData.role);

  // Convert date to ISO format
  const convertToDateTimeFormat = (dateInput: string | Date): string => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date input: ${dateInput}`);
      return new Date().toISOString(); // Fallback to current date-time
    }
    const formattedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
      0,
      0,
      0
    );
    return formattedDate.toISOString();
  };

  // Prepare employee payload for submission
  const prepareEmployeePayload = (formData: EmployeeFormData) => {
    return {
      ...formData,
      joiningDate: formData.joiningDate
        ? convertToDateTimeFormat(formData.joiningDate)
        : "",
      dateOfBirth: formData.dateOfBirth
        ? convertToDateTimeFormat(formData.dateOfBirth)
        : "",
      password: "123456",
      departmentId: "60d5f483f8d2e30db8c1a5e4",
      isActive: "true",
    };
  };

  // Function to validate date of birth
  function validateDOB(date: string): boolean {
    const selectedDate = new Date(date);
    const today = new Date();
    return selectedDate <= today;
  }

  // Function to validate phone number
  function validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  }

  // Reactive statement to validate fields
  $: {
    errors = {}; // Reset errors before re-validating

    // Validate phone
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      errors.phone = "Phone number must be exactly 10 digits.";
    } else {
      delete errors.phone;
    }

    // Validate emergency contact
    if (
      formData.emergencyContact &&
      !validatePhoneNumber(formData.emergencyContact)
    ) {
      errors.emergencyContact = "Emergency Contact must be exactly 10 digits.";
    } else {
      delete errors.emergencyContact;
    }

    // Validate Date of Birth
    if (formData.dateOfBirth && !validateDOB(formData.dateOfBirth)) {
      errors.dateOfBirth = "Date of Birth cannot be in the future.";
    } else {
      delete errors.dateOfBirth;
    }

    // Check if form is valid
    formValid = Object.keys(errors).length === 0;
  }

  // Handle form submission
  const handleSubmit = async () => {
    errors = {};

    // Basic validation (you can expand this)
    for (const field of fields) {
      if (field.required && !formData[field.key]) {
        errors[field.key] = `${field.label} is required`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return;
    }

    // Set loading state to true before submitting
    loading = true;

    try {
      console.log("Submitting form with data:", formData);
      const employeePayload = prepareEmployeePayload(formData);
      dispatch("submit", employeePayload);
    } catch (error) {
      console.error("Submission failed:", error);
      errors.submit = "Failed to add employee.";
    } finally {
      // Reset loading state after form submission (whether success or failure)
      loading = false;
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    dispatch("cancel");
  };

  // Handle general form changes
  const handleChange = () => {
    console.log("Form changed:", formData);
  };
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each updatedFields as field}
      <div class="form-control">
        <label class="label" for={field.key}>
          <span class="label-text">{field.label}</span>
          {#if field.required}
            <span class="text-error">*</span>
          {/if}
        </label>

        {#if field.inputType === "textarea"}
          <textarea
            id={field.key}
            class="textarea textarea-bordered h-24"
            bind:value={formData[field.key]}
            on:input={handleChange}
            required={field.required}
            class:input-error={errors[field.key]}
          ></textarea>
        {:else if field.inputType === "select"}
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
        {:else if field.inputType === "date"}
          <div class="flex flex-col">
            <input
              id={field.key}
              type="date"
              class="input input-bordered"
              bind:value={formData[field.key]}
              required={field.required}
              class:input-error={errors[field.key]}
            />
            {#if errors[field.key] && field.inputType === "date"}
              <span class="text-error text-sm">{errors[field.key]}</span>
            {/if}
          </div>
        {:else if field.inputType === "manager-lookup"}
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
              {managerLookupLoading ? "Loading managers..." : "Select Manager"}
            </option>
            {#each managerOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        {:else if field.inputType === "email"}
          <input
            id={field.key}
            type="email"
            class="input input-bordered"
            bind:value={formData[field.key]}
            on:input={handleChange}
            required={field.required}
            class:input-error={errors[field.key]}
          />
        {:else if field.inputType === "tel"}
          <input
            id={field.key}
            type="tel"
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

        {#if errors[field.key] && field.inputType !== "date"}
          <span class="text-error text-sm">{errors[field.key]}</span>
        {/if}
      </div>
    {/each}
  </div>

  {#if errors.submit}
    <div class="text-error text-sm">{errors.submit}</div>
  {/if}

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
      disabled={!formValid || loading}
    >
      {loading ? "Saving..." : "Save"}
    </button>
  </div>
</form>

<style>
  .input-error {
    border-color: #dc2626;
  }
  .text-error {
    color: #dc2626;
  }
</style>
