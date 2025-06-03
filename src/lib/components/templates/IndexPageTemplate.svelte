<script lang="ts">
  import { Download, Layout, Plus, Filter } from "lucide-svelte";
  import Button from "../common/Button.svelte";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  export let title = "";
  export let subtitle = "";
  export let showExport = false;
  export let showAdd = false;
  export let addButtonText = "Add New";
  export let onAdd = () => {};
  export let onExport = () => {};
  export let showFilter = false;
  export let showView = false;
  export let onFilter = () => {};
  export let onView = () => {};
  export let filterText = "Filter";
  export let viewText = "View";
  export let selectedFilterCount = 0;

  const isMobile = writable(false);
  const sidebarOpen = writable(false);

  onMount(() => {
    if (!browser) return;

    const checkMobile = () => isMobile.set(window.innerWidth < 1024);
    checkMobile();

    window.addEventListener("resize", checkMobile);
    const stored = localStorage.getItem("sidebarOpen");
    if (stored) sidebarOpen.set(stored === "true");

    const onStorage = (e: StorageEvent) => {
      if (e.key === "sidebarOpen") sidebarOpen.set(e.newValue === "true");
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("storage", onStorage);
    };
  });
</script>

<div
  class="page-wrapper mobile-adjusted overflow-x-hidden max-w-full"
  class:mobile-sidebar-open={$isMobile && $sidebarOpen}
  id="index-page-template"
>
  <!-- FIXED: Robust Single-Row Flex Layout -->
  <header class="w-full px-4 py-4 mb-6">
    <!-- Title & Subtitle Section -->
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">
        {title}
      </h1>
      {#if subtitle}
        <p class="text-gray-600 text-sm">
          {subtitle}
        </p>
      {/if}
      <slot name="header-left" />
    </div>

    <!-- Action Buttons - Single Row with Flex -->
    {#if showFilter || showView || showExport || showAdd}
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <!-- Left-aligned actions (Filter, View) -->
        <div class="flex items-center gap-2 flex-shrink-0">
          {#if showFilter}
            <Button variant="none" size="sm" on:click={onFilter}>
              <span class="flex items-center gap-1.5">
                <Filter size="16" />
                {#if selectedFilterCount > 0}
                  <span
                    class="filter-badge bg-primary text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center"
                  >
                    {selectedFilterCount}
                  </span>
                {/if}
                <span class="hidden sm:inline whitespace-nowrap"
                  >{filterText}</span
                >
              </span>
            </Button>
          {/if}

          {#if showView}
            <Button variant="none" size="sm" on:click={onView}>
              <span class="flex items-center gap-1.5">
                <Layout size="16" />
                <span class="hidden sm:inline whitespace-nowrap"
                  >{viewText}</span
                >
              </span>
            </Button>
          {/if}
        </div>

        <!-- Spacer to push right actions to the end -->
        <div class="flex-1 min-w-2"></div>

        <!-- Right-aligned actions (Export, Add) -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <slot name="header-right-start" />

          {#if showExport}
            <Button variant="outline" on:click={onExport}>
              <span class="flex items-center gap-1.5">
                <Download size="16" />
                <span class="hidden sm:inline whitespace-nowrap">Export</span>
              </span>
            </Button>
          {/if}

          {#if showAdd}
            <Button variant="primary" on:click={onAdd}>
              <span class="flex items-center gap-1.5">
                <Plus size={16} />
                <span class="hidden sm:inline whitespace-nowrap"
                  >{addButtonText}</span
                >
                <span class="sm:hidden">Add</span>
              </span>
            </Button>
          {/if}

          <slot name="header-right-end" />
        </div>
      </div>
    {/if}
  </header>

  <!-- Content Container -->
  <div class="content-container bg-white rounded-lg shadow-sm overflow-hidden">
    <slot />
  </div>
</div>

<style>
  .page-wrapper {
    @apply min-h-[calc(100vh-4rem)] relative w-full transition-transform;
    overflow-x: hidden;
    max-width: 100vw;
  }

  .mobile-sidebar-open {
    overflow-x: hidden;
    max-height: 100vh;
    width: 100%;
    max-width: 100vw;
    opacity: 0.9;
    pointer-events: none;
  }

  .mobile-adjusted {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }

  /* Filter badge styling */
  :global(.filter-badge) {
    font-size: 0.75rem;
    line-height: 1rem;
    min-width: 1.25rem;
    height: 1.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .content-container {
      border-radius: 0.5rem;

      /* margin: 0 -0.5rem; */
    }
  }

  @media (max-width: 1023px) {
    .mobile-adjusted {
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
    }
  }
</style>
