<script lang="ts">
  import '../app.css';
  import Sidebar from '$lib/components/common/Sidebar.svelte';
  import { page } from '$app/stores';

  export let data;
  $: ({ isAuthenticated, userRole } = data);
  $: isPublicPage = ['/login'].includes($page.url.pathname);

  export const ssr = false;
</script>

<div class="min-h-screen bg-base-200" data-theme="tendlyPro">
  {#if !isPublicPage}
    <div class="flex">
      {#if isAuthenticated}
        <Sidebar />
      {/if}
      <div class="flex-1 {isAuthenticated ? 'ml-64' : ''}">
        <div class="p-6">
          <slot />
        </div>
      </div>
    </div>
  {:else}
    <slot />
  {/if}
</div> 