<script lang="ts">
  import Button from "../common/Button.svelte";
  import { ChevronLeft } from "lucide-svelte";

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
  export let infoType = "info"; // info, warning, error, success

  function getInfoColor(type: string) {
    switch (type) {
      case "warning":
        return "amber";
      case "error":
        return "red";
      case "success":
        return "green";
      case "info":
      default:
        return "blue";
    }
  }
</script>

<div class="page-wrapper max-w-7xl mx-auto">
  <header
    class="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
  >
    <div class="header-left">
      <div class="flex items-center gap-2">
        {#if backLink}
          <a href={backLink} class="text-gray-500 hover:text-primary">
            <ChevronLeft size={20} />
          </a>
        {/if}
        <h1 class="text-2xl font-semibold text-gray-900">{title}</h1>
      </div>
      {#if subtitle}
        <p class="text-sm text-gray-500 mt-1">{subtitle}</p>
      {/if}
    </div>

    {#if showActions}
      <div class="header-right flex flex-wrap items-center gap-3">
        {#each actions as action}
          <Button
            variant={action.variant || "outline"}
            on:click={action.handler}
            disabled={action.disabled || false}
          >
            {#if action.icon}
              <span class="flex items-center gap-2">
                <svelte:component this={action.icon} size={16} />
                {action.label}
              </span>
            {:else}
              {action.label}
            {/if}
          </Button>
        {/each}
      </div>
    {/if}
  </header>

  {#if infoMessage}
    <div
      class="info-banner bg-{getInfoColor(
        infoType
      )}-50 border-l-4 border-{getInfoColor(infoType)}-500 p-4 rounded-md mb-6"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-{getInfoColor(infoType)}-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-{getInfoColor(infoType)}-700">{infoMessage}</p>
        </div>
      </div>
    </div>
  {/if}

  <div class="content-container space-y-6">
    <slot />
  </div>
</div>

<style>
  .page-wrapper {
    @apply min-h-[calc(100vh-4rem)];
  }
</style>
