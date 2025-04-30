<script>
  import { page } from "$app/stores";
  import { onDestroy } from "svelte";
  import { derived } from "svelte/store";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import ShiftManagement from "$lib/components/management/shifts/ShiftManagement.svelte";
  import TrainingManagement from "$lib/components/management/TrainingManagement.svelte";
  import ConfigManagement from "$lib/components/management/ConfigManagement.svelte";
  import OrgChart from "$lib/components/employee/OrgChart.svelte";
  import SalaryStructureManagement from "$lib/components/management/SalaryStructureManagement.svelte";
  import TaxSlabManagement from "$lib/components/management/TaxSlabManagement.svelte";
  import HolidayCalendar from "$lib/components/management/holiday/HolidayCalendar.svelte";

  const tabs = [
    { id: "configs", label: "Configs" },
    { id: "shifts", label: "Shifts" },
    { id: "trainings", label: "Trainings" },
    { id: "salary", label: "Salary Structure" },
    { id: "taxslab", label: "Tax Slab" },
    { id: "holiday", label: "Holiday Calendar" },
    // { id: "weekends", label: "Weekends" },
    { id: "org", label: "Org Chart" },
    // { id: "dataunit", label: "Data Unit" }
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

<div class="container mx-auto p-4">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-neutral">Management</h1>
  </div>

  <div class="card">
    <div class="card-body">
      <Tabs {tabs}>
        {#if $activeTab === "shifts"}
          <ShiftManagement />
        {:else if $activeTab === "trainings"}
          <TrainingManagement />
        {:else if $activeTab === "configs"}
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
