<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  export let tabs: { id: string; label: string }[];
  export let urlParam = 'tab';  // Allow custom URL parameter name
  
  // Get active tab from URL or default to first tab
  $: activeTab = $page.url.searchParams.get(urlParam) || tabs[0]?.id;

  function handleTabClick(tabId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set(urlParam, tabId);
    goto(url.toString(), { replaceState: true });
  }
</script>

<div class="w-full">
  <nav class="border-b border-gray-200">
    <div class="flex space-x-8">
      {#each tabs as tab}
        <button
          class="tab-item py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm transition-colors duration-200 ease-out whitespace-nowrap"
         
          class:active={activeTab === tab.id}
        
          on:click={() => handleTabClick(tab.id)}
        >
      {tab.label}
    </button>
  {/each}
  </div>
  </nav>
  <div class="mt-6">
    <slot {activeTab} />
  </div> 
</div>

