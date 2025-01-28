<script lang="ts">
  import { toUTCDate, toDate } from '$lib/utils/date';
  import { createEventDispatcher, onMount } from 'svelte';
  import type { SalaryStructure } from '$lib/types';

  // TypeScript interfaces
  interface Field {
    key: string;
    label: string;
    type: 'number' | 'date' | 'checkbox' | 'text';
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
  export let salaryStructure: SalaryStructure | null = null;
  export let readOnly: boolean = false;
  const dispatch = createEventDispatcher<{
    submit: SalaryStructure;
    cancel: void;
  }>();

  // Validation rules
  const numberValidation:ValidationRule = (value: number): string | null => {
    if (value < 0) return 'Value must be 0 or greater';
    return null;
  };

  const requiredValidation:ValidationRule = (value: any): string | null => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  };

  const greaterThanZeroValidation: ValidationRule = (value: number): string | null => {
    if (value <= 0) return 'Value must be greater than 0';
    return null;
  };

  // Field configurations with initial values and validation
  let fields: Field[] = [
    {
      key: 'basic',
      label: 'Basic',
      type: 'number',
      required: true,
      value: 0,
      validationRules: [requiredValidation, numberValidation, greaterThanZeroValidation],
    },
    {
      key: 'hra',
      label: 'HRA',
      type: 'number',
      required: true,
      value: 0,
      validationRules: [requiredValidation, numberValidation, greaterThanZeroValidation],
    },
    {
      key: 'specialAllowance',
      label: 'Special Allowance',
      type: 'number',
      required: false,
      value: 0,
      validationRules: [numberValidation],
    },
    {
      key: 'conveyanceAllowance',
      label: 'Conveyance Allowance',
      type: 'number',
      required: false,
      value: 0,
      validationRules: [numberValidation],
    },
    {
      key: 'medicalAllowance',
      label: 'Medical Allowance',
      type: 'number',
      required: false,
      value: 0,
      validationRules: [numberValidation],
    },
    {
      key: 'lta',
      label: 'LTA',
      type: 'number',
      required: false,
      value: 0,
      validationRules: [numberValidation],
    },
    {
      key: 'variablePay',
      label: 'Variable Pay',
      type: 'number',
      required: false,
      value: 0,
      validationRules: [numberValidation],
    },
    {
      key: 'effectiveFrom',
      label: 'Effective From',
      type: 'date',
      required: true,
      value: new Date().toISOString().split('T')[0],
      validationRules: [requiredValidation],
    },
    {
      key: 'effectiveTo',
      label: 'Effective To',
      type: 'date',
      required: true,
      value: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      validationRules: [requiredValidation],
    },
    {
      key: 'pfDeduction',
      label: 'PF Deduction',
      type: 'number',
      required: false,
      disabled: true,
      value: 0,
    },
    {
      key: 'incomeTaxDeduction',
      label: 'Income Tax Deduction',
      type: 'number',
      required: false,
      disabled: true,
      value: 0,
    },
    {
      key: 'pfEmployerContribution',
      label: 'PF Employer Contribution',
      type: 'number',
      required: false,
      disabled: true,
      value: 0,
    },
    {
      key: 'gratuity',
      label: 'Gratuity',
      type: 'number',
      required: false,
      disabled: true,
      value: 0,
    },
    {
      key: 'grossSalary',
      label: 'Gross Salary',
      type: 'number',
      required: false,
      disabled: true,
      value: 0,
    },
    {
      key: 'netSalary',
      label: 'Net Salary',
      type: 'number',
      required: false,
      disabled: true,
      value: 0,
    },
    {
      key: 'ctc',
      label: 'CTC',
      type: 'number',
      required: false,
      disabled: true,
      value: 0,
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'checkbox',
      required: false,
      value: false,
    },
  ];

  // Validate field
  const validateField = (field: Field): string | null => {
    if (!field.validationRules) return null;
    
    let error: string | null = null;
    
    // Type guard for number fields
    if (field.type === 'number') {
      const numericValue = typeof field.value === 'string' 
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
      const firstErrorElement = document.querySelector('.error');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // If no error elements found, scroll to top of form
        const formElement = document.querySelector('form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100); // Small delay to ensure DOM is updated
  };
  // Validate all fields
  const validateForm = (): boolean => {
    let isValid = true;
    
    fields = fields.map(field => {
      const error = validateField(field);
      if (error) {
        isValid = false;
        return { ...field, error };
      }
      return { ...field, error: null };
    });
    if(!isValid) {
      scrollToError();
    }
    return isValid;
  };

  // Formatter for currency display
  const formatCurrency = (value: number): string => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Function to parse currency string back to number
  const parseCurrency = (value: string): number => {
    return Number(value.replace(/[₹,]/g, ''));
  };

  // Calculation formulas for display
  const calculationFormulas = [
    {
      label: 'Gross Salary',
      formula: 'Basic + HRA + Special Allowance + Conveyance Allowance + Medical Allowance + LTA + Variable Pay'
    },
    {
      label: 'PF Deduction',
      formula: 'Basic × 12%'
    },
    {
      label: 'PF Employer Contribution',
      formula: 'Basic × 12%'
    },
    {
      label: 'Gratuity',
      formula: 'Basic × 4.81%'
    },
    {
      label: 'Net Salary',
      formula: 'Gross Salary - (PF Deduction + Income Tax Deduction)'
    },
    {
      label: 'CTC (Annual)',
      formula: '(Gross Salary + PF Employer Contribution + Gratuity) × 12'
    }
  ];

  // Calculate salary components
  const calculateSalaryComponents = () => {
    const getFieldValue = (key: string): number => {
      const field = fields.find(f => f.key === key);
      return Math.round(parseFloat(field?.value) || 0);
    };

    const basic = getFieldValue('basic');
    const hra = getFieldValue('hra');
    const conveyanceAllowance = getFieldValue('conveyanceAllowance');
    const medicalAllowance = getFieldValue('medicalAllowance');
    const specialAllowance = getFieldValue('specialAllowance');
    const lta = getFieldValue('lta');
    const variablePay = getFieldValue('variablePay');

    // Update calculated fields with proper formatting
    fields = fields.map(field => {
      let numericValue = 0;
      
      switch (field.key) {
        case 'pfDeduction':
          numericValue = Math.round(basic * 0.12);
          break;
        case 'pfEmployerContribution':
          numericValue = Math.round(basic * 0.12);
          break;
        case 'gratuity':
          numericValue = Math.round(basic * 0.0481);
          break;
        case 'grossSalary':
          numericValue = basic + hra + conveyanceAllowance + medicalAllowance + 
                        specialAllowance + lta + variablePay;
          break;
        case 'netSalary':
          const pfDeduction = getFieldValue('pfDeduction');
          const incomeTaxDeduction = getFieldValue('incomeTaxDeduction');
          numericValue = getFieldValue('grossSalary') - (pfDeduction + incomeTaxDeduction);
          break;
        case 'ctc':
          const grossSalary = getFieldValue('grossSalary');
          const pfEmployerContribution = getFieldValue('pfEmployerContribution');
          const gratuity = getFieldValue('gratuity');
          numericValue = Math.round((grossSalary + pfEmployerContribution + gratuity) * 12);
          break;
        default:
          numericValue = field.value || 0;
      }

      return {
        ...field,
        value: numericValue,
        displayValue: field.type === 'number' ? formatCurrency(numericValue) : field.value
      };
    });
  };

  // Handle input changes with currency formatting
  const handleInputChange = (field: Field, event: Event) => {
    const input = event.target as HTMLInputElement;
    if (field.type === 'number') {
      const numericValue = parseCurrency(input.value);
      field.value = numericValue;
      field.displayValue = formatCurrency(numericValue);
      field.error = validateField(field);
    } else {
      field.value = input.value;
      field.error = validateField(field);
    }
    calculateSalaryComponents();
  };

  // Auto-calculate when relevant fields change
  $: {
    const relevantFields = fields.filter(f => 
      ['basic', 'hra', 'conveyanceAllowance', 'medicalAllowance'].includes(f.key)
    );
    if (relevantFields.some(f => f.value !== undefined)) {
      calculateSalaryComponents();
    }
  }

  onMount(() => {
    if (salaryStructure) {
      fields = fields.map(field => {
        const value =
          field.key === 'effectiveFrom' || field.key === 'effectiveTo'
            ? toDate(salaryStructure[field.key as keyof SalaryStructure] as string | undefined)
            : salaryStructure[field.key as keyof SalaryStructure];
        return {
          ...field,
          value,
        };
      });
    } else {
      const userIdField = fields.find(f => f.key === 'userId');
      if (userIdField) {
        userIdField.value = employeeId;
      }
    }
  });

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const formData = fields.reduce((acc, field) => {
      if (field.key === 'effectiveFrom' || field.key === 'effectiveTo') {
        acc[field.key] = field.value ? toUTCDate(field.value) : null;
      } else {
        acc[field.key] = field.value;
      }
      return acc;
    }, {} as Record<string, any>);

    // Add the `_id` field for existing records
    if (salaryStructure && salaryStructure._id) {
      formData._id = salaryStructure._id;
    }
    console.log(formData, "handleSubmit");
    dispatch('submit', formData as SalaryStructure);
  };

  const handleCancel = () => {
    dispatch('cancel');
  };
</script>

<div class="p-6 bg-white shadow-md rounded-lg max-h-screen overflow-y-auto">
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <!-- Salary Input Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each fields as field (field.key)}
        <div class="form-control">
          <label class="label" for={field.key}>{field.label}
            {#if field.required}
            <span class="text-red-500 ml-1">*</span>
          {/if}
          </label>
          {#if field.type === 'checkbox'}
            <label class="switch">
              <input
                id={field.key}
                type="checkbox"
                bind:checked={field.value}
                disabled={field.disabled ||readOnly}
              />
              <span class="slider round"></span>
            </label>
          {:else if field.type === 'number'}
            <input
              id={field.key}
              type="text"
              class="input input-bordered"
              class:error={field.error}
              value={field.displayValue || formatCurrency(0)}
              on:input={(e) => handleInputChange(field, e)}
              required={field.required}
              disabled={field.disabled ||readOnly}
            />
          {:else if field.type === 'date'}
            <input
              id={field.key}
              type="date"
              class="input input-bordered"
              class:error={field.error}
              bind:value={field.value}
              required={field.required}
              disabled={field.disabled ||readOnly}
            />
          {:else}
            <input
              id={field.key}
              type="text"
              class="input input-bordered"
              class:error={field.error}
              bind:value={field.value}
              required={field.required}
              disabled={field.disabled ||readOnly}
            />
          {/if}
          {#if field.error}
            <span class="error-message">{field.error}</span>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Calculation Formulas Section  -->
    <div class="mt-8 p-4 bg-gray-50 rounded-lg">
      <h3 class="text-lg font-semibold mb-4">Calculation Formulas</h3>
      <div class="space-y-2">
        {#each calculationFormulas as formula}
          <div class="flex flex-col">
            <span class="font-medium">{formula.label}:</span>
            <span class="text-sm text-gray-600">{formula.formula}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Form Buttons -->
    <div class="flex items-center justify-end gap-6 mt-6">
      <div class="flex gap-2">
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
          disabled={readOnly}
        >
          Submit
        </button>
      </div>
    </div>
  </form>
</div>

<style>
  .calculation-section {
    background-color: #f9fafb;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-top: 1.5rem;
  }

  .formula-item {
    margin-bottom: 0.5rem;
  }

  .formula-label {
    font-weight: 500;
    color: #374151;
  }

  .formula-text {
    color: #6b7280;
    font-size: 0.875rem;
  }

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
    transition: .4s;
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
    transition: .4s;
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
