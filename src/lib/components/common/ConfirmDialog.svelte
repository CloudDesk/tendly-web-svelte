<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { DialogConfig } from '$lib/types';

  export let show = false;
  export let config: DialogConfig;

  const dispatch = createEventDispatcher();

  const handleConfirm = () => {
    dispatch('confirm');
    show = false;
  };

  const handleCancel = () => {
    dispatch('cancel');
    show = false;
  };
</script>

{#if show}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div class="bg-white rounded-lg w-full max-w-sm mx-4 shadow-lg">
      <div class="p-4 border-b flex justify-between items-center">
        <h3 class="text-lg font-semibold">{config.title}</h3>
        <button class="text-gray-500 hover:text-gray-700" on:click={handleCancel}>✕</button>
      </div>
      <div class="p-4 space-y-4">
        <div class="text-base-content">
          {#if config.type === 'warning'}
            <div class="alert alert-warning">{config.message}</div>
          {:else if config.type === 'danger'}
            <div class="alert alert-error">{config.message}</div>
          {:else}
            <div class="alert alert-info">{config.message}</div>
          {/if}
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn btn-ghost" on:click={handleCancel}>
            {config.cancelText || 'Cancel'}
          </button>
          <button class="btn {config.type === 'danger' ? 'btn-error' : 'btn-primary'}" on:click={handleConfirm}>
            {config.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
