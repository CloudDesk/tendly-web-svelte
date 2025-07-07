<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import Modal from '../common/Modal.svelte';
  import InfoBanner from '../common/InfoBanner.svelte';
  import FileUpload from '../common/FileUpload.svelte';
  import Button from '../common/Button.svelte';

  export let open = false;
  export let taxDeclaration: any;
  export let form12B: any = null; // for edit, optional

  const dispatch = createEventDispatcher();

  // Prefill fields for edit, or set defaults for create
  let employeeId = '';
  let financialYear = '';
  let previousEmployer = { name: '', pan: '', tan: '' };
  let employmentPeriod = { startDate: '', endDate: '' };
  let salaryEarned: number | '' = '';
  let tdsDeducted: number | '' = '';
  let documents: File[] = [];

  // Validation errors and touched state
  let errors: Record<string, string> = {};
  let touched = {
    prevName: false,
    prevPan: false,
    prevTan: false,
    startDate: false,
    endDate: false,
    salaryEarned: false,
    tdsDeducted: false
  };

  // Date logic
  let fyStart = '';
  let fyEnd = '';
  let joiningDate = '';
  $: {
    if (taxDeclaration?.financialYear) {
      // Assume FY format is '2023-24'
      const [startYear] = taxDeclaration.financialYear.split('-');
      fyStart = `${startYear}-04-01`;
      fyEnd = `${+startYear + 1}-03-31`;
    }
    joiningDate = taxDeclaration?.joiningDate ? taxDeclaration.joiningDate.slice(0, 10) : '';
  }

  // End date min: 1 month after startDate
  function addOneMonth(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }

  $: endDateMin = addOneMonth(employmentPeriod.startDate);
  $: endDateMax = joiningDate || fyEnd || new Date().toISOString().slice(0, 10);

  // PAN and TAN regex
  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;

  onMount(() => {
    if (taxDeclaration) {
      employeeId = taxDeclaration.employeeId || '';
      financialYear = taxDeclaration.financialYear || '';
    }
    if (form12B) {
      previousEmployer = { ...form12B.previousEmployer };
      employmentPeriod = { ...form12B.employmentPeriod };
      salaryEarned = form12B.salaryEarned;
      tdsDeducted = form12B.tdsDeducted;
      // Documents: skip for edit (handled separately)
    }
  });

  function validate() {
    errors = {};
    if (!previousEmployer.name) errors.prevName = 'Required';
    if (!previousEmployer.pan) errors.prevPan = 'Required';
    else if (!PAN_REGEX.test(previousEmployer.pan)) errors.prevPan = 'Invalid PAN format (e.g. ABCFU1234D)';
    if (!previousEmployer.tan) errors.prevTan = 'Required';
    else if (!TAN_REGEX.test(previousEmployer.tan)) errors.prevTan = 'Invalid TAN format (e.g. ABCD12345E)';
    if (!employmentPeriod.startDate) errors.startDate = 'Required';
    if (!employmentPeriod.endDate) errors.endDate = 'Required';
    if (
      employmentPeriod.startDate &&
      (employmentPeriod.startDate < fyStart || (joiningDate && employmentPeriod.startDate > joiningDate))
    ) {
      errors.startDate = `Start date must be between FY start and joining date`;
    }
    if (
      employmentPeriod.endDate &&
      (employmentPeriod.endDate < endDateMin || (joiningDate && employmentPeriod.endDate > joiningDate))
    ) {
      errors.endDate = `End date must be at least 1 month after start and before joining date`;
    }
    if (!salaryEarned && salaryEarned !== 0) errors.salaryEarned = 'Required';
    if (!tdsDeducted && tdsDeducted !== 0) errors.tdsDeducted = 'Required';
    if (!documents || documents.length === 0) errors.documents = 'Proof document is required';
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!validate()) return;
    dispatch('submit', {
      employeeId,
      financialYear,
      previousEmployer,
      employmentPeriod,
      salaryEarned: Number(salaryEarned),
      tdsDeducted: Number(tdsDeducted),
      documents
    });
    reset();
  }

  function reset() {
    previousEmployer = { name: '', pan: '', tan: '' };
    employmentPeriod = { startDate: '', endDate: '' };
    salaryEarned = '';
    tdsDeducted = '';
    documents = [];
    errors = {};
    touched = {
      prevName: false,
      prevPan: false,
      prevTan: false,
      startDate: false,
      endDate: false,
      salaryEarned: false,
      tdsDeducted: false
    };
  }

  function handleCancel() {
    reset();
    dispatch('cancel');
  }

  function handleFileUpload(event: CustomEvent<{ files: File[] }>) {
    documents = event.detail.files;
    validate();
  }

  // Auto-uppercase PAN
  function handlePanInput(e: Event) {
    const input = e.target as HTMLInputElement;
    previousEmployer.pan = input.value.toUpperCase();
    touched.prevPan = true;
    validate();
  }

  // TAN input: auto-uppercase
  function handleTanInput(e: Event) {
    const input = e.target as HTMLInputElement;
    previousEmployer.tan = input.value.toUpperCase();
    touched.prevTan = true;
    validate();
  }

  // Helper: format number as Indian Rupees string
  function formatRupees(val: number | string) {
    if (val === '' || val === null || val === undefined) return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-IN');
  }

  // Salary Earned input state
  let salaryEarnedDisplay = '';
  let salaryEarnedFocused = false;
  $: salaryEarnedDisplay = salaryEarnedFocused ? (salaryEarned === '' ? '' : String(salaryEarned)) : formatRupees(salaryEarned);

  function handleSalaryInput(e: Event) {
    const val = (e.target as HTMLInputElement).value.replace(/,/g, '');
    salaryEarned = val === '' ? '' : Number(val);
    touched.salaryEarned = true;
    validate();
  }

  function handleSalaryFocus() {
    salaryEarnedFocused = true;
  }
  function handleSalaryBlur() {
    salaryEarnedFocused = false;
  }

  // TDS Deducted input state
  let tdsDeductedDisplay = '';
  let tdsDeductedFocused = false;
  $: tdsDeductedDisplay = tdsDeductedFocused ? (tdsDeducted === '' ? '' : String(tdsDeducted)) : formatRupees(tdsDeducted);

  function handleTdsInput(e: Event) {
    const val = (e.target as HTMLInputElement).value.replace(/,/g, '');
    tdsDeducted = val === '' ? '' : Number(val);
    touched.tdsDeducted = true;
    validate();
  }

  function handleTdsFocus() {
    tdsDeductedFocused = true;
  }
  function handleTdsBlur() {
    tdsDeductedFocused = false;
  }
</script>

<Modal show={open} title={form12B ? 'Edit Previous Employment (Form 12B)' : 'Add Previous Employment (Form 12B)'} onClose={handleCancel}>
  <div class="bg-white rounded-2xl p-2 max-w-3xl mx-auto">
    <InfoBanner type="warning" dismissible={false}>
      You can upload Form 12B only once. Please verify all details before submitting.
    </InfoBanner>
    <form on:submit|preventDefault={handleSubmit} class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label class="block font-medium mb-1">Employee ID</label>
          <input class="input bg-gray-100" value={employeeId} readonly />
        </div>
        <div>
          <label class="block font-medium mb-1">Financial Year</label>
          <input class="input bg-gray-100" value={financialYear} readonly />
        </div>
        <div>
          <label class="block font-medium mb-1">Previous Employer Name <span class="text-red-500">*</span></label>
          <input class="input" bind:value={previousEmployer.name} required
            on:blur={() => touched.prevName = true}
            on:input={() => { touched.prevName = true; validate(); }}
            class:error={touched.prevName && errors.prevName}
          />
          {#if touched.prevName && errors.prevName}<span class="text-red-500 text-xs">{errors.prevName}</span>{/if}
        </div>
        <div>
          <label class="block font-medium mb-1">Previous Employer PAN <span class="text-red-500">*</span></label>
          <input class="input" bind:value={previousEmployer.pan} required
            on:blur={() => touched.prevPan = true}
            on:input={handlePanInput}
            class:error={touched.prevPan && errors.prevPan}
            maxlength="10"
            autocomplete="off"
          />
          {#if touched.prevPan && errors.prevPan}<span class="text-red-500 text-xs">{errors.prevPan}</span>{/if}
        </div>
        <div>
          <label class="block font-medium mb-1">Previous Employer TAN <span class="text-red-500">*</span></label>
          <input class="input" bind:value={previousEmployer.tan} required
            on:blur={() => touched.prevTan = true}
            on:input={handleTanInput}
            class:error={touched.prevTan && errors.prevTan}
            maxlength="10"
            autocomplete="off"
          />
          {#if touched.prevTan && errors.prevTan}<span class="text-red-500 text-xs">{errors.prevTan}</span>{/if}
        </div>
        <div class="flex flex-col gap-2">
          <label class="block font-medium mb-1">Employment Start Date <span class="text-red-500">*</span></label>
          <input type="date" class="input" bind:value={employmentPeriod.startDate} required
            min={fyStart} max={joiningDate}
            on:blur={() => touched.startDate = true}
            on:input={() => { touched.startDate = true; validate(); }}
            class:error={touched.startDate && errors.startDate}
          />
          <span class="text-xs text-gray-500">Between {fyStart} and {joiningDate || fyEnd}</span>
          {#if touched.startDate && errors.startDate}<span class="text-red-500 text-xs">{errors.startDate}</span>{/if}
        </div>
        <div class="flex flex-col gap-2">
          <label class="block font-medium mb-1">Employment End Date <span class="text-red-500">*</span></label>
          <input type="date" class="input" bind:value={employmentPeriod.endDate} required
            min={endDateMin} max={endDateMax}
            on:blur={() => touched.endDate = true}
            on:input={() => { touched.endDate = true; validate(); }}
            class:error={touched.endDate && errors.endDate}
          />
          <span class="text-xs text-gray-500">At least 1 month after start date, before {joiningDate || fyEnd}</span>
          {#if touched.endDate && errors.endDate}<span class="text-red-500 text-xs">{errors.endDate}</span>{/if}
        </div>
        <div>
          <label class="block font-medium mb-1">Salary Earned (Rs) <span class="text-red-500">*</span></label>
          <input type="text" class="input" inputmode="numeric" pattern="[0-9,]*" required min="0"
            value={salaryEarnedDisplay}
            on:focus={handleSalaryFocus}
            on:blur={() => { handleSalaryBlur(); touched.salaryEarned = true; validate(); }}
            on:input={handleSalaryInput}
            class:error={touched.salaryEarned && errors.salaryEarned}
          />
          {#if touched.salaryEarned && errors.salaryEarned}<span class="text-red-500 text-xs">{errors.salaryEarned}</span>{/if}
        </div>
        <div>
          <label class="block font-medium mb-1">TDS Deducted (Rs) <span class="text-red-500">*</span></label>
          <input type="text" class="input" inputmode="numeric" pattern="[0-9,]*" required min="0"
            value={tdsDeductedDisplay}
            on:focus={handleTdsFocus}
            on:blur={() => { handleTdsBlur(); touched.tdsDeducted = true; validate(); }}
            on:input={handleTdsInput}
            class:error={touched.tdsDeducted && errors.tdsDeducted}
          />
          {#if touched.tdsDeducted && errors.tdsDeducted}<span class="text-red-500 text-xs">{errors.tdsDeducted}</span>{/if}
        </div>
        <div class="md:col-span-2">
          <label class="block font-medium mb-1">Form 12BB from Previous Employer (Form 16 or Payslip) <span class="text-red-500">*</span> <span class="text-xs text-gray-500">(Submit proof previous employer 12BB)</span></label>
          <FileUpload accept=".pdf" maxFiles={1} maxSize={5*1024*1024} on:upload={handleFileUpload} label="Upload Form 12BB/16/Payslip" description="Upload a single PDF file from your previous employer. Max 1 file, 5MB." />
          <span class="text-xs text-gray-500">Accepted: PDF only. Max 1 file, 5MB.</span>
          {#if touched.prevTan && errors.documents}<span class="text-red-500 text-xs">{errors.documents}</span>{/if}
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-8">
        <Button type="secondary" on:click={handleCancel}>Cancel</Button>
        <Button type="primary" as="submit">{form12B ? 'Update' : 'Submit'}</Button>
      </div>
    </form>
  </div>
</Modal>

<style>
  .input {
    @apply border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all bg-white shadow-sm;
  }
  .input.error {
    @apply border-red-400 ring-1 ring-red-300 bg-red-50;
  }
  form {
    @apply bg-transparent;
  }
</style> 