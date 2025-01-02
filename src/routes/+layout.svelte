<script lang="ts">
  import '../app.css';
  import Sidebar from '$lib/components/common/Sidebar.svelte';
  import { auth } from '$lib/stores/auth';
  import { page } from '$app/stores';

  $: isLoginPage = $page.url.pathname === '/login';
</script>

<div class="min-h-screen bg-base-200" data-theme="tendlyPro">
  {#if !isLoginPage}
    <div class="flex">
      <Sidebar />
      <div class="flex-1 ml-64">
        <div class="p-6">
          <slot />
        </div>
      </div>
    </div>
  {:else}
    <slot />
  {/if}
</div> 