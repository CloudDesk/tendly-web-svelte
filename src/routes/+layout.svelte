<script lang="ts">
  import "../app.css";
  import Sidebar from "$lib/components/common/Sidebar.svelte";
  import { page } from "$app/stores";
  import Toast from "$lib/components/common/Toast.svelte";
  export let data;
  $: ({ isAuthenticated } = data);
  $: isPublicPage = ["/login"].includes($page.url.pathname);

  export const ssr = false;

  let isSidebarOpen = false;

  function handleSidebarToggle(event: CustomEvent) {
    isSidebarOpen = event.detail;
  }
</script>

<div class="min-h-screen bg-base-200" data-theme="tendlyPro">
  {#if !isPublicPage}
    <div class="flex">
      {#if isAuthenticated}
        <Sidebar on:toggleSidebar={handleSidebarToggle} />
      {/if}
      <div
        class={`flex-1 transition-all duration-200 ${
          isAuthenticated
            ? isSidebarOpen
              ? "ml-28 lg:ml-16" /* Sidebar open */
              : "ml-0 lg:ml-64" /* Sidebar closed */
            : ""
        }`}
      >
        <div class="p-6">
          <slot />
          <Toast />
        </div>
      </div>
    </div>
  {:else}
    <slot />
  {/if}
</div>
