<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let items: { id: string; label: string; disabled?: boolean }[] = [];
  export let value: string = '';

  const dispatch = createEventDispatcher();

  function handleClick(id: string) {
    if (value !== id) {
      dispatch('change', id);
    }
  }
</script>

<div class="flex gap-2">
  {#each items as item}
    <button
      class="py-2 px-4 rounded font-medium transition-colors duration-200 border focus:outline-none"
      class:bg-blue-600={value === item.id}
      class:text-white={value === item.id}
      class:bg-white={value !== item.id}
      class:text-blue-600={value !== item.id}
      class:border-blue-600={value === item.id}
      class:border-gray-300={value !== item.id}
      disabled={item.disabled}
      aria-pressed={value === item.id}
      on:click={() => handleClick(item.id)}
      type="button"
    >
      {item.label}
    </button>
  {/each}
</div>

<style>
  button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style> 