<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { SvelteComponent } from "svelte";

  export let icon: typeof SvelteComponent;
  export let label: string;
  export let iconColor: string = "text-blue-600";
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher();

  function handleClick() {
    if (!disabled) {
      dispatch('click');
    }
  }
</script>

<button 
  class="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  {disabled}
  on:click={handleClick}
>
  <svelte:component this={icon} class="w-5 h-5 {iconColor} mr-2" />
  <span class="text-sm font-medium text-gray-700">{label}</span>
</button> 