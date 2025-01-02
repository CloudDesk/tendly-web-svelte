<script lang="ts">
  export let show = false;
  export let title: string;
  export let onClose: () => void;
</script>

{#if show}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
    <div class="bg-white rounded-lg w-full max-w-2xl mx-4">
      <div class="p-4 border-b flex justify-between items-center">
        <h3 class="text-lg font-semibold">{title}</h3>
        <button class="text-gray-500 hover:text-gray-700" on:click={onClose}>
          ✕
        </button>
      </div>
      <div class="p-4">
        <slot />
      </div>
    </div>
  </div>
{/if} 