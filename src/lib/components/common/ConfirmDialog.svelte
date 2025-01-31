<script lang="ts">
    

    import { createEventDispatcher } from 'svelte';
    import Modal from './Modal.svelte';
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
  
  <Modal {show} title={config.title} onClose={handleCancel}>
    <div class="space-y-4">
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
        <button 
          class="btn {config.type === 'danger' ? 'btn-error' : 'btn-primary'}" 
          on:click={handleConfirm}
        >
          {config.confirmText || 'Confirm'}
        </button>
      </div>
    </div>
  </Modal>
  