<script lang="ts">
  import "../app.css";
  import Sidebar from "$lib/components/common/Sidebar.svelte";
  import { page } from "$app/stores";
  import Toast from "$lib/components/common/Toast.svelte";
  import { writable } from "svelte/store";
  export let data;
  $: ({ isAuthenticated } = data);
  $: isPublicPage = ["/login"].includes($page.url.pathname);

  export const ssr = false;

  const isSidebarOpen = writable(false);

  function handleSidebarToggle(event: CustomEvent) {
    isSidebarOpen.set(event.detail);
  }
</script>

<div class="min-h-screen bg-surface-muted" data-theme="tendlyPro">
  {#if !isPublicPage}
    <div class="flex">
      {#if isAuthenticated}
        <Sidebar on:toggleSidebar={handleSidebarToggle} />
      {/if}
      <div
        class="flex-1 transition-all duration-300 ease-in-out {isAuthenticated
          ? $isSidebarOpen
            ? 'ml-20 lg:ml-20' /* Sidebar open */
            : 'ml-0 lg:ml-64' /* Sidebar closed */
          : ''}"
      >
        <div class="p-4 md:p-6 lg:p-8">
          <slot />
          <Toast />
        </div>
      </div>
    </div>
  {:else}
    <slot />
  {/if}
</div>

<style>
  :global(body) {
    font-family: Inter, system-ui, sans-serif;
    color: #111827;
  }

  :global(.bg-surface-muted) {
    background-color: #f6f7fb;
  }
</style>
