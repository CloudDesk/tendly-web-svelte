<!-- ExperienceSection.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Plus, Trash2 } from "lucide-svelte";
  import { employeesApi } from "$lib/services/api";

  interface IExperienceDetails {
    id?: string;
    companyName: string;
    period?: string;
  }

  export let experienceDetails: IExperienceDetails[];
  export let employeeId: string;

  const dispatch = createEventDispatcher();
  let loading = false;
  let formErrors: Record<string, string> = {};

  function addExperience() {
    experienceDetails = [
      ...experienceDetails,
      {
        id: crypto.randomUUID(), // Retain id for frontend reactivity
        companyName: "",
        period: "",
      },
    ];
  }

  function removeExperience(index: number) {
    experienceDetails = experienceDetails.filter((_, i) => i !== index);
    validateAndUpdate();
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

  function validateAndUpdate() {
    dispatch("update", {
      type: "experienceDetails",
      data: experienceDetails,
    });
    validateForm();
  }

  async function handleSubmit() {
    if (!validateForm()) {
      console.log("Validation failed, but proceeding with submission");
    }

    console.log("experienceDetails before submit:", experienceDetails);

    loading = true;
    formErrors = {};

    try {
      // Prepare field values for update
      const fieldValues = experienceDetails.map((detail) => ({
        id: detail.id,
        companyName: detail.companyName || "",
        period: detail.period || "",
      }));
      console.log("Field values for update:", fieldValues);

      // Update experience details
      const response = await employeesApi.updateExperienceDetails(
        employeeId,
        fieldValues
      );
      console.log("Field update response:", response);

      // Update experienceDetails with the response data
      experienceDetails = response.data;
      dispatch("submit", {
        type: "experienceDetails",
        data: experienceDetails,
      });
    } catch (error: any) {
      formErrors["submit"] = error.message || "Submission failed.";
      console.error("Submission error:", error);
    } finally {
      loading = false;
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

  {#each experienceDetails as experience, index (experience.id)}
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
              on:blur={validateAndUpdate}
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
              on:blur={validateAndUpdate}
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
      </div>
    </div>
  {/each}

  {#if formErrors["submit"]}
    <div class="text-error">{formErrors["submit"]}</div>
  {/if}

  {#if loading}
    <div class="flex justify-center">
      <span class="loading loading-spinner"></span>
    </div>
  {/if}

  <div class="flex justify-end mt-4">
    <button
      class="btn btn-primary"
      on:click={handleSubmit}
      disabled={experienceDetails.length === 0 || loading}
    >
      Save Experience Details
    </button>
  </div>
</div>
