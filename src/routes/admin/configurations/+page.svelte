<script lang="ts">
    import { page } from '$app/stores';
  import Tabs from '$lib/components/common/Tabs.svelte';
  import ShiftManagement from '$lib/components/management/ShiftManagement.svelte';
  import TrainingManagement from '$lib/components/management/TrainingManagement.svelte';
  import ConfigManagement from '$lib/components/management/ConfigManagement.svelte';
  import OrgChart from '$lib/components/employee/OrgChart.svelte';

  const tabs = [
    { id: 'configs', label: 'Configs' },
    { id: 'shifts', label: 'Shifts' },
    { id: 'trainings', label: 'Trainings' },
    {id:'org',label:'Org Chart'}

  ];

  $: activeTab = $page.url.searchParams.get('tab') || tabs[0]?.id;
</script>

<div class="container mx-auto p-4">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-neutral">Management</h1>
  </div>
  
  <div class="card">
    <div class="card-body">
      <Tabs {tabs}>
        {#if activeTab === 'shifts'}
          <ShiftManagement />
        {:else if activeTab === 'trainings'}
          <TrainingManagement />
        {:else if activeTab === 'configs'}
          <ConfigManagement />
        {:else if activeTab ==='org'}
        <OrgChart/>
        {/if}
      </Tabs>
    </div>
  </div>
</div> 