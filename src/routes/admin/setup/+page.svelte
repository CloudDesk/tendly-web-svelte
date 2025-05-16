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

  const tabs = [
    { id: "lovs", label: "LOVs" },
    { id: "shifts", label: "Shifts" },
    { id: "trainings", label: "Trainings" },
    { id: "salary", label: "Salary Structure" },
    { id: "taxslab", label: "Tax Slab" },
    { id: "holiday", label: "Holiday Calendar" },
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

<div class="page-container">
  <header>
    <div class="header-left">
      <h1>Setup</h1>
    </div>
  </header>

  <div class="card">
    <div class="card-body">
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
          <!-- {:else if $activeTab === "weekends"}
          <WeekendCalendar /> -->
        {/if}
      </Tabs>
    </div>
  </div>
</div>

<style>
  .page-container {
    padding: 24px;
    background: #f6f7fb;
    min-height: 100vh;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #323338;
    margin: 0;
  }
</style>
