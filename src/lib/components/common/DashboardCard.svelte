<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { SvelteComponent } from "svelte";

  export let title: string;
  export let value: string | number;
  export let subtitle: string = "";
  export let icon: typeof SvelteComponent;
  export let iconColor: string = "text-white";
  export let bgColor: string = "bg-blue-500";
  export let gradientFrom: string = "from-blue-50";
  export let gradientTo: string = "to-blue-100";
  export let borderColor: string = "border-blue-200";
  export let textColor: string = "text-blue-600";
  export let valueColor: string = "text-blue-900";
  export let clickable: boolean = false;

  const dispatch = createEventDispatcher();

  function handleClick() {
    if (clickable) {
      dispatch('click');
    }
  }

  $: cardClasses = `
    bg-gradient-to-br ${gradientFrom} ${gradientTo} 
    border ${borderColor} rounded-xl p-6 shadow-sm 
    transition-shadow duration-200 ease-in-out
    ${clickable ? 'cursor-pointer hover:shadow-md' : 'hover:shadow-md'}
  `;
</script>

<div class={cardClasses} on:click={handleClick}>
  <div class="flex items-center justify-between">
    <div>
      <p class="{textColor} text-sm font-medium mb-1">{title}</p>
      <p class="text-3xl font-bold {valueColor}">{value}</p>
      {#if subtitle}
        <p class="{textColor} text-xs mt-1">{subtitle}</p>
      {/if}
    </div>
    <div class="{bgColor} p-3 rounded-lg">
      <svelte:component this={icon} class="w-6 h-6 {iconColor}" />
    </div>
  </div>
</div>

<style>
  .bg-gradient-to-br {
    background: linear-gradient(to bottom right, var(--tw-gradient-stops));
  }
</style> 