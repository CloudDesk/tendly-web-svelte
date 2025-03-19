<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { writable } from "svelte/store";
  import type { SalaryStructure } from "$lib/types";
  import { salaryStructureApi } from "$lib/services/api/salaryStructure";

  // TypeScript interfaces
  interface Field {
    key: string;
    label: string;
    type: "number" | "date" | "checkbox" | "text" | "lookup";
    required: boolean;
    disabled?: boolean;
    value: any;
    error?: string | null;
    min?: number;
    validationRules?: ((value: any) => string | null)[];
    displayValue?: string;
  }
  type ValidationRule = (value: any) => string | null;

  export let employeeId: string;
  export let data: any = null;
  export let readOnly: boolean = false;
  const dispatch = createEventDispatcher<{
    submit: any;
    cancel: void;
  }>();
  const salaryStructures = writable<SalaryStructure[]>([]);
  const selectedSalaryStructure = writable<SalaryStructure | null>(null);
  console.log(data);
  onMount(async () => {
    let result: any = await salaryStructureApi.list();
    console.log(result, "result");
    if (result.success && Array.isArray(result.data)) {
      salaryStructures.set(result.data);
    }
  });

  // Validation rules
  const numberValidation: ValidationRule = (value: number): string | null => {
    if (value < 0) return "Value must be 0 or greater";
    return null;
  };

  const requiredValidation: ValidationRule = (value: any): string | null => {
    if (value === null || value === undefined || value === "") {
      return "This field is required";
    }
    return null;
  };

  const greaterThanZeroValidation: ValidationRule = (
    value: number
  ): string | null => {
    if (value <= 0) return "Value must be greater than 0";
    return null;
  };

  // Field configurations with initial values and validation
  let fields: Field[] = [
    {
      key: "salaryStructureId",
      label: "Salary Structure",
      type: "lookup",
      required: true,
      value: null,
      validationRules: [requiredValidation],
    },
    {
      key: "monthlyGross",
      label: "Monthly Gross",
      type: "number",
      required: true,
      value: 0,
      validationRules: [
        requiredValidation,
        numberValidation,
        greaterThanZeroValidation,
      ],
    },
    {
      key: "reimbursement",
      label: "Reimbursement",
      type: "number",
      required: false,
      value: 0,
      validationRules: [numberValidation],
    },
    {
      key: "monthlyInsurance",
      label: "Monthly Insurance",
      type: "number",
      required: false,
      value: 0,
      validationRules: [numberValidation],
    },
    {
      key: "effectiveFrom",
      label: "Effective From",
      type: "date",
      required: true,
      value: new Date().toISOString().split("T")[0],
      validationRules: [requiredValidation],
    },
    {
      key: "effectiveTo",
      label: "Effective To",
      type: "date",
      required: true,
      value: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
      validationRules: [requiredValidation],
    },
    {
      key: "isActive",
      label: "Active",
      type: "checkbox",
      required: false,
      value: false,
    },
  ];

  // Validate field
  const validateField = (field: Field): string | null => {
    if (!field.validationRules) return null;

    let error: string | null = null;

    // Type guard for number fields
    if (field.type === "number") {
      const numericValue =
        typeof field.value === "string"
          ? parseCurrency(field.value)
          : field.value;

      for (const rule of field.validationRules) {
        error = rule(numericValue);
        if (error) break;
      }
    } else {
      // For non-numeric fields
      for (const rule of field.validationRules) {
        error = rule(field.value);
        if (error) break;
      }
    }

    return error;
  };

  const scrollToError = () => {
    setTimeout(() => {
      const firstErrorElement = document.querySelector(".error");
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else {
        // If no error elements found, scroll to top of form
        const formElement = document.querySelector("form");
        if (formElement) {
          formElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, 100); // Small delay to ensure DOM is updated
  };

  // Validate all fields
  const validateForm = (): boolean => {
    let isValid = true;

    fields = fields.map((field) => {
      const error = validateField(field);
      if (error) {
        isValid = false;
        return { ...field, error };
      }
      return { ...field, error: null };
    });
    if (!isValid) {
      scrollToError();
    }
    return isValid;
  };

  // Formatter for currency display
  const formatCurrency = (value: number): string => {
    return `₹${value.toLocaleString("en-IN")}`;
  };

  // Function to parse currency string back to number
  const parseCurrency = (value: string): number => {
    return Number(value.replace(/[₹,]/g, ""));
  };

  // Handle input changes with currency formatting
  const handleInputChange = (field: Field, event: Event) => {
    const input = event.target as HTMLInputElement;
    if (field.type === "number") {
      const numericValue = parseCurrency(input.value);
      field.value = numericValue;
      field.displayValue = formatCurrency(numericValue);
      field.error = validateField(field);
    } else {
      field.value = input.value;
      field.error = validateField(field);
    }
  };

  // Handle lookup selection
  const handleLookupSelect = (field: Field, event: Event) => {
    let value = (event.target as HTMLInputElement).value;
    field.value = value;
    field.error = validateField(field);
  };

  onMount(() => {
    if (data) {
      fields = fields.map((field) => {
        let value;
        let displayValue;

        if (field.key === "effectiveFrom" || field.key === "effectiveTo") {
          value = new Date(data[field.key]).toISOString().split("T")[0];
        } else if (field.type === "number") {
          value = data[field.key];
          displayValue = formatCurrency(data[field.key]);
        } else {
          value = data[field.key];
        }

        return {
          ...field,
          value,
          displayValue,
        };
      });
    } else {
      const userIdField = fields.find((f) => f.key === "userId");
      if (userIdField) {
        userIdField.value = employeeId;
      }
    }
  });

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const formData = fields.reduce(
      (acc, field) => {
        acc[field.key] = field.value;
        return acc;
      },
      {} as Record<string, any>
    );

    // Add the `_id` field for existing records
    if (data && data._id) {
      formData._id = data._id;
    }
    formData.employeeId = employeeId;
    console.log(formData, "handleSubmit");
    dispatch("submit", formData);
  };

  const handleCancel = () => {
    dispatch("cancel");
  };
</script>

<div class="p-6 bg-white shadow-md rounded-lg max-h-screen overflow-y-auto">
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <!-- Salary Input Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each fields as field (field.key)}
        <div class="form-control">
          <label class="label" for={field.key}
            >{field.label}
            {#if field.required}
              <span class="text-red-500 ml-1">*</span>
            {/if}
          </label>
          {#if field.type === "checkbox"}
            <label class="switch">
              <input
                id={field.key}
                type="checkbox"
                bind:checked={field.value}
                disabled={field.disabled || readOnly}
              />
              <span class="slider round"></span>
            </label>
          {:else if field.type === "number"}
            <input
              id={field.key}
              type="text"
              class="input input-bordered"
              class:error={field.error}
              value={field.displayValue || formatCurrency(field.value || 0)}
              on:input={(e) => handleInputChange(field, e)}
              required={field.required}
              disabled={field.disabled || readOnly}
            />
          {:else if field.type === "date"}
            <input
              id={field.key}
              type="date"
              class="input input-bordered"
              class:error={field.error}
              bind:value={field.value}
              required={field.required}
              disabled={field.disabled || readOnly}
            />
          {:else if field.type === "lookup"}
            <select
              id={field.key}
              class="input input-bordered"
              class:error={field.error}
              bind:value={field.value}
              required={field.required}
              disabled={field.disabled || readOnly}
              on:change={(e) => {
                handleLookupSelect(field, e);
              }}
            >
              <option value="" disabled selected>Select Salary Structure</option
              >
              {#each $salaryStructures as structure}
                <option value={structure._id}>{structure.name}</option>
              {/each}
            </select>
          {:else}
            <input
              id={field.key}
              type="text"
              class="input input-bordered"
              class:error={field.error}
              bind:value={field.value}
              required={field.required}
              disabled={field.disabled || readOnly}
            />
          {/if}
          {#if field.error}
            <span class="error-message">{field.error}</span>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Form Buttons -->
    <div class="flex items-center justify-end gap-6 mt-6">
      <div class="flex gap-2">
        <button type="button" class="btn btn-ghost" on:click={handleCancel}>
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" disabled={readOnly}>
          Submit
        </button>
      </div>
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

  .input.error {
    border-color: #ef4444;
  }

  .error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
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

  .switch {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 20px;
    margin-left: 8px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 34px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #3b82f6;
  }

  input:checked + .slider:before {
    transform: translateX(14px);
  }

  .slider.round {
    border-radius: 34px;
  }

  .slider.round:before {
    border-radius: 50%;
  }
</style>
