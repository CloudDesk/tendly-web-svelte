<script lang="ts">
  import Accordion from "../common/Accordion.svelte";
  import EmployeeDetailsSection from "./EmployeeDetailsSection.svelte";
  import TaxableIncomeSummarySection from "./TaxableIncomeSummarySection.svelte";
  import TaxRegimeSection from "./TaxRegimeSection.svelte";
  import TaxComputationSection from "./TaxComputationSection.svelte";
  import ItDeclarationSection from "./ITDeclarationSection.svelte";
  import { createEventDispatcher } from "svelte";
  import ItDeclarationDetails from "../employee/ITDeclarationDetails.svelte";

  export let taxDeclaration;
  export let taxSlabs;

  const dispatch = createEventDispatcher();
  $: showITDeclaration = taxDeclaration?.regime === "old";

  console.log(taxSlabs, taxDeclaration, showITDeclaration);

  let openAccordion = 1;

  function handleToggle(event: CustomEvent) {
    const { id, isOpen } = event.detail;
    openAccordion = isOpen ? id : null;
  }

  $: sections = [
    {
      id: 1,
      title: "Employee Details",
      isOpen: false,
      subtitle: "",
      component: EmployeeDetailsSection,
      props: { taxDeclaration },
    },
    {
      id: 2,
      title: "Tax Regime",
      isOpen: true,
      component: TaxRegimeSection,
      props: {
        taxDeclaration,
        regime: taxDeclaration?.regime,
        financialYear: taxDeclaration?.financialYear,
        taxSlabs: taxSlabs,
      },
    },
    {
      id: 3,
      title: "Taxable Income Summary",
      isOpen: false,
      component: TaxableIncomeSummarySection,
      props: { taxDeclaration },
    },
    {
      id: 4,
      title: "IT Declaration",
      isOpen: false,
      subtitle: "Section 80C, 80D, HRA, and other deductions",
      component: ItDeclarationSection,
      props: { taxDeclaration },
      visible: showITDeclaration,
    },
    {
      id: 5,
      title: "Proof of Investment",
      isOpen: false,
      subtitle: "Upload and track proof documents",
      component: ItDeclarationDetails,
      props: { taxDeclaration, adminOnly: false },
      visible: showITDeclaration,
    },
    {
      id: 6,
      title: "Tax & Statutory Deductions",
      isOpen: false,
      subtitle: "Monthly projection and payment schedule",
      component: TaxComputationSection,
      props: { taxDeclaration },
    },
  ].filter((section) => section.visible !== false);

  function handleGrandchildUpdate(event: CustomEvent) {
    console.log("Forwarding update from grandchild", event.detail);
    dispatch("update", event.detail);
  }

  function handleFileUplaod(event: CustomEvent) {
    console.log("handleFileUplaod", event.detail);
    dispatch("fileupload", event.detail);
  }
</script>

<div class="container">
  {#each sections as section (section.id)}
    <Accordion
      title={section.title}
      subtitle={section?.subtitle || ""}
      id={section.id}
      isOpen={openAccordion === section.id}
      on:toggle={handleToggle}
    >
      {#if section.component}
        <svelte:component
          this={section.component}
          {...section.props || {}}
          on:update={handleGrandchildUpdate}
          on:fileupload={handleFileUplaod}
        />
      {/if}
    </Accordion>
  {/each}
</div>

<style>
  .container {
    padding: 24px;
    background: white;
    overflow: auto;
    /* min-height: 100vh; */
  }
</style>
