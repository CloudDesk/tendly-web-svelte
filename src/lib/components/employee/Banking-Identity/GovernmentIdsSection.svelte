<script lang="ts">
  // Ensure ES module compatibility for SvelteKit/Vite
  import { createEventDispatcher } from "svelte";
  import { employeesApi } from "$lib/services/api";

  interface IGovernmentIds {
    pan: { number?: string; file?: File };
    aadhaar: { number?: string; file?: File };
    passport: { number?: string; file?: File };
    voterId: { number?: string; file?: File };
    drivingLicense: { number?: string; file?: File };
    pf: { number?: string; uan?: string };
  }

  export let governmentIds: IGovernmentIds;
  export let employeeId: string;

  const dispatch = createEventDispatcher();
  let loading: boolean = false;
  let formErrors: Record<string, string> = {};
  let fileErrors: Record<string, string> = {};
  let selectedFiles: Map<string, File> = new Map(); // Store selected files (excludes pf)

  // Initialize governmentIds
  $: {
    governmentIds = governmentIds || {};
    governmentIds.pan = governmentIds.pan || {};
    governmentIds.aadhaar = governmentIds.aadhaar || {};
    governmentIds.passport = governmentIds.passport || {};
    governmentIds.voterId = governmentIds.voterId || {};
    governmentIds.drivingLicense = governmentIds.drivingLicense || {};
    governmentIds.pf = governmentIds.pf || {};
  }

  const fields = [
    {
      key: "pan",
      label: "PAN Number",
      pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
      errorMsg: "PAN should be in format ABCDE1234F",
      hasDocument: true,
    },
    {
      key: "aadhaar",
      label: "Aadhaar Number",
      pattern: /^\d{12}$/,
      errorMsg: "Aadhaar should be 12 digits",
      hasDocument: true,
    },
    {
      key: "passport",
      label: "Passport Number",
      pattern: /^[A-Z][0-9]{7}$/,
      errorMsg: "Passport should be in format A1234567",
      hasDocument: true,
    },
    {
      key: "voterId",
      label: "Voter ID",
      pattern: /^[A-Z]{2,3}[0-9]{7,10}$/, // Matches ABC1234567 or AB1234567890
      errorMsg: "Voter ID should be 2-3 letters followed by 7-10 digits (e.g., ABC1234567)",
      hasDocument: true,
    },
    {
      key: "drivingLicense",
      label: "Driving License",
      pattern: /^[A-Z]{2}-?[0-9]{2}-?[0-9]{4}-?[0-9]{7,9}$/, // Matches MH-02-2009-1234567 or MH022009123456789
      errorMsg: "Driving License should be in format MH-02-2009-1234567",
      hasDocument: true,
    },
    {
      key: "pf",
      label: "PF Number",
      pfUan: true,
      hasDocument: false,
    },
  ];

  function validateForm() {
    let isValid = true;
    formErrors = {};
    fileErrors = {};

    // Validate ID numbers (only if provided)
    fields.forEach((field) => {
      const value = governmentIds[field.key]?.number;
      if (value && field.pattern && !field.pattern.test(value)) {
        formErrors[field.key] = field.errorMsg;
        isValid = false;
      }
    });

    // Validate PF UAN (only if provided)
    if (governmentIds.pf?.uan && !/^\d{12}$/.test(governmentIds.pf.uan)) {
      formErrors["pf-uan"] = "UAN should be 12 digits";
      isValid = false;
    }

    // Validate selected files (excludes pf)
    for (const [field, file] of selectedFiles) {
      const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        fileErrors[field] = "File must be a PDF or image (JPEG/PNG)";
        isValid = false;
      } else if (file.size > 1_000_000) {
        fileErrors[field] = "File size must not exceed 1MB";
        isValid = false;
      }
    }

    console.log("Form Errors:", formErrors); // Debug: Log validation errors
    return isValid;
  }

  function handleFileChange(field: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      selectedFiles.delete(field);
      governmentIds[field].file = undefined; // Clear file
    } else {
      selectedFiles.set(field, file);
      governmentIds[field].file = file; // Set file
    }
    selectedFiles = new Map(selectedFiles); // Trigger reactivity
    fileErrors[field] = "";
    validateAndUpdate();
  }

  function handleChange(field: string, value: string) {
    console.log(`Updating ${field} with value:`, value); // Debug: Log input value
    if (!governmentIds[field]) {
      governmentIds[field] = {};
    }
    governmentIds[field].number = field === "pan" ? value.toUpperCase() : value;
    governmentIds = { ...governmentIds }; // Trigger reactivity
    console.log(`Updated governmentIds[${field}]:`, governmentIds[field]); // Debug: Log updated field
    validateAndUpdate();
  }

  function handleUanChange(value: string) {
    console.log("Updating pf.uan with value:", value); // Debug: Log UAN value
    governmentIds.pf.uan = value;
    governmentIds = { ...governmentIds }; // Trigger reactivity
    console.log("Updated governmentIds.pf:", governmentIds.pf); // Debug: Log updated pf
    validateAndUpdate();
  }

  function validateAndUpdate() {
    // Always dispatch update to ensure parent component receives latest data
    dispatch("update", {
      type: "governmentIds",
      data: governmentIds,
    });
    validateForm(); // Run validation but don't block updates
  }

  async function handleSubmit() {
    if (!validateForm()) {
      console.log("Validation failed, but proceeding with submission"); // Debug: Log validation status
    }

    console.log("governmentIds before submit:", governmentIds); // Debug: Log full governmentIds

    // Prepare FormData for API
    const formData = new FormData();

    // Append all fields (files and numbers), including empty ones
    fields.forEach((field) => {
      const key = field.key;
      // Append file (if present)
      if (field.hasDocument) {
        const file = selectedFiles.get(key);
        if (file) {
          formData.append(`${key}_file`, file);
        }
      }
      // Append number (empty string if not present)
      const number = governmentIds[key]?.number || "";
      formData.append(`${key}_number`, number);
      console.log(`${key}_number:`, number); // Debug: Log each field value
      // Append UAN for pf
      if (field.pfUan) {
        const uan = governmentIds.pf?.uan || "";
        formData.append("pf_uan", uan);
        console.log("pf_uan:", uan); // Debug: Log UAN
      }
    });

    console.log("formData entries:", [...formData.entries()]); // Debug: Log FormData

    loading = true;
    formErrors = {};
    fileErrors = {};

    try {
      const response = await employeesApi.updateGovernmentId(employeeId, formData);
      console.log("Backend response:", response);

      // Update governmentIds with response data
      governmentIds = response.data;
      dispatch("submit", {
        type: "governmentIds",
        data: governmentIds,
      });
    } catch (error: any) {
      formErrors["submit"] = error.message || "Submission failed.";
      console.error("Submission error:", error);
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {#each fields as field}
      <div class="form-control">
        <label for={field.key} class="label">
          <span class="label-text">{field.label}</span>
        </label>
        <div class="flex flex-col gap-2">
          <!-- Number Input -->
          <input
            type="text"
            id={field.key}
            class="input input-bordered flex-1 {formErrors[field.key]
              ? 'input-error'
              : ''}"
            value={governmentIds[field.key]?.number || ""}
            on:input={(e) => {
              console.log(`Input event for ${field.key}:`, e.currentTarget.value); // Debug: Log input event
              handleChange(field.key, e.currentTarget.value);
            }}
            on:blur={validateAndUpdate}
          />
          {#if formErrors[field.key]}
            <label class="label">
              <span class="label-text-alt text-error">{formErrors[field.key]}</span>
            </label>
          {/if}

          <!-- File Upload -->
          {#if field.hasDocument}
            <div class="mt-2">
              <label class="label">
                <span class="label-text">Upload Document</span>
              </label>
              <input
                type="file"
                id="file-upload-{field.key}"
                accept="application/pdf,image/jpeg,image/png"
                class="input input-bordered w-full"
                on:change={(e) => handleFileChange(field.key, e)}
                disabled={loading}
              />
              {#if selectedFiles.has(field.key)}
                <span class="text-sm mt-1"
                  >Selected: {selectedFiles.get(field.key)?.name}</span
                >
              {/if}
            </div>
            {#if fileErrors[field.key]}
              <label class="label">
                <span class="label-text-alt text-error">{fileErrors[field.key]}</span>
              </label>
            {/if}
          {/if}

          <!-- PF UAN Field -->
          {#if field.pfUan}
            <div class="mt-2">
              <label for="pf-uan" class="label">
                <span class="label-text">UAN Number</span>
              </label>
              <input
                type="text"
                id="pf-uan"
                class="input input-bordered w-full {formErrors['pf-uan']
                  ? 'input-error'
                  : ''}"
                value={governmentIds.pf.uan || ""}
                on:input={(e) => handleUanChange(e.currentTarget.value)}
                on:blur={validateAndUpdate}
              />
              {#if formErrors["pf-uan"]}
                <label class="label">
                  <span class="label-text-alt text-error">{formErrors["pf-uan"]}</span>
                </label>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if formErrors["submit"]}
    <div class="text-error">{formErrors["submit"]}</div>
  {/if}

  {#if loading}
    <div class="flex justify-center">
      <span class="loading loading-spinner"></span>
    </div>
  {/if}

  <div class="flex justify-end mt-4">
    <button class="btn btn-primary" on:click={handleSubmit} disabled={loading}>
      Save Government IDs
    </button>
  </div>
</div>