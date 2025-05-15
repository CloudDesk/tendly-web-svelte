<!-- ExperienceSection.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Plus, Trash2 } from "lucide-svelte";
  import DocumentUpload from "./DocumentUpload.svelte";
  import { employeesApi } from "$lib/services/api";

  interface IExperienceDetails {
    id?: string;
    companyName: string;
    period?: string;
    documentUrl?: string;
  }
  export let experienceDetails: IExperienceDetails[];
  export let employeeId: string;

  const dispatch = createEventDispatcher();
  let loading: Record<string, boolean> = {};
  let formErrors: Record<string, string> = {};

  function addExperience() {
    experienceDetails = [
      ...experienceDetails,
      {
        id: crypto.randomUUID(),
        companyName: "",
        period: "",
      },
    ];
  }

  function removeExperience(index: number) {
    experienceDetails = experienceDetails.filter((_, i) => i !== index);
    updateDetails();
  }

  function validateForm() {
    let isValid = true;
    formErrors = {};

    experienceDetails.forEach((exp, index) => {
      if (!exp.companyName.trim()) {
        formErrors[`company-${index}`] = "Company name is required";
        isValid = false;
      }

      if (exp.period && !validatePeriod(exp.period)) {
        formErrors[`period-${index}`] =
          "Invalid period format (e.g. Jan 2020 - Dec 2023)";
        isValid = false;
      }
    });

    return isValid;
  }

  function validatePeriod(period: string) {
    // Simple validation for period format
    return /^\w+\s\d{4}(\s?-\s?\w+\s\d{4})?$/.test(period);
  }

  function updateDetails() {
    if (validateForm()) {
      dispatch("update", {
        type: "experienceDetails",
        data: experienceDetails,
      });
    }
  }

  async function handleFileUpload(index: number, file: File) {
    loading[`experience-${index}`] = true;
    try {
      const response = await employeesApi.filesUpload(file);
      experienceDetails[index].documentUrl = response.url;
      updateDetails();
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      loading[`experience-${index}`] = false;
    }
  }

  function handleDeleteDocument(index: number) {
    experienceDetails[index].documentUrl = undefined;
    updateDetails();
  }

  // Submit handler for the entire section
  function handleSubmit() {
    if (validateForm()) {
      dispatch("submit", {
        type: "experienceDetails",
        data: experienceDetails,
      });
    }
  }
</script>

<div class="space-y-4">
  <div class="flex justify-between">
    <h3 class="text-lg font-medium">Experience Details</h3>
    <button class="btn btn-ghost btn-sm" on:click={addExperience}>
      <Plus size={18} /> Add Experience
    </button>
  </div>

  {#each experienceDetails as experience, index}
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-medium">Experience {index + 1}</h4>
          <button
            class="btn btn-ghost btn-sm text-error"
            on:click={() => removeExperience(index)}
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <input
              type="text"
              class="input input-bordered {formErrors[`company-${index}`]
                ? 'input-error'
                : ''}"
              placeholder="Company Name *"
              bind:value={experience.companyName}
              on:blur={updateDetails}
            />
            {#if formErrors[`company-${index}`]}
              <label class="label">
                <span class="label-text-alt text-error"
                  >{formErrors[`company-${index}`]}</span
                >
              </label>
            {/if}
          </div>

          <div class="form-control">
            <input
              type="text"
              class="input input-bordered {formErrors[`period-${index}`]
                ? 'input-error'
                : ''}"
              placeholder="Period (e.g. Jan 2020 - Dec 2023)"
              bind:value={experience.period}
              on:blur={updateDetails}
            />
            {#if formErrors[`period-${index}`]}
              <label class="label">
                <span class="label-text-alt text-error"
                  >{formErrors[`period-${index}`]}</span
                >
              </label>
            {/if}
          </div>
        </div>

        <div class="flex justify-end mt-2">
          <DocumentUpload
            documentUrl={experience.documentUrl}
            {loading}
            fieldId={`experience-${index}`}
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
      disabled={experienceDetails.length === 0}
    >
      Save Experience Details
    </button>
  </div>
</div>
