<!-- GovernmentIdSection.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { employeesApi } from "$lib/services/api";
  import { toast } from "$lib/components/common/stores/toast.store";
  import { Check, CloudUpload, Eye, Info, Loader, X } from "lucide-svelte";

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
  let selectedFiles: Map<string, File> = new Map();
  let uploadProgress: Record<string, boolean> = {};

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
      placeholder: "ABCDE1234F",
      pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
      errorMsg: "PAN should be in format ABCDE1234F",
      hasDocument: true,
      icon: "📝",
      description: "Permanent Account Number issued by Income Tax Department",
    },
    {
      key: "aadhaar",
      label: "Aadhaar Number",
      placeholder: "123456789012",
      pattern: /^\d{12}$/,
      errorMsg: "Aadhaar should be 12 digits",
      hasDocument: true,
      icon: "🆔",
      description: "12-digit unique identity number issued by UIDAI",
    },
    {
      key: "passport",
      label: "Passport Number",
      placeholder: "A1234567",
      pattern: /^[A-Z][0-9]{7}$/,
      errorMsg: "Passport should be in format A1234567",
      hasDocument: true,
      icon: "🛂",
      description: "International travel document issued by the government",
    },
    {
      key: "voterId",
      label: "Voter ID",
      placeholder: "ABC1234567",
      pattern: /^[A-Z]{2,3}[0-9]{7,10}$/,
      errorMsg: "Voter ID should be 2-3 letters followed by 7-10 digits",
      hasDocument: true,
      icon: "🗳️",
      description:
        "Electoral Photo Identity Card issued by Election Commission",
    },
    {
      key: "drivingLicense",
      label: "Driving License",
      placeholder: "MH-02-2009-1234567",
      pattern: /^[A-Z]{2}-?[0-9]{2}-?[0-9]{4}-?[0-9]{7,9}$/,
      errorMsg: "Driving License should be in format MH-02-2009-1234567",
      hasDocument: true,
      icon: "🚗",
      description:
        "Official document permitting a person to drive motor vehicles",
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

    // Validate selected files
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
    if (!file) {
      selectedFiles.delete(field);
    } else {
      selectedFiles.set(field, file);
    }
    selectedFiles = new Map(selectedFiles); // Trigger reactivity
    fileErrors[field] = "";
    validateAndUpdate();
  }

  function handleChange(field: string, value: string) {
    if (!governmentIds[field]) {
      governmentIds[field] = {};
    }
    governmentIds[field].number = field === "pan" ? value.toUpperCase() : value;
    governmentIds = { ...governmentIds };
    validateAndUpdate();
  }

  function handleUanChange(value: string) {
    governmentIds.pf.uan = value;
    governmentIds = { ...governmentIds };
    validateAndUpdate();
  }

  function validateAndUpdate() {
    validateForm();
  }

  function getFileIcon(filename: string) {
    if (!filename) return "📄";
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📕";
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "🖼️";
    return "📄";
  }

  function getFileName(url: string) {
    if (!url) return "";
    const parts = url.split("/");
    return parts[parts.length - 1];
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    const fieldValues = {
      pan_number: governmentIds.pan?.number || "",
      aadhaar_number: governmentIds.aadhaar?.number || "",
      passport_number: governmentIds.passport?.number || "",
      voterId_number: governmentIds.voterId?.number || "",
      drivingLicense_number: governmentIds.drivingLicense?.number || "",
      pf_number: governmentIds.pf?.number || "",
      pf_uan: governmentIds.pf?.uan || "",
    };
    loading = true;
    formErrors = {};
    fileErrors = {};

    try {
      // Step 1: Upload files (if any)
      if (selectedFiles.size > 0) {
        const fileFormData = new FormData();
        for (const [field, file] of selectedFiles) {
          fileFormData.append(`${field}_file`, file);
          uploadProgress[field] = true;
        }

        const fileResponse = await employeesApi.updateGovernmentIdFile(
          employeeId,
          fileFormData
        );

        // Update governmentIds with the new documentUrls from the response
        governmentIds = fileResponse.data;
        selectedFiles.clear(); // Clear selected files after upload
        uploadProgress = {};
      }

      // Step 2: Update field values
      const fieldResponse: any = await employeesApi.updateGovernmentId(
        employeeId,
        fieldValues
      );
      console.log(fieldResponse, "fieldResponse");
      if (fieldResponse.success) {
        toast.success("Government IDs updated successfully");
      } else {
        toast.error("Failed to update Government IDs");
      }
      dispatch("refresh");
    } catch (error: any) {
      formErrors["submit"] = error.message || "Submission failed.";
      console.error("Submission error:", error);
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white">
  <div class="space-y-6">
    <!-- Regular Government ID Fields -->
    {#each fields as field}
      <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <!-- Section Header -->
        <div
          class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200"
        >
          <div class="flex items-center">
            <span class="text-2xl mr-3">{field.icon}</span>
            <div>
              <h3 class="text-lg font-semibold text-gray-800">{field.label}</h3>
              <!-- <p class="text-sm text-gray-600 mt-1">{field.description}</p> -->
            </div>
          </div>
        </div>

        <!-- Section Content -->
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Number Input Column -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                Number
              </label>
              <input
                type="text"
                placeholder={field.placeholder}
                class="w-full px-4 py-3 rounded-lg border {formErrors[field.key]
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} shadow-sm focus:outline-none focus:ring-2 transition-all duration-200"
                value={governmentIds[field.key]?.number || ""}
                on:input={(e) => handleChange(field.key, e.currentTarget.value)}
                on:blur={validateAndUpdate}
                disabled={loading}
              />
              {#if formErrors[field.key]}
                <p class="text-sm text-red-600 flex items-center">
                  <Info class="w-4 h-4 mr-1 flex-shrink-0" />
                  {formErrors[field.key]}
                </p>
              {/if}
            </div>

            <!-- Document Upload Column -->
            <div class="space-y-4">
              <label class="block text-sm font-medium text-gray-700">
                Document Upload
              </label>

              <!-- File Input -->
              <div class="relative">
                <input
                  type="file"
                  id="file-upload-{field.key}"
                  accept="application/pdf,image/jpeg,image/png"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  on:change={(e) => handleFileChange(field.key, e)}
                  disabled={loading}
                />
                <div
                  class="w-full px-4 py-3 text-sm border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 hover:border-blue-400"
                >
                  <CloudUpload class="w-5 h-5 mr-2" />
                  {selectedFiles.has(field.key)
                    ? "Change Document"
                    : "Upload Document"}
                </div>
              </div>

              <!-- Selected File Preview -->
              {#if selectedFiles.has(field.key)}
                <div
                  class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div class="flex items-center space-x-3">
                    <span class="text-lg"
                      >{getFileIcon(selectedFiles.get(field.key).name)}</span
                    >
                    <span class="text-sm text-blue-800 font-medium truncate">
                      {selectedFiles.get(field.key).name}
                    </span>
                  </div>
                  <button
                    type="button"
                    class="text-red-500 hover:text-red-700 p-1"
                    on:click={() => {
                      selectedFiles.delete(field.key);
                      selectedFiles = new Map(selectedFiles);
                    }}
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              {/if}

              <!-- Existing Document -->
              {#if governmentIds[field.key]?.documentUrl}
                <div
                  class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div class="flex items-center space-x-3">
                    <span class="text-lg"
                      >{getFileIcon(governmentIds[field.key].documentUrl)}</span
                    >
                    <span class="text-sm text-green-800 font-medium truncate">
                      {getFileName(governmentIds[field.key].documentUrl)}
                    </span>
                  </div>
                  <a
                    href={governmentIds[field.key].documentUrl}
                    target="_blank"
                    class="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Eye class="w-4 h-4" />
                  </a>
                </div>
              {/if}

              <!-- Upload Progress -->
              {#if uploadProgress[field.key]}
                <div class="flex items-center space-x-2">
                  <div
                    class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"
                  >
                    <div class="h-full bg-blue-500 animate-pulse"></div>
                  </div>
                  <span class="text-xs text-gray-500">Uploading...</span>
                </div>
              {/if}

              {#if fileErrors[field.key]}
                <p class="text-sm text-red-600 flex items-center">
                  <Info class="w-4 h-4 mr-1 flex-shrink-0" />
                  {fileErrors[field.key]}
                </p>
              {/if}

              <p class="text-xs text-gray-500">
                Supported formats: PDF, JPEG, PNG (Max 1MB)
              </p>
            </div>
          </div>
        </div>
      </div>
    {/each}

    <!-- PF Section (Special Layout) -->
    <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <!-- Section Header -->
      <div
        class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200"
      >
        <div class="flex items-center">
          <span class="text-2xl mr-3">💼</span>
          <div>
            <h3 class="text-lg font-semibold text-gray-800">
              Provident Fund Details
            </h3>
            <p class="text-sm text-gray-600 mt-1">
              Employee Provident Fund account numbers
            </p>
          </div>
        </div>
      </div>

      <!-- Section Content -->
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- PF Number -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              PF Number
            </label>
            <input
              type="text"
              placeholder="Enter PF number"
              class="w-full px-4 py-3 rounded-lg border {formErrors['pf']
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} shadow-sm focus:outline-none focus:ring-2 transition-all duration-200"
              value={governmentIds.pf?.number || ""}
              on:input={(e) => handleChange("pf", e.currentTarget.value)}
              on:blur={validateAndUpdate}
              disabled={loading}
            />
            {#if formErrors["pf"]}
              <p class="text-sm text-red-600 flex items-center">
                <Info class="w-4 h-4 mr-1 flex-shrink-0" />
                {formErrors["pf"]}
              </p>
            {/if}
          </div>

          <!-- UAN Number -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              UAN Number
            </label>
            <input
              type="text"
              placeholder="123456789012"
              class="w-full px-4 py-3 rounded-lg border {formErrors['pf-uan']
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} shadow-sm focus:outline-none focus:ring-2 transition-all duration-200"
              value={governmentIds.pf?.uan || ""}
              on:input={(e) => handleUanChange(e.currentTarget.value)}
              on:blur={validateAndUpdate}
              disabled={loading}
            />
            {#if formErrors["pf-uan"]}
              <p class="text-sm text-red-600 flex items-center">
                <Info class="w-4 h-4 mr-1 flex-shrink-0" />
                {formErrors["pf-uan"]}
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if formErrors["submit"]}
    <div class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center">
        <Info class="w-5 h-5 text-red-400 mr-2" />
        <span class="text-red-800">{formErrors["submit"]}</span>
      </div>
    </div>
  {/if}

  <div class="flex justify-end mt-8">
    <button
      class="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
      on:click={handleSubmit}
      disabled={loading}
    >
      {#if loading}
        <Loader class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
        Saving Changes...
      {:else}
        <Check class="w-5 h-5 mr-2" />
        Save Government IDs
      {/if}
    </button>
  </div>
</div>
