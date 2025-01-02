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

<div class="tabs tabs-boxed bg-base-100 p-1">
  {#each tabs as tab}
    <button
      class="tab transition-all {activeTab === tab.id ? 'tab-active bg-primary text-primary-content shadow-sm' : 'hover:bg-base-200 text-neutral-600'}"
      on:click={() => handleTabClick(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>

<div class="mt-6">
  <slot {activeTab} />
</div> 