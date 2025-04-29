<!-- AcademicSection.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Plus, Trash2 } from "lucide-svelte";
  import DocumentUpload from "./DocumentUpload.svelte";
  import { employeesApi } from "$lib/services/api";

  interface IAcademicDetails {
    id?: string;
    instituteName: string;
    grade?: string;
    yearOfPassing?: string;
    documentUrl?: string;
  }

  export let academicDetails: IAcademicDetails[];
  export let employeeId: string;

  const dispatch = createEventDispatcher();
  let loading: Record<string, boolean> = {};
  let formErrors: Record<string, string> = {};

  function addAcademic() {
    academicDetails = [
      ...academicDetails,
      {
        id: crypto.randomUUID(),
        instituteName: "",
        grade: "",
        yearOfPassing: "",
      },
    ];
  }

  function removeAcademic(index: number) {
    academicDetails = academicDetails.filter((_, i) => i !== index);
    updateDetails();
  }

  function validateForm() {
    let isValid = true;
    formErrors = {};

    academicDetails.forEach((detail, index) => {
      if (!detail.instituteName.trim()) {
        formErrors[`institute-${index}`] = "Institute name is required";
        isValid = false;
      }

      if (detail.yearOfPassing && !validateYear(detail.yearOfPassing)) {
        formErrors[`year-${index}`] = "Please enter a valid 4-digit year";
        isValid = false;
      }
    });

    return isValid;
  }

  function validateYear(year: string) {
    return (
      /^\d{4}$/.test(year) &&
      parseInt(year) > 1900 &&
      parseInt(year) <= new Date().getFullYear()
    );
  }

  function updateDetails() {
    if (validateForm()) {
      dispatch("update", {
        type: "academicDetails",
        data: academicDetails,
      });
    }
  }

  async function handleFileUpload(index: number, file: File) {
    loading[`academic-${index}`] = true;
    try {
      const response = await employeesApi.filesUpload(file);
      academicDetails[index].documentUrl = response.url;
      updateDetails();
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      loading[`academic-${index}`] = false;
    }
  }

  function handleDeleteDocument(index: number) {
    academicDetails[index].documentUrl = undefined;
    updateDetails();
  }

  function handleSubmit() {
    if (validateForm()) {
      dispatch("submit", {
        type: "academicDetails",
        data: academicDetails,
      });
    }
  }
</script>

<div class="space-y-4">
  <div class="flex justify-between">
    <h3 class="text-lg font-medium">Academic Details</h3>
    <button class="btn btn-ghost btn-sm" on:click={addAcademic}>
      <Plus size={18} /> Add Education
    </button>
  </div>

  {#each academicDetails as detail, index}
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-medium">Education {index + 1}</h4>
          <button
            class="btn btn-ghost btn-sm text-error"
            on:click={() => removeAcademic(index)}
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="form-control">
            <input
              type="text"
              class="input input-bordered {formErrors[`institute-${index}`]
                ? 'input-error'
                : ''}"
              placeholder="Institute Name *"
              bind:value={detail.instituteName}
              on:blur={updateDetails}
            />
            {#if formErrors[`institute-${index}`]}
              <label class="label">
                <span class="label-text-alt text-error"
                  >{formErrors[`institute-${index}`]}</span
                >
              </label>
            {/if}
          </div>

          <div class="form-control">
            <input
              type="text"
              class="input input-bordered"
              placeholder="Grade"
              bind:value={detail.grade}
              on:blur={updateDetails}
            />
          </div>

          <div class="form-control">
            <input
              type="text"
              class="input input-bordered {formErrors[`year-${index}`]
                ? 'input-error'
                : ''}"
              placeholder="Year of Passing (YYYY)"
              bind:value={detail.yearOfPassing}
              on:blur={updateDetails}
            />
            {#if formErrors[`year-${index}`]}
              <label class="label">
                <span class="label-text-alt text-error"
                  >{formErrors[`year-${index}`]}</span
                >
              </label>
            {/if}
          </div>
        </div>

        <div class="flex justify-end mt-2">
          <DocumentUpload
            documentUrl={detail.documentUrl}
            {loading}
            fieldId={`academic-${index}`}
            onUpload={(file) => handleFileUpload(index, file)}
            on:delete={() => handleDeleteDocument(index)}
          />
        </div>
      </div>
    </div>
  {/each}

  <div class="flex justify-end mt-4">
    <button
      class="btn btn-primary"
      on:click={handleSubmit}
      disabled={academicDetails.length === 0}
    >
      Save Academic Details
    </button>
  </div>
</div>
