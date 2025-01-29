<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import Tabs from '$lib/components/common/Tabs.svelte';
  import AssignedLeaves from '$lib/components/managerActions/AssignedLeaves.svelte'
  import Regularization from '$lib/components/managerActions/Regularization.svelte';
  import { page } from '$app/stores';
  const tabs = [
    { id: 'leave', label: 'Leave' },
    { id: 'regularization', label: 'Regularization' }
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
        {#if activeTab === 'leave'}
          <AssignedLeaves />
        {:else if activeTab === 'regularization'}
          <Regularization />
        {/if}
      </Tabs>
    </div>
  </div>
</div> 