<script lang="ts">
  import Accordion from "../common/Accordion.svelte";
  import EmployeeDetailsSection from "./EmployeeDetailsSection.svelte";
  import TaxableIncomeSummarySection from "./TaxableIncomeSummarySection.svelte";
  import TaxRegimeSection from "./TaxRegimeSection.svelte";

  export let taxDeclaration;
  export let taxSlabs;
  $: showITDeclaration = taxDeclaration?.regime === "old";

  console.log(taxSlabs, taxDeclaration, showITDeclaration);

  let openAccordion = 1;

  function handleToggle(event: CustomEvent) {
    const { id, isOpen } = event.detail;
    openAccordion = isOpen ? id : null;
  }
  /*
TaxDeclaration.svelte (Container)
├── TaxRegimeSection.svelte
├── EmployeeDetailsSection.svelte
├── IncomeDetailsSection.svelte
├── TaxableIncomeSummarySection.svelte
├── TaxCalculationPreviewSection.svelte
└── ITDeclarationSection.svelte (Conditional for Old Regime)
*/
  let sections = [
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
      props: {
        taxDeclaration,
      },
    },
    {
      id: 4,
      title: "Tax Calculation Preview",
      isOpen: false,
      content: "Content for section 5...",
    },
  ];
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
        <svelte:component this={section.component} {...section.props || {}} />
      {:else}
        {section.content}
      {/if}
    </Accordion>
  {/each}
</div>

<style>
  .container {
    padding: 24px;
    background: white;
    min-height: 100vh;
  }
</style>
