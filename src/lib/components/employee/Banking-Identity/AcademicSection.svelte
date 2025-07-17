<!-- AcademicSection.svelte (without id) -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Plus, Trash2 } from "lucide-svelte";
  import { employeesApi } from "$lib/services/api";
  import { toast } from "$lib/components/common/stores/toast.store";

  interface IAcademicDetails {
    instituteName: string;
    grade?: string;
    yearOfPassing?: string;
  }

  export let academicDetails: IAcademicDetails[];
  export let employeeId: string;

  const dispatch = createEventDispatcher();
  let loading = false;
  let formErrors: Record<string, string> = {};

  function addAcademic() {
    academicDetails = [
      ...academicDetails,
      {
        instituteName: "",
        grade: "",
        yearOfPassing: "",
      },
    ];
  }

  function removeAcademic(index: number) {
    academicDetails = academicDetails.filter((_, i) => i !== index);
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

  async function handleSubmit() {
    if (!validateForm()) {
      console.log("Validation failed, but proceeding with submission");
    }

    console.log("academicDetails before submit:", academicDetails);

    loading = true;
    formErrors = {};

    try {
      // Prepare field values for update (without id)
      const fieldValues = academicDetails.map((detail) => ({
        instituteName: detail.instituteName || "",
        grade: detail.grade || "",
        yearOfPassing: detail.yearOfPassing || "",
      }));
      console.log("Field values for update:", fieldValues);

      // // Update field values
      const response: any = await employeesApi.updateAcademicId(
        employeeId,
        fieldValues
      );
      console.log("Field update response:", response);
      if (response.error) {
        toast.error(response.error.message || "Failed to update academic details");
      } else {
        toast.success("Academic details updated successfully");
      }

      dispatch("refresh");
    } catch (error: any) {
      formErrors["submit"] = error.message || "Submission failed.";
      console.error("Submission error:", error);
      toast.error(error.message || "Submission failed.");
    } finally {
      loading = false;
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

  {#each academicDetails as detail, index (index)}
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
      disabled={academicDetails.length === 0 || loading}
    >
      Save Academic Details
    </button>
  </div>
</div>
