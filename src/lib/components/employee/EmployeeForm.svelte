<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import "../../styles/form.css";
  import { lovsApi } from "$lib/services/api/lovs";
  import { employeesApi } from "$lib/services/api";
  import { t } from "svelte-i18n";

  interface Field {
    key: string;
    labelKey: string; // Store the translation key instead of the resolved label
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

  interface ManagerUser {
    _id: string;
    name: string;
    email: string;
  }

  interface EmployeeFormData {
    _id?: string;
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
    departmentId?: string;
    password?: string;
    [key: string]: string | undefined;
  }

  export let loading = false;
  export let mode: "create" | "update" = "create";
  let formValid = false;
  export let initialValues: EmployeeFormData = {
    email: "",
    role: "",
    joiningDate: "",
  };

  let userRoles: Array<{ label: string; value: string }> = [];
  let userLocations: Array<{ label: string; value: string }> = [];
  let userBloodGroups: Array<{ label: string; value: string }> = [];
  let userDepartments: Array<{ label: string; value: string }> = [];

  const dispatch = createEventDispatcher<{
    submit: EmployeeFormData;
    update: EmployeeFormData;
    cancel: void;
  }>();

  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const processInitialValues = () => {
    console.log("Processing initial values:", initialValues);
    const processed = { ...initialValues };
    if (processed.joiningDate) {
      processed.joiningDate = formatDateForInput(processed.joiningDate);
    }
    if (processed.dateOfBirth) {
      processed.dateOfBirth = formatDateForInput(processed.dateOfBirth);
    }
    console.log("Processed values:", processed);
    return processed;
  };

  let formData = processInitialValues();
  let errors: { [key: string]: string } = {};

  let managers: ManagerUser[] = [];
  let managerOptions: Array<{ label: string; value: string }> = [];
  let managerLookupLoading = false;
  let previousRole = formData.role;
  let previousDepartmentId = formData.departmentId;

  // Define fields with translation keys instead of resolved labels
  const fieldsDefinition: Field[] = [
    {
      key: "name",
      labelKey: "employees.form.name_label",
      inputType: "text",
      required: true,
    },
    {
      key: "email",
      labelKey: "employees.form.email_label",
      inputType: "email",
      required: true,
    },
    {
      key: "role",
      labelKey: "employees.form.role_label",
      inputType: "select",
      required: true,
      options: [],
      lovType: "UserRole",
    },
    {
      key: "departmentId",
      labelKey: "employees.form.department_label",
      inputType: "select",
      required: true,
      options: [],
    },
    {
      key: "joiningDate",
      labelKey: "employees.form.joining_date_label",
      inputType: "date",
      required: true,
    },
    {
      key: "phone",
      labelKey: "employees.form.phone_label",
      inputType: "tel",
      required: false,
    },
    {
      key: "location",
      labelKey: "employees.form.location_label",
      inputType: "select",
      options: [],
      required: false,
    },
    {
      key: "biometricId",
      labelKey: "employees.form.biometric_id_label",
      inputType: "text",
      required: true,
    },
    {
      key: "emergencyContact",
      labelKey: "employees.form.emergency_contact_label",
      inputType: "tel",
      required: false,
    },
    {
      key: "address",
      labelKey: "employees.form.address_label",
      inputType: "textarea",
      required: false,
    },
    {
      key: "bloodGroup",
      labelKey: "employees.form.blood_group_label",
      inputType: "select",
      options: [],
      required: false,
    },
    {
      key: "dateOfBirth",
      labelKey: "employees.form.date_of_birth_label",
      inputType: "date",
      required: false,
    },
    {
      key: "managerId",
      labelKey: "employees.form.manager_label",
      inputType: "manager-lookup",
      required: true,
    },
  ];

  // Make fields reactive to language changes
  $: fields = fieldsDefinition.map((field) => ({
    ...field,
    label: $t(field.labelKey),
  }));

  async function fetchManagers(role: string, departmentId: string) {
    try {
      if (!role || !departmentId) {
        managerOptions = [];
        if (formData.managerId) {
          formData.managerId = "";
        }
        return;
      }

      managerLookupLoading = true;
      let response;

      if (role === "admin") {
        response = await employeesApi.getUserByRoleDepartment(
          "admin",
          "management"
        );
        managers =
          response.success && Array.isArray(response.data) ? response.data : [];
      } else if (role === "manager") {
        response = await employeesApi.getUserByRoleDepartment(
          "admin",
          departmentId
        );
        managers =
          response.success && Array.isArray(response.data) ? response.data : [];

        if (managers.length === 0) {
          response = await employeesApi.getUserByRoleDepartment(
            "admin",
            "management"
          );
          managers =
            response.success && Array.isArray(response.data)
              ? response.data
              : [];
        }

        if (managers.length === 0) {
          response = await employeesApi.getRoles("admin");
          managers =
            response.success && Array.isArray(response.data)
              ? response.data
              : [];
        }
      } else if (role === "staff") {
        response = await employeesApi.getUserByRoleDepartment(
          "manager",
          departmentId
        );
        managers =
          response.success && Array.isArray(response.data) ? response.data : [];

        if (managers.length === 0) {
          response = await employeesApi.getRoles("manager");
          managers =
            response.success && Array.isArray(response.data)
              ? response.data
              : [];
        }

        if (managers.length === 0) {
          response = await employeesApi.getRoles("admin");
          managers =
            response.success && Array.isArray(response.data)
              ? response.data
              : [];
        }
      } else {
        managerOptions = [];
        return;
      }
      console.log(response, "response**");
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
      errors["managerId"] = $t("employees.form.errors.manager_load_failed");
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
            : field.key === "departmentId"
              ? userDepartments
              : field.options,
  }));

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

      const departmentResponse: any = await lovsApi.getByType("department");
      console.log(departmentResponse, "departmentResponse");
      if (departmentResponse.success) {
        userDepartments = departmentResponse.data.values.map((dept: any) => ({
          label: dept.label,
          value: dept.value,
        }));
      }

      if (formData.role && formData.departmentId) {
        await fetchManagers(formData.role, formData.departmentId);
      }
    } catch (error) {
      console.error("Error fetching LOVs:", error);
    }
  });

  $: {
    if (
      formData.role !== previousRole ||
      formData.departmentId !== previousDepartmentId
    ) {
      previousRole = formData.role;
      previousDepartmentId = formData.departmentId;
      formData.managerId = "";
      if (formData.role && formData.departmentId) {
        fetchManagers(formData.role, formData.departmentId);
      } else {
        managerOptions = [];
      }
    }
  }

  const convertToDateTimeFormat = (dateInput: string | Date): string => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date input: ${dateInput}`);
      return new Date().toISOString();
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

  const prepareEmployeePayload = (formData: EmployeeFormData) => {
    const payload = {
      ...formData,
      joiningDate: formData.joiningDate
        ? convertToDateTimeFormat(formData.joiningDate)
        : null,
      dateOfBirth: formData.dateOfBirth
        ? convertToDateTimeFormat(formData.dateOfBirth)
        : null,
      active:
        formData.active !== undefined ? String(formData.active) : undefined,
    };

    if (mode === "create") {
      payload.password = "123456";
    }

    if (mode === "update" && initialValues._id) {
      payload._id = initialValues._id;
    }

    console.log(`Payload for ${mode}:`, payload);
    return payload;
  };

  function validateDOB(date: string): boolean {
    const selectedDate = new Date(date);
    const today = new Date();
    return selectedDate <= today;
  }

  function validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  }

  $: {
    errors = {};
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      errors.phone = $t("employees.form.errors.invalid_phone", {
        label: $t("employees.form.phone_label"),
      });
    } else {
      delete errors.phone;
    }

    if (
      formData.emergencyContact &&
      !validatePhoneNumber(formData.emergencyContact)
    ) {
      errors.emergencyContact = $t("employees.form.errors.invalid_phone", {
        label: $t("employees.form.emergency_contact_label"),
      });
    } else {
      delete errors.emergencyContact;
    }

    if (formData.dateOfBirth && !validateDOB(formData.dateOfBirth)) {
      errors.dateOfBirth = $t("employees.form.errors.invalid_dob");
    } else {
      delete errors.dateOfBirth;
    }

    formValid = Object.keys(errors).length === 0;
  }

  const handleSubmit = async () => {
    errors = {};

    for (const field of fields) {
      if (field.required && !formData[field.key]) {
        errors[field.key] = $t("employees.form.errors.required_field", {
          label: field.label,
        });
      }
    }

    if (Object.keys(errors).length > 0) {
      return;
    }

    loading = true;

    try {
      console.log(`Submitting form in ${mode} mode with data:`, formData);
      const employeePayload = prepareEmployeePayload(formData);

      if (mode === "create") {
        dispatch("submit", employeePayload);
      } else {
        dispatch("update", employeePayload);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      errors.submit =
        mode === "create"
          ? $t("employees.form.errors.submit_create_failed")
          : $t("employees.form.errors.submit_update_failed");
    } finally {
      loading = false;
    }
  };

  const handleCancel = () => {
    dispatch("cancel");
  };

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
            <option value=""
              >{$t("employees.form.select_placeholder", {
                label: $t("employees.form.role_label"),
              })}</option
            >
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
            on:change={handleChange}
            required={field.required}
            disabled={managerLookupLoading}
            class:input-error={errors[field.key]}
          >
            <option value="">
              {managerLookupLoading
                ? $t("employees.form.loading_managers_message")
                : $t("employees.form.select_manager_placeholder")}
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
      {$t("employees.form.cancel_button")}
    </button>
    <button
      type="submit"
      class="btn btn-primary"
      disabled={!formValid || loading}
    >
      {loading
        ? mode === "create"
          ? $t("employees.form.submit_button_saving")
          : $t("employees.form.submit_button_updating")
        : mode === "create"
          ? $t("employees.form.submit_button_create")
          : $t("employees.form.submit_button_update")}
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
