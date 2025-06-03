<script lang="ts">
  import Button from "../common/Button.svelte";
  import { ChevronLeft } from "lucide-svelte";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  export let title = "";
  export let subtitle = "";
  export let backLink = "";
  export let showActions = false;
  export let actions: {
    label: string;
    handler: () => void;
    variant?: "text" | "primary" | "outline";
    icon?: any;
    disabled?: boolean;
  }[] = [];
  export let infoMessage = "";
  export let infoType: keyof typeof colorMap = "info";

  const isMobile = writable(false);
  const sidebarOpen = writable(false);

  const colorMap = {
    warning: "amber",
    error: "red",
    success: "green",
    info: "blue",
  };
  $: infoColor = colorMap[infoType] || "blue";
  $: bgClass = `bg-${infoColor}-50`;
  $: borderClass = `border-${infoColor}-500`;
  $: textClass = `text-${infoColor}-700`;
  $: iconClass = `text-${infoColor}-400`;

  onMount(() => {
    if (!browser) return;

    const checkMobile = () => isMobile.set(window.innerWidth < 1024);
    const onStorage = (e: StorageEvent) =>
      e.key === "sidebarOpen" && sidebarOpen.set(e.newValue === "true");

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("storage", onStorage);

    const storedSidebarState = localStorage.getItem("sidebarOpen");
    if (storedSidebarState) sidebarOpen.set(storedSidebarState === "true");

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("storage", onStorage);
    };
  });
</script>

<div
  class="page-wrapper max-w-7xl mx-auto mobile-adjusted overflow-x-hidden"
  class:mobile-sidebar-open={$isMobile && $sidebarOpen}
  id="detail-page-template"
>
  <!-- FIXED: Robust Single-Row Flex Layout -->
  <header class="w-full px-4 py-4 mb-6">
    <!-- Title & Subtitle Section with Back Button -->
    <div class="mb-4">
      <div class="flex items-start gap-3">
        {#if backLink}
          <a
            href={backLink}
            class="text-gray-500 hover:text-primary flex-shrink-0 mt-1"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </a>
        {/if}
        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-bold text-gray-900 mb-1">
            {title}
          </h1>
          {#if subtitle}
            <p class="text-gray-600 text-sm">
              {subtitle}
            </p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Action Buttons - Single Row with Flex -->
    {#if showActions && actions.length > 0}
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <!-- Actions distributed across available space -->
        <div class="flex items-center gap-2 flex-1 justify-start">
          {#each actions.slice(0, Math.ceil(actions.length / 2)) as action}
            <Button
              variant={action.variant || "outline"}
              on:click={action.handler}
              disabled={action.disabled || false}
              class="flex-shrink-0"
            >
              {#if action.icon}
                <span class="flex items-center gap-1.5">
                  <svelte:component this={action.icon} size={16} />
                  <span class="hidden sm:inline whitespace-nowrap">
                    {action.label}
                  </span>
                </span>
              {:else}
                <span class="whitespace-nowrap hidden sm:inline"
                  >{action.label}</span
                >
                <span class="sm:hidden truncate"
                  >{action.label.split(" ")[0]}</span
                >
              {/if}
            </Button>
          {/each}
        </div>

        <!-- Spacer -->
        <div class="flex-1 min-w-2"></div>

        <!-- Right-aligned actions -->
        <div class="flex items-center gap-2 flex-shrink-0">
          {#each actions.slice(Math.ceil(actions.length / 2)) as action}
            <Button
              variant={action.variant || "outline"}
              on:click={action.handler}
              disabled={action.disabled || false}
              class="flex-shrink-0"
            >
              {#if action.icon}
                <span class="flex items-center gap-1.5">
                  <svelte:component this={action.icon} size={16} />
                  <span class="hidden sm:inline whitespace-nowrap">
                    {action.label}
                  </span>
                </span>
              {:else}
                <span class="whitespace-nowrap hidden sm:inline"
                  >{action.label}</span
                >
                <span class="sm:hidden truncate"
                  >{action.label.split(" ")[0]}</span
                >
              {/if}
            </Button>
          {/each}
        </div>
      </div>
    {/if}
  </header>

  <!-- Info Banner -->
  {#if infoMessage}
    <div class="px-4 mb-6">
      <div
        class={`info-banner ${bgClass} border-l-4 ${borderClass} p-4 rounded-md overflow-x-hidden max-w-full`}
      >
        <div class="flex min-w-0">
          <div class="flex-shrink-0">
            <svg
              class={`h-5 w-5 ${iconClass}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              />
            </svg>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class={`text-sm ${textClass} break-words`}>
              {infoMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Content Container -->
  <div class="content-container space-y-6 overflow-x-hidden max-w-full">
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

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .content-container {
      margin: 0 -0.5rem;
    }

    .info-banner {
      margin-left: -0.5rem;
      margin-right: -0.5rem;
      border-radius: 0;
    }
  }

  @media (max-width: 1023px) {
    .mobile-adjusted {
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
    }
  }

  /* Dynamic column positioning for actions */
  .col-start-9 {
    grid-column-start: 9;
  }
  .col-start-11 {
    grid-column-start: 11;
  }
</style>
