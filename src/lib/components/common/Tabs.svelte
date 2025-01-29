<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  export let tabs: { id: string; label: string }[];
  export let urlParam = 'tab';  // Allow custom URL parameter name
  export let preserveParams: string[] = []; // Optional array of params to preserve
  
  // Get active tab from URL or default to first tab
  $: activeTab = $page.url.searchParams.get(urlParam) || tabs[0]?.id;

  function handleTabClick(tabId: string) {
    const url = new URL(window.location.href);
    
    // Clear all existing search params
    const paramsToKeep = new URLSearchParams();
    
    // Add back the params we want to preserve
    if (preserveParams.length > 0) {
      preserveParams.forEach(param => {
        const value = url.searchParams.get(param);
        if (value) {
          paramsToKeep.set(param, value);
        }
      });
    }
    
    // Set the tab parameter
    paramsToKeep.set(urlParam, tabId);
    
    // Update the URL with only preserved params and the tab
    const newUrl = new URL(url.pathname, url.origin);
    newUrl.search = paramsToKeep.toString();
    
    goto(newUrl.toString(), { replaceState: true });
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

