<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { slide } from "svelte/transition";
  import { ChevronDown } from "lucide-svelte";

  export let title: string = "Accordion Title";
  export let subtitle: string = "";
  export let isOpen: boolean = false;
  export let id: number = 1;
  export let icon: any = null;
  export let headerClass: string = "";
  export let contentClass: string = "";
  export let disabled: boolean = false;
  export let maxHeight: string = "";
  export let hideIcon: boolean = false;

  const dispatch = createEventDispatcher();

  function toggle() {
    if (disabled) return;
    isOpen = !isOpen;
    dispatch("toggle", { id, isOpen });
  }
</script>

<div
  class={`accordion border ${isOpen ? "border-blue-400" : "border-gray-200"}  rounded-lg mb-2 bg-white shadow-sm overflow-hidden`}
>
  <button
    class={`w-full flex justify-between items-center p-4 text-left transition-all duration-300 
          ${isOpen ? "bg-blue-100 text-blue-800 shadow-md" : "bg-white text-gray-900"} 
          ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"} 
          focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 ${headerClass}`}
    on:click={toggle}
    aria-expanded={isOpen}
    {disabled}
    type="button"
  >
    <div class="flex items-center">
      {#if icon}
        <span class="mr-3 text-gray-600">
          <svelte:component this={icon} />
        </span>
      {/if}
      <div>
        <span class="text-lg font-semibold">{title}</span>
        {#if subtitle}
          <p class="text-sm text-gray-500 mt-1">{subtitle}</p>
        {/if}
      </div>
    </div>

    {#if !hideIcon}
      <span
        class={`transition-transform transform duration-300 ${isOpen ? "rotate-180" : ""}`}
      >
        <ChevronDown class="w-5 h-5 text-gray-500" />
      </span>
    {/if}
  </button>

  {#if isOpen}
    <div
      class={`accordion-content bg-white ${contentClass} transition-all duration-300`}
      transition:slide={{ duration: 300 }}
    >
      <div
        class="p-4 text-gray-700"
        style={maxHeight ? `max-height: ${maxHeight}; overflow-y: auto;` : ""}
      >
        <slot />
      </div>
    </div>
  {/if}
</div>
