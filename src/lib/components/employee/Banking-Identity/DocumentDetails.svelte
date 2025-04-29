<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Accordion from "$lib/components/common/Accordion.svelte";
  import GovernmentIdsSection from "./GovernmentIdsSection.svelte";
  import ExperienceSection from "./ExperienceSection.svelte";
  import AcademicSection from "./AcademicSection.svelte";
  import type { User } from "$lib/types";

  export let employeeId: string;
  export let employee: User;

  const dispatch = createEventDispatcher();
  let openAccordion = 1;
  let savingSection: string | null = null;
  let successMessage: string | null = null;
  let errorMessage: string | null = null;

  // Ensure employee properties are initialized
  $: employee = {
    ...employee,
    governmentIds: employee.governmentIds || {},
    academicDetails: employee.academicDetails || [],
    experienceDetails: employee.experienceDetails || [],
  };

  function handleToggle(event: CustomEvent) {
    const { id, isOpen } = event.detail;
    openAccordion = isOpen ? id : null;
  }

  // Define sections configuration
  $: sections = [
    {
      id: 1,
      title: "Government IDs",
      subtitle: "Pan, Aadhaar, Passport, etc.",
      isOpen: openAccordion === 1,
      component: GovernmentIdsSection,
      props: { employeeId, governmentIds: employee.governmentIds },
    },
    {
      id: 2,
      title: "Academic Details",
      subtitle: "Education and certifications",
      isOpen: openAccordion === 2,
      component: AcademicSection,
      props: { employeeId, academicDetails: employee.academicDetails },
    },
    {
      id: 3,
      title: "Experience Details",
      subtitle: "Work history and experience letters",
      isOpen: openAccordion === 3,
      component: ExperienceSection,
      props: { employeeId, experienceDetails: employee.experienceDetails },
    },
  ];

  // Handle local updates from components
  function handleSectionUpdate(event: CustomEvent) {
    const { type, data } = event.detail;
    employee = { ...employee, [type]: data };
  }

  // Handle section submission - this will trigger a save to the backend
  async function handleSectionSubmit(event: CustomEvent) {
    const { type, data } = event.detail;
    savingSection = type;
    errorMessage = null;
    successMessage = null;

    try {
      // Keep a local copy updated
      employee = { ...employee, [type]: data };

      // Save to backend
      await saveEmployeeData(employeeId, { [type]: data });

      // Show success message
      successMessage = `${getSectionTitle(type)} saved successfully`;

      // Emit update event to parent
      dispatch("update", { employee });

      // Auto-hide message after 3 seconds
      setTimeout(() => {
        if (successMessage) {
          successMessage = null;
        }
      }, 3000);
    } catch (error) {
      console.error("Error saving employee data:", error);
      errorMessage = `Failed to save ${getSectionTitle(type)}`;
    } finally {
      savingSection = null;
    }
  }

  function getSectionTitle(type: string): string {
    switch (type) {
      case "governmentIds":
        return "Government IDs";
      case "academicDetails":
        return "Academic Details";
      case "experienceDetails":
        return "Experience Details";
      default:
        return "Section";
    }
  }

  function handleFileUpload(event: CustomEvent) {
    dispatch("fileupload", event.detail);
  }

  // Mock function for saving data - replace with your actual API call
  async function saveEmployeeData(id: string, data: any) {
    // Example implementation - replace with your actual API call
    const response = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to save employee data");
    }

    return await response.json();
  }
</script>

<div class="container mx-auto p-6">
  {#if successMessage}
    <div class="alert alert-success mb-4">
      <span>{successMessage}</span>
    </div>
  {/if}

  {#if errorMessage}
    <div class="alert alert-error mb-4">
      <span>{errorMessage}</span>
    </div>
  {/if}

  {#each sections as section (section.id)}
    <Accordion
      title={section.title}
      subtitle={section.subtitle}
      id={section.id}
      isOpen={section.isOpen}
      on:toggle={handleToggle}
    >
      <svelte:component
        this={section.component}
        {...section.props}
        on:update={handleSectionUpdate}
        on:submit={handleSectionSubmit}
        on:fileupload={handleFileUpload}
      />
    </Accordion>
  {/each}
</div>

<style>
  .container {
    @apply max-w-screen-xl bg-white rounded-lg shadow-sm;
  }
</style>
