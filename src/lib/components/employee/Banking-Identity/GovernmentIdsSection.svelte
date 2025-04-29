<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { employeesApi } from "$lib/services/api";

  interface IGovernmentIds {
    pan: { number?: string; documentUrl?: string };
    aadhaar: { number?: string; documentUrl?: string };
    passport: { number?: string; documentUrl?: string };
    voterId: { number?: string; documentUrl?: string };
    drivingLicense: { number?: string; documentUrl?: string };
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
      pattern: /^[A-Z]{2}[0-9]{7}$/,
      errorMsg: "Voter ID should be in format AB1234567",
      hasDocument: true,
    },
    {
      key: "drivingLicense",
      label: "Driving License",
      pattern: /^[A-Z]{2}[0-9]{2}[A-Z]?[0-9]{7}$/,
      errorMsg: "Invalid driving license format",
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

    // Validate ID numbers
    fields.forEach((field) => {
      const value = governmentIds[field.key]?.number;
      if (value && field.pattern && !field.pattern.test(value)) {
        formErrors[field.key] = field.errorMsg;
        isValid = false;
      }
    });

    // Validate PF UAN
    if (governmentIds.pf?.uan && !/^\d{12}$/.test(governmentIds.pf.uan)) {
      formErrors["pf-uan"] = "UAN should be 12 digits";
      isValid = false;
    }

    // Validate selected files (excludes pf)
    for (const [field, file] of selectedFiles) {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!validTypes.includes(file.type)) {
        fileErrors[field] = "File must be a PDF or image (JPEG/PNG)";
        isValid = false;
      } else if (file.size > 1_000_000) {
        fileErrors[field] = "File size must not exceed 1MB";
        isValid = false;
      }
    }

    return isValid;
  }

  function handleFileChange(field: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    console.log(`handleFileChange for ${field}:`, file);
    if (!file) {
      selectedFiles.delete(field);
      selectedFiles = new Map(selectedFiles); // Trigger reactivity
      console.log(
        "selectedFiles after delete:",
        Object.fromEntries(selectedFiles)
      );
      return;
    }

    // Store file locally
    selectedFiles.set(field, file);
    selectedFiles = new Map(selectedFiles); // Trigger reactivity
    fileErrors[field] = "";
    console.log("selectedFiles after set:", Object.fromEntries(selectedFiles));
    validateAndUpdate();
  }

  function handleChange(field: string, value: string) {
    governmentIds[field].number = field === "pan" ? value.toUpperCase() : value;
    validateAndUpdate();
  }

  function handleUanChange(value: string) {
    governmentIds.pf.uan = value;
    validateAndUpdate();
  }

  function validateAndUpdate() {
    if (validateForm()) {
      dispatch("update", {
        type: "governmentIds",
        data: governmentIds,
      });
    }
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    // Prepare files and numbers
    const files: Record<string, File> = Object.fromEntries(selectedFiles);
    const numbers: Record<string, { number?: string; uan?: string }> = {};
    fields.forEach((field) => {
      numbers[field.key] = {
        number: governmentIds[field.key]?.number,
        ...(field.pfUan ? { uan: governmentIds.pf.uan } : {}),
      };
    });

    console.log("Files to send:", files);
    console.log("Numbers to send:", numbers);

    loading = true;
    formErrors = {};
    fileErrors = {};

    try {
      const response = await employeesApi.updateGovernmentId(employeeId, {
        files,
        numbers,
      });
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
            on:input={(e) => handleChange(field.key, e.currentTarget.value)}
            on:blur={validateAndUpdate}
          />
          {#if formErrors[field.key]}
            <label class="label">
              <span class="label-text-alt text-error"
                >{formErrors[field.key]}</span
              >
            </label>
          {/if}

          <!-- Document Upload or Display (excludes pf) -->
          {#if field.hasDocument}
            {#if governmentIds[field.key]?.documentUrl}
              <div class="mt-2">
                <label class="label">
                  <span class="label-text">Uploaded Document</span>
                </label>
                <a
                  href={governmentIds[field.key].documentUrl}
                  target="_blank"
                  class="link link-primary"
                >
                  View Document
                </a>
                <!-- Option to replace document -->
                <div class="mt-2">
                  <label class="label">
                    <span class="label-text">Replace Document</span>
                  </label>
                  <input
                    type="file"
                    id="file-upload-{field.key}"
                    accept="application/pdf,image/jpeg,image/png"
                    class="input input-bordered w-full"
                    on:change={(e) => handleFileChange(field.key, e)}
                    disabled={loading}
                  />
                </div>
              </div>
            {:else}
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
              </div>
            {/if}
            {#if fileErrors[field.key]}
              <label class="label">
                <span class="label-text-alt text-error"
                  >{fileErrors[field.key]}</span
                >
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
                  <span class="label-text-alt text-error"
                    >{formErrors["pf-uan"]}</span
                  >
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
