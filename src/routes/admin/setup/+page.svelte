<script>
  import { page } from "$app/stores";
  import { onDestroy } from "svelte";
  import { derived } from "svelte/store";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import ShiftManagement from "$lib/components/setup/shifts/ShiftManagement.svelte";
  import TrainingManagement from "$lib/components/setup/TrainingManagement.svelte";
  import ConfigManagement from "$lib/components/setup/ConfigManagement.svelte";
  import OrgChart from "$lib/components/employee/OrgChart.svelte";
  import SalaryStructureManagement from "$lib/components/setup/SalaryStructureManagement.svelte";
  import TaxSlabManagement from "$lib/components/setup/TaxSlabManagement.svelte";
  import HolidayCalendar from "$lib/components/setup/holiday/HolidayCalendar.svelte";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";
  import Form16Upload from "$lib/components/documentCenter/Form16Upload.svelte";

  const tabs = [
    { id: "lovs", label: "LOVs" },
    { id: "shifts", label: "Shifts" },
    { id: "trainings", label: "Trainings" },
    { id: "salary", label: "Salary Structure" },
    { id: "taxslab", label: "Tax Slab" },
    { id: "holiday", label: "Holiday Calendar" },
    { id: "form16", label: "Form16" },
    { id: "org", label: "Org Chart" },
  ];

  // Reactive derived store to update the active tab based on the URL
  const activeTab = derived(
    page,
    ($page) => $page.url.searchParams.get("tab") || tabs[0]?.id
  );

  let showModal = false;

  const unsubscribe = activeTab.subscribe((tab) => {
    console.log(tab, "tabb");
    showModal = tab === "dataunit";
  });

  onDestroy(unsubscribe);

  function closeModal() {
    showModal = false;
    history.pushState({}, "", "?tab=configs");
  }

  function openModal() {
    showModal = true;
  }
</script>

<IndexPageTemplate
  title="Setup"
  subtitle="Manage your organization's Setup"
  hasContainerShadow={false}
>
  <ContentCard noPadding={true}>
    <Tabs {tabs}>
      {#if $activeTab === "shifts"}
        <ShiftManagement />
      {:else if $activeTab === "trainings"}
        <TrainingManagement />
      {:else if $activeTab === "lovs"}
        <ConfigManagement />
      {:else if $activeTab === "org"}
        <OrgChart />
      {:else if $activeTab === "salary"}
        <SalaryStructureManagement />
      {:else if $activeTab === "taxslab"}
        <TaxSlabManagement />
      {:else if $activeTab === "holiday"}
        <HolidayCalendar />
      {:else if $activeTab === "form16"}
        <Form16Upload />
        <!-- {:else if $activeTab === "weekends"}
          <WeekendCalendar /> -->
      {/if}
    </Tabs>
  </ContentCard>
</IndexPageTemplate>
