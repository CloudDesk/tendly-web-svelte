<script>
  import { taxstates, professionalTaxs } from "$lib/constants/users";
  import sl from "date-fns/locale/sl";
  import { createEventDispatcher } from "svelte";

  export let initialData = null;
  export let readOnly = false;

  const dispatch = createEventDispatcher();

  let formErrors = {
    fixedEarnings: {},
    professionalTax: [],
  };

  // Tax term options
  const taxTerms = [
    { value: "monthly", label: "Monthly" },
    { value: "half_yearly", label: "Half Yearly" },
    { value: "yearly", label: "Yearly" },
  ];

  // Initialize form data with all values set to 0 by default
  let formData = {
    name: initialData?.name || "",
    fixedEarnings: {
      basicPercentage: initialData?.fixedEarnings?.basicPercentage || 0,
      hraPercentage: initialData?.fixedEarnings?.hraPercentage || 0,
      daPercentage: initialData?.fixedEarnings?.daPercentage || 0,
      otherAllowancePercentage:
        initialData?.fixedEarnings?.otherAllowancePercentage || 0,
    },
    statutoryDeductions: {
      epf: {
        employeeContribution:
          initialData?.statutoryDeductions?.epf?.employeeContribution || 12,
        employerContribution:
          initialData?.statutoryDeductions?.epf?.employerContribution || 12,
        maxLimit: initialData?.statutoryDeductions?.epf?.maxLimit || 15000,
      },
      esi: {
        employeeContribution:
          initialData?.statutoryDeductions?.esi?.employeeContribution || 0.75,
        employerContribution:
          initialData?.statutoryDeductions?.esi?.employerContribution || 3.25,
        applicabilityLimit:
          initialData?.statutoryDeductions?.esi?.applicabilityLimit || 21000,
      },
      professionalTax: {
        state:
          initialData?.statutoryDeductions?.professionalTax?.state ||
          "Tamil Nadu",
        term:
          initialData?.statutoryDeductions?.professionalTax?.term ||
          "half_yearly",
        slabs: initialData?.statutoryDeductions?.professionalTax?.slabs || [
          { fromAmount: 0, toAmount: 0, taxAmount: 0, errors: {} },
        ],
      },
    },
  };

  // Check if form has any errors
  $: hasErrors =
    Object.keys(formErrors.fixedEarnings).length > 0 ||
    formErrors.professionalTax.length > 0 ||
    !isValidTotal ||
    !formData.name;

  // Validation errors store
  let validationErrors = [];

  function handleSubmit() {
    if (!readOnly) {
      const isValid = validateAllSlabs();
      console.log(isValid, formData);
      if (isValid) {
        dispatch("submit", formData);
      }
    }
  }

  // Input handler for fixed earnings percentages
  function handleFixedEarningsChange(field, event) {
    let value = event.target.value;

    // Remove ALL leading zeros, not just prefix
    if (value.startsWith("0") && value.length > 1 && value[1] !== ".") {
      value = value.replace(/^0+/, "");
    }

    // Convert to number for validation
    const numValue = parseFloat(value) || 0;

    // Validate non-negative and max limit
    if (numValue < 0) {
      formErrors.fixedEarnings[field] = "Amount cannot be negative";
      return;
    } else if (numValue > 100) {
      formErrors.fixedEarnings[field] = "Amount cannot exceed 100";
      return;
    } else {
      delete formErrors.fixedEarnings[field];
    }

    // Update the form data
    formData.fixedEarnings[field] = numValue;
  }

  function addSlabRow() {
    const lastSlab =
      formData.statutoryDeductions.professionalTax.slabs[
        formData.statutoryDeductions.professionalTax.slabs.length - 1
      ];

    const newFromAmount = lastSlab.toAmount ? lastSlab.toAmount + 1 : 0;

    formData.statutoryDeductions.professionalTax.slabs = [
      ...formData.statutoryDeductions.professionalTax.slabs,
      { fromAmount: newFromAmount, toAmount: null, taxAmount: 0, errors: {} },
    ];
    validateAllSlabs();
  }

  function handleFromAmountChange(index, value) {
    value = value.replace(/^0+/, "") || "0";
    const newValue = parseInt(value) || 0;
    formData.statutoryDeductions.professionalTax.slabs[index].fromAmount =
      newValue;
    validateAllSlabs();
  }

  function handleToAmountChange(index, value) {
    value = value.replace(/^0+/, "") || "0";
    const newValue = value === "0" ? null : parseInt(value) || null;
    formData.statutoryDeductions.professionalTax.slabs[index].toAmount =
      newValue;
    validateAllSlabs();
  }

  function handletaxAmountChange(index, value) {
    value = value.replace(/^0+/, "") || "0";
    const newValue = parseInt(value) || 0;
    formData.statutoryDeductions.professionalTax.slabs[index].taxAmount =
      newValue;
    validateAllSlabs();
  }

  function removeSlabRow(index) {
    formData.statutoryDeductions.professionalTax.slabs =
      formData.statutoryDeductions.professionalTax.slabs.filter(
        (_, i) => i !== index
      );
    validateAllSlabs();
  }

  function validateSlab(slab, index, slabs) {
    const errors = {};

    // Validate fromAmount is non-negative
    if (slab.fromAmount < 0) {
      errors.fromAmount = "From Amount must be non-negative";
    }

    if (slab.toAmount !== null && slab.toAmount < 0) {
      errors.toAmount = "Amount cannot be negative";
    }

    if (slab.taxAmount < 0) {
      errors.taxAmount = "Tax amount cannot be negative";
    }

    // Special validation for single slab with default values
    if (
      slabs.length === 1 &&
      slab.fromAmount === 0 &&
      slab.toAmount === 0 &&
      slab.taxAmount === 0
    ) {
      errors.toAmount = "To Amount should be greater than From Amount";
    } else {
      // Regular validation logic for other cases
      // Validate toAmount > fromAmount (except for last slab where toAmount is optional)
      if (slab.toAmount !== null && slab.toAmount <= slab.fromAmount) {
        errors.toAmount = "To Amount must be greater than From Amount";
      }
    }
    // Validate continuity across slabs
    if (index > 0) {
      const prevSlab = slabs[index - 1];
      if (
        prevSlab.toAmount !== null &&
        slab.fromAmount !== prevSlab.toAmount + 1
      ) {
        errors.fromAmount = `From Amount must be ${prevSlab.toAmount + 1}`;
      }
    }

    // Validate toAmount is required except for last slab
    if (index < slabs.length - 1 && slab.toAmount === null) {
      errors.toAmount = "To Amount is required except for last slab";
    }

    // Validate tax amount is non-negative
    if (slab.taxAmount < 0) {
      errors.taxAmount = "Tax amount must be non-negative";
    }

    return errors;
  }

  function validateAllSlabs() {
    const slabs = formData.statutoryDeductions.professionalTax.slabs;
    console.log(slabs, "slabs");
    validationErrors = [];

    // Reset all errors
    slabs.forEach((slab) => (slab.errors = {}));

    // Validate each slab
    slabs.forEach((slab, index) => {
      const errors = validateSlab(slab, index, slabs);
      slab.errors = errors;

      if (Object.keys(errors).length > 0) {
        validationErrors.push({ index, errors });
      }
    });

    return validationErrors.length === 0;
  }

  // Handle Professional Tax amount changes with leading zero removal
  function handleProfessionalTaxChange(index, field, event) {
    let value = event.target.value;

    // Remove leading zeros
    value = value.replace(/^0+/, "") || "0";

    // Convert to number
    const numValue = parseInt(value) || 0;

    // Update the form data
    formData.statutoryDeductions.professionalTax.slabs[index][field] = numValue;

    // Validate the slab
    validateAllSlabs();
  }

  // Validation logic for fixed earnings total
  $: totalEarningsPercentage =
    formData.fixedEarnings.basicPercentage +
    formData.fixedEarnings.hraPercentage +
    formData.fixedEarnings.otherAllowancePercentage;
  // formData.fixedEarnings.daPercentage
  $: isValidTotal = totalEarningsPercentage === 100;

  // Calculate DA as 10% of Basic Salary
  // $: formData.fixedEarnings.daPercentage = formData.fixedEarnings.basicPercentage * 0.10;
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <!-- Name Configuration -->
  <div class="bg-white rounded-md shadow-sm">
    <h3 class="text-base font-medium text-gray-900 mb-3">
      General Information
    </h3>
    <div class="bg-white p-3 rounded shadow-sm">
      <label for="name" class="block text-sm font-medium text-gray-600 mb-1">
        Name
      </label>
      <input
        type="text"
        id="name"
        class="w-full h-9 border border-gray-200 rounded-md px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
        bind:value={formData.name}
        disabled={readOnly}
        required
      />
    </div>
  </div>

  <!-- Fixed Earnings Configuration -->
  <div class="bg-white rounded-md shadow-sm">
    <div class="border-b px-4 py-3">
      <h3 class="text-lg font-medium">Fixed Earnings</h3>
      {#if !isValidTotal && !readOnly}
        <p class="text-red-500 text-sm mt-1">
          Total percentage must equal 100% (current: {totalEarningsPercentage}%)
        </p>
      {/if}
    </div>
    <div class="p-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label
            for="basicPercentage"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Basic Salary (% of Gross)
          </label>
          <input
            type="number"
            id="basicPercentage"
            min="0"
            max="100"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={formData.fixedEarnings.basicPercentage}
            on:input={(e) => handleFixedEarningsChange("basicPercentage", e)}
            disabled={readOnly}
          />
          {#if formErrors.fixedEarnings.basicPercentage}
            <p class="text-red-500 text-xs mt-1">
              {formErrors.fixedEarnings.basicPercentage}
            </p>
          {/if}
          <p class="text-sm text-gray-500 mt-1">
            Typically 40% of Gross Salary
          </p>
        </div>

        <div>
          <label
            for="hraPercentage"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            House Rent Allowance (% of Gross)
          </label>
          <input
            type="number"
            id="hraPercentage"
            min="0"
            max="100"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={formData.fixedEarnings.hraPercentage}
            on:input={(e) => handleFixedEarningsChange("hraPercentage", e)}
            disabled={readOnly}
          />
          {#if formErrors.fixedEarnings.hraPercentage}
            <p class="text-red-500 text-xs mt-1">
              {formErrors.fixedEarnings.hraPercentage}
            </p>
          {/if}
          <p class="text-sm text-gray-500 mt-1">
            Typically 20% of Gross Salary
          </p>
        </div>

        <div>
          <label
            for="daPercentage"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Dearness Allowance (% of Basic)
          </label>
          <input
            type="number"
            id="daPercentage"
            min="0"
            max="100"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={formData.fixedEarnings.daPercentage}
            on:input={(e) => handleFixedEarningsChange("daPercentage", e)}
            disabled={readOnly}
          />
          {#if formErrors.fixedEarnings.daPercentage}
            <p class="text-red-500 text-xs mt-1">
              {formErrors.fixedEarnings.daPercentage}
            </p>
          {/if}
          <p class="text-sm text-gray-500 mt-1">Fixed 10% of Basic Salary</p>
        </div>

        <div>
          <label
            for="otherAllowancePercentage"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Other Allowance (% of Gross)
          </label>
          <input
            type="number"
            id="otherAllowancePercentage"
            min="0"
            max="100"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={formData.fixedEarnings.otherAllowancePercentage}
            on:input={(e) =>
              handleFixedEarningsChange("otherAllowancePercentage", e)}
            disabled={readOnly}
          />
          {#if formErrors.fixedEarnings.otherAllowancePercentage}
            <p class="text-red-500 text-xs mt-1">
              {formErrors.fixedEarnings.otherAllowancePercentage}
            </p>
          {/if}
          <p class="text-sm text-gray-500 mt-1">
            Typically 40% of Gross Salary
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- EPF Configuration -->
  <div class="bg-white rounded-md shadow-sm">
    <div class="border-b px-4 py-3">
      <h3 class="text-lg font-medium">Employee Provident Fund (EPF)</h3>
    </div>
    <div class="p-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label
            for="epfEmployeeContribution"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Employee Contribution (% of Basic + DA)
          </label>
          <input
            type="number"
            id="epfEmployeeContribution"
            min="0"
            max="100"
            step="0.01"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={formData.statutoryDeductions.epf.employeeContribution}
            disabled={true}
          />
          <p class="text-sm text-gray-500 mt-1">Fixed at 12% of (Basic + DA)</p>
        </div>

        <div>
          <label
            for="epfEmployerContribution"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Employer Contribution (% of Basic + DA)
          </label>
          <input
            type="number"
            id="epfEmployerContribution"
            min="0"
            max="100"
            step="0.01"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={formData.statutoryDeductions.epf.employerContribution}
            disabled={true}
          />
          <p class="text-sm text-gray-500 mt-1">Fixed at 12% of (Basic + DA)</p>
        </div>

        <div class="col-span-2">
          <label
            for="epfMaxLimit"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Max Basic Salary Limit for EPF (₹)
          </label>
          <input
            type="number"
            id="epfMaxLimit"
            min="0"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={formData.statutoryDeductions.epf.maxLimit}
            disabled={true}
          />
          <p class="text-sm text-gray-500 mt-1">
            Fixed at ₹15,000 (PF amount must not exceed ₹1,800)
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- ESI Configuration -->
  <div class="bg-white rounded-md shadow-sm">
    <div class="border-b px-4 py-3">
      <h3 class="text-lg font-medium">Employee State Insurance (ESI)</h3>
    </div>
    <div class="p-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label
            for="esiEmployeeContribution"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Employee Contribution (% of Gross)
          </label>
          <input
            type="number"
            id="esiEmployeeContribution"
            min="0"
            max="100"
            step="0.01"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={formData.statutoryDeductions.esi.employeeContribution}
            disabled={true}
          />
          <p class="text-sm text-gray-500 mt-1">
            Fixed at 0.75% of Gross Salary
          </p>
        </div>

        <div>
          <label
            for="esiEmployerContribution"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Employer Contribution (% of Gross)
          </label>
          <input
            type="number"
            id="esiEmployerContribution"
            min="0"
            max="100"
            step="0.01"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={formData.statutoryDeductions.esi.employerContribution}
            disabled={true}
          />
          <p class="text-sm text-gray-500 mt-1">
            Fixed at 3.25% of Gross Salary
          </p>
        </div>

        <div class="col-span-2">
          <label
            for="esiApplicabilityLimit"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Applicability Limit (₹)
          </label>
          <input
            type="number"
            id="esiApplicabilityLimit"
            min="0"
            class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={formData.statutoryDeductions.esi.applicabilityLimit}
            disabled={true}
          />
          <p class="text-sm text-gray-500 mt-1">
            Fixed at ₹21,000 (ESI applicable if Gross Salary ≤ this amount)
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Professional Tax Configuration -->

  <div class="bg-white rounded-lg shadow-sm">
    <div class="border-b border-gray-200 px-6 py-4">
      <h3 class="text-lg font-semibold text-gray-900">Professional Tax</h3>
      <p class="text-sm text-gray-600 mt-1">
        Configure professional tax slabs based on income ranges
      </p>
    </div>

    <div class="p-6 space-y-6">
      <!-- State and Term Selection -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label for="ptState" class="block text-sm font-medium text-gray-700">
            State
          </label>
          <select
            id="ptState"
            class="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            bind:value={formData.statutoryDeductions.professionalTax.state}
            disabled={readOnly}
          >
            {#each taxstates as state}
              <option value={state.value}>{state.label}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-2">
          <label for="ptTerm" class="block text-sm font-medium text-gray-700">
            Tax Term
          </label>
          <select
            id="ptTerm"
            class="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            bind:value={formData.statutoryDeductions.professionalTax.term}
            disabled={readOnly}
          >
            {#each taxTerms as term}
              <option value={term.value}>{term.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Tax Slabs -->
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h4 class="text-base font-medium text-gray-900">Tax Slabs</h4>
          {#if !readOnly}
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              on:click={addSlabRow}
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Slab
            </button>
          {/if}
        </div>

        <div class="space-y-4">
          {#each formData.statutoryDeductions.professionalTax.slabs as slab, index}
            <div
              class="relative bg-gray-50 rounded-lg border border-gray-200 p-6"
            >
              <div class="grid grid-cols-10 gap-4">
                <div class="col-span-3 space-y-2">
                  <label class="block text-sm font-medium text-gray-700"
                    >From Amount (₹)</label
                  >
                  <input
                    type="number"
                    class="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={slab.fromAmount}
                    on:input={(e) =>
                      handleProfessionalTaxChange(index, "fromAmount", e)}
                    disabled={readOnly}
                  />
                  {#if slab.errors?.fromAmount}
                    <p class="text-red-500 text-xs mt-1">
                      {slab.errors.fromAmount}
                    </p>
                  {/if}
                </div>

                <div class="col-span-3 space-y-2">
                  <label class="block text-sm font-medium text-gray-700">
                    To Amount (₹)
                    {#if index === formData.statutoryDeductions.professionalTax.slabs.length - 1}
                      <span class="text-gray-500 text-xs ml-1">(Optional)</span>
                    {/if}
                  </label>
                  <input
                    type="number"
                    class="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={slab.toAmount}
                    on:input={(e) =>
                      handleProfessionalTaxChange(index, "toAmount", e)}
                    disabled={readOnly}
                  />
                  {#if slab.errors?.toAmount}
                    <p class="text-red-500 text-xs mt-1">
                      {slab.errors.toAmount}
                    </p>
                  {/if}
                </div>

                <div class="col-span-3 space-y-2">
                  <label class="block text-sm font-medium text-gray-700"
                    >Tax Amount (₹)</label
                  >
                  <input
                    type="number"
                    class="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={slab.taxAmount}
                    on:input={(e) =>
                      handletaxAmountChange(index, "taxAmount", e)}
                    disabled={readOnly}
                  />
                  {#if slab.errors?.taxAmount}
                    <p class="text-red-500 text-xs mt-1">
                      {slab.errors.taxAmount}
                    </p>
                  {/if}
                </div>

                {#if !readOnly && formData.statutoryDeductions.professionalTax.slabs.length > 1}
                  <div class="col-start-10 flex items-center justify-center">
                    <button
                      type="button"
                      class="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      on:click={() => removeSlabRow(index)}
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
  {#if !readOnly}
    <div class="flex justify-end">
      <button
        type="submit"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-white
               {hasErrors
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700'} 
               rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={hasErrors || !isValidTotal}
      >
        {#if hasErrors}
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Please Fix Errors
        {:else}
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Save Configuration
        {/if}
      </button>
    </div>
  {/if}
</form>
