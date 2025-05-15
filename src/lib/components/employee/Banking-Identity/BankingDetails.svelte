<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { employeesApi } from "$lib/services/api";
  import { fade, slide } from "svelte/transition";
  import { Archive, Edit, Info, MinusCircle, Plus, X } from "lucide-svelte";

  // Props
  export let employeeId: string;
  export let bankDetails: IBankDetails[] = [];

  // Types
  interface IBankDetails {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    isActive: boolean;
  }

  // State
  let showBankForm = false;
  let isEditing = false;
  let editIndex = -1;
  let bankFormData: IBankDetails = {
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    isActive: false,
  };
  let bankErrors: Record<string, string> = {};
  let bankFormValid = false;
  let bankLoading = false;
  let confirmDeactivation = false;

  const dispatch = createEventDispatcher<{
    refresh: { bankDetails: IBankDetails[] };
  }>();

  // Bank Name Options
  const bankNameOptions = [
    { label: "State Bank of India", value: "SBI" },
    { label: "Punjab National Bank", value: "PNB" },
    { label: "Bank of Baroda", value: "BOB" },
    { label: "Canara Bank", value: "Canara" },
    { label: "Union Bank of India", value: "Union" },
    { label: "Bank of India", value: "BOI" },
    { label: "Indian Bank", value: "Indian" },
    { label: "Central Bank of India", value: "Central" },
    { label: "Indian Overseas Bank", value: "IOB" },
    { label: "UCO Bank", value: "UCO" },
    { label: "Bank of Maharashtra", value: "Maharashtra" },
    { label: "Punjab & Sind Bank", value: "PSB" },
  ];

  // Get bank name label
  function getBankLabel(value: string): string {
    const bank = bankNameOptions.find((b) => b.value === value);
    return bank ? bank.label : value;
  }

  // Validation Functions
  function validateBankField(field: string, value: string) {
    switch (field) {
      case "accountHolderName":
        bankErrors.accountHolderName = value.trim()
          ? ""
          : "Account Holder Name is required";
        break;
      case "accountNumber":
        if (!value.trim()) {
          bankErrors.accountNumber = "Account Number is required";
        } else if (!/^[a-zA-Z0-9]{9,18}$/.test(value)) {
          bankErrors.accountNumber =
            "Account Number must be 9-18 alphanumeric characters";
        } else {
          bankErrors.accountNumber = "";
        }
        break;
      case "bankName":
        bankErrors.bankName = value.trim() ? "" : "Bank Name is required";
        break;
      case "ifscCode":
        if (!value.trim()) {
          bankErrors.ifscCode = "IFSC Code is required";
        } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
          bankErrors.ifscCode = "Invalid IFSC Code";
        } else {
          bankErrors.ifscCode = "";
        }
        break;
    }
  }

  function validateBankForm() {
    Object.keys(bankFormData).forEach((key) =>
      validateBankField(key, bankFormData[key as keyof IBankDetails] as string)
    );
    bankFormValid = Object.values(bankErrors).every((err) => err === "");
  }

  // Reset form
  function resetBankForm() {
    bankFormData = {
      accountHolderName: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
      isActive: false,
    };
    bankErrors = {};
    isEditing = false;
    editIndex = -1;
    validateBankForm();
  }

  // Event Handlers
  function handleBankInput(field: string, value: string) {
    bankFormData = { ...bankFormData, [field]: value };
    validateBankField(field, value);
    validateBankForm();
  }

  function handleBankSelect(value: string) {
    bankFormData.bankName = value;
    validateBankField("bankName", value);
    validateBankForm();
  }

  function handleBankCheckbox(checked: boolean) {
    bankFormData.isActive = checked;
    validateBankForm();
  }

  function editBankDetails(index: number) {
    const detail = bankDetails[index];
    bankFormData = { ...detail };
    isEditing = true;
    editIndex = index;
    showBankForm = true;
    validateBankForm();
  }

  function toggleBankForm() {
    if (
      showBankForm &&
      (isEditing || Object.values(bankFormData).some((v) => v !== ""))
    ) {
      // Only reset if there's actual data
      resetBankForm();
    }
    showBankForm = !showBankForm;
  }

  async function handleBankSubmit() {
    validateBankForm();
    if (!bankFormValid) return;

    let newBankDetails: IBankDetails[];

    if (isEditing) {
      // Update existing bank details
      newBankDetails = [...bankDetails];
      newBankDetails[editIndex] = bankFormData;

      // If setting this account as active, deactivate all others
      if (bankFormData.isActive) {
        newBankDetails = newBankDetails.map((detail, idx) => ({
          ...detail,
          isActive: idx === editIndex,
        }));
      }
    } else {
      // Add new bank details
      if (bankFormData.isActive) {
        // Deactivate all existing accounts if this one is active
        newBankDetails = bankDetails.map((detail) => ({
          ...detail,
          isActive: false,
        }));
      } else {
        newBankDetails = [...bankDetails];
      }

      newBankDetails.push(bankFormData);
    }

    bankLoading = true;

    try {
      const response = await employeesApi.update(employeeId, {
        bankDetails: newBankDetails,
      });

      if (response.success) {
        bankDetails = response.data.bankDetails;
        showBankForm = false;
        resetBankForm();
        dispatch("refresh", { bankDetails });
      }
    } catch (error) {
      bankErrors.submit = "Failed to submit bank details";
    } finally {
      bankLoading = false;
    }
  }

  function startBankDeactivate() {
    confirmDeactivation = true;
  }

  function cancelDeactivation() {
    confirmDeactivation = false;
  }

  async function confirmDeactivateBank() {
    // Deactivate all bank accounts
    const newBankDetails = bankDetails.map((detail) => ({
      ...detail,
      isActive: false,
    }));

    bankLoading = true;

    try {
      const response = await employeesApi.update(employeeId, {
        bankDetails: newBankDetails,
      });

      if (response.success) {
        bankDetails = response.data.bankDetails;
        confirmDeactivation = false;
        showBankForm = true;
        dispatch("refresh", { bankDetails });
      }
    } catch (error) {
      bankErrors.submit = "Failed to deactivate bank details";
    } finally {
      bankLoading = false;
    }
  }

  // Get active bank detail if any
  $: activeBank = bankDetails.find((bank) => bank.isActive);

  // Check if at least one bank exists
  $: hasBankDetails = bankDetails.length > 0;
</script>

<div class="bg-white shadow-md rounded-lg p-6 border border-gray-100">
  <header class="flex justify-between items-center mb-6">
    <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
      <Archive size={20} />
      Bank Information
    </h2>

    {#if !showBankForm}
      <button
        class="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
        on:click={toggleBankForm}
      >
        <Plus size={16} />
        {activeBank ? "Add New Bank" : "Add Bank Details"}
      </button>
    {/if}
  </header>

  {#if !hasBankDetails && !showBankForm}
    <div
      class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-700 flex items-center gap-3 mb-6"
    >
      <Info size={18} class="text-blue-500" />
      <span
        >No bank details have been added yet. Please add your bank information.</span
      >
    </div>
  {/if}

  {#if activeBank}
    <div transition:fade={{ duration: 300 }} class="mb-6">
      <div
        class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg overflow-hidden text-white relative"
      >
        <div
          class="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full -mt-16 -mr-16 opacity-20"
        ></div>
        <div
          class="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 rounded-full -mb-12 -ml-12 opacity-20"
        ></div>

        <div class="p-6 relative z-10">
          <div class="flex justify-between items-start mb-6">
            <div>
              <span
                class="inline-block px-2 py-1 bg-green-500 text-xs font-medium rounded-md mb-2"
                >Active Account</span
              >
              <h3 class="text-lg font-medium">
                {getBankLabel(activeBank.bankName)}
              </h3>
            </div>
            <div class="flex gap-2">
              <button
                class="p-2 hover:bg-blue-700 rounded-full transition-colors duration-200"
                on:click={() =>
                  editBankDetails(bankDetails.findIndex((b) => b.isActive))}
                title="Edit"
              >
                <Info size={18} class="text-blue-500" />
              </button>
              <button
                class="p-2 hover:bg-blue-700 rounded-full transition-colors duration-200"
                on:click={startBankDeactivate}
                title="Deactivate"
              >
                <MinusCircle size={16} />
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-4">
            <div>
              <p class="text-blue-200 mb-1">Account Holder</p>
              <p class="font-medium">{activeBank.accountHolderName}</p>
            </div>
            <div>
              <p class="text-blue-200 mb-1">Account Number</p>
              <p class="font-medium">{activeBank.accountNumber}</p>
            </div>
            <div>
              <p class="text-blue-200 mb-1">IFSC Code</p>
              <p class="font-medium">{activeBank.ifscCode}</p>
            </div>
            <div>
              <p class="text-blue-200 mb-1">Account Type</p>
              <p class="font-medium">Salary Account</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if confirmDeactivation}
    <div
      transition:fade={{ duration: 200 }}
      class="bg-red-50 border border-red-100 rounded-lg p-4 text-gray-700 mb-6"
    >
      <p class="font-medium text-red-700 mb-3">
        Are you sure you want to deactivate the current bank account?
      </p>
      <p class="mb-4 text-sm">
        This action will allow you to add a new primary bank account. You will
        need to add a new bank account to receive salary payments.
      </p>
      <div class="flex justify-end gap-3">
        <button
          class="px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors duration-200 text-sm font-medium"
          on:click={cancelDeactivation}
          disabled={bankLoading}
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors duration-200 text-sm font-medium flex items-center gap-2"
          on:click={confirmDeactivateBank}
          disabled={bankLoading}
        >
          {#if bankLoading}
            Processing...
          {:else}
            Deactivate
          {/if}
        </button>
      </div>
    </div>
  {/if}

  {#if showBankForm}
    <div
      transition:slide={{ duration: 300 }}
      class="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-800">
          {isEditing ? "Edit Bank Details" : "Add New Bank Details"}
        </h3>
        <button
          class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors duration-200"
          on:click={toggleBankForm}
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      <form on:submit|preventDefault={handleBankSubmit} class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Account Holder Name -->
          <div>
            <label
              for="accountHolderName"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Account Holder Name <span class="text-red-600">*</span>
            </label>
            <input
              id="accountHolderName"
              type="text"
              class="w-full px-3 py-2 border {bankErrors.accountHolderName
                ? 'border-red-300'
                : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              bind:value={bankFormData.accountHolderName}
              on:input={(e) =>
                handleBankInput("accountHolderName", e.target.value)}
              placeholder="Enter account holder name"
            />
            {#if bankErrors.accountHolderName}
              <p class="mt-1 text-sm text-red-600">
                {bankErrors.accountHolderName}
              </p>
            {/if}
          </div>

          <!-- Account Number -->
          <div>
            <label
              for="accountNumber"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Account Number <span class="text-red-600">*</span>
            </label>
            <input
              id="accountNumber"
              type="text"
              class="w-full px-3 py-2 border {bankErrors.accountNumber
                ? 'border-red-300'
                : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              bind:value={bankFormData.accountNumber}
              on:input={(e) => handleBankInput("accountNumber", e.target.value)}
              placeholder="Enter account number"
              disabled={isEditing}
            />
            {#if bankErrors.accountNumber}
              <p class="mt-1 text-sm text-red-600">
                {bankErrors.accountNumber}
              </p>
            {/if}
          </div>

          <!-- Bank Name -->
          <div>
            <label
              for="bankName"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Bank Name <span class="text-red-600">*</span>
            </label>
            <select
              id="bankName"
              class="w-full px-3 py-2 border {bankErrors.bankName
                ? 'border-red-300'
                : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-colors"
              bind:value={bankFormData.bankName}
              on:change={(e) => handleBankSelect(e.target.value)}
            >
              <option value="" disabled>Select bank name</option>
              {#each bankNameOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
            {#if bankErrors.bankName}
              <p class="mt-1 text-sm text-red-600">{bankErrors.bankName}</p>
            {/if}
          </div>

          <!-- IFSC Code -->
          <div>
            <label
              for="ifscCode"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              IFSC Code <span class="text-red-600">*</span>
            </label>
            <input
              id="ifscCode"
              type="text"
              class="w-full px-3 py-2 border {bankErrors.ifscCode
                ? 'border-red-300'
                : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors uppercase"
              bind:value={bankFormData.ifscCode}
              on:input={(e) =>
                handleBankInput("ifscCode", e.target.value.toUpperCase())}
              placeholder="Enter IFSC code"
            />
            {#if bankErrors.ifscCode}
              <p class="mt-1 text-sm text-red-600">{bankErrors.ifscCode}</p>
            {/if}
          </div>
        </div>

        <!-- Is Active Checkbox -->
        <div class="mt-4">
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              bind:checked={bankFormData.isActive}
              on:change={(e) => handleBankCheckbox(e.target.checked)}
            />
            <span class="ml-2 text-sm text-gray-700"
              >Set as primary salary account</span
            >
          </label>
          {#if activeBank && !isEditing}
            <p class="mt-1 text-xs text-amber-600">
              Note: Setting this as primary will deactivate your current active
              bank account.
            </p>
          {/if}
        </div>

        {#if bankErrors.submit}
          <div
            class="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md"
          >
            {bankErrors.submit}
          </div>
        {/if}

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            class="px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors duration-200 text-sm font-medium"
            on:click={toggleBankForm}
            disabled={bankLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors duration-200 text-sm font-medium flex items-center gap-2"
            disabled={!bankFormValid || bankLoading}
          >
            {#if bankLoading}
              {isEditing ? "Updating..." : "Saving..."}
            {:else}
              {isEditing ? "Update Details" : "Save Details"}
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if hasBankDetails && !showBankForm && !activeBank}
    <div
      class="bg-amber-50 border border-amber-100 rounded-lg p-4 text-amber-700 flex items-center gap-3 mb-6"
    >
      <Info size={18} class="text-amber-500" />
      <span
        >No active bank account found. Please add a primary account to receive
        salary payments.</span
      >
    </div>
  {/if}

  {#if !showBankForm && bankDetails.length > 0 && !activeBank}
    <div class="flex justify-center">
      <button
        class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
        on:click={toggleBankForm}
      >
        <Plus size={16} />
        Add Primary Bank Account
      </button>
    </div>
  {/if}

  {#if !activeBank && bankDetails.length > 0 && !showBankForm}
    <div class="mt-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">
        Inactive Bank Accounts
      </h4>
      <div class="space-y-3">
        {#each bankDetails as detail, index}
          <div
            class="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p class="font-medium text-gray-800">
                {getBankLabel(detail.bankName)}
              </p>
              <p class="text-sm text-gray-600">A/C: {detail.accountNumber}</p>
            </div>
            <div class="flex gap-2">
              <button
                class="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                on:click={() => editBankDetails(index)}
                title="Edit"
              >
                <Edit size={16} />
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
