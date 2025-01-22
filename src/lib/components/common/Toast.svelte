<script lang="ts">
    import { toastStore } from './stores/toast.store';
    import { fade, fly } from 'svelte/transition';
    import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-svelte';

    // Constants for styling
    const TOAST_STYLES = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-gray-600',
        warning: 'bg-yellow-500'
    };

    const ICON_COMPONENTS = {
        success: CheckCircle,
        error: XCircle,
        info: Info,
        warning: AlertTriangle
    };
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    {#each $toastStore as toast (toast.id)}
        <div
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-lg min-w-300 {TOAST_STYLES[toast.type]}"
            in:fly={{ y: -50, duration: 200 }}
            out:fade
        >
            <svelte:component this={ICON_COMPONENTS[toast.type]} class="w-6 h-6" />
            <span>{toast.message}</span>
        </div>
    {/each}
</div>

<style>
  .fixed {
    position: fixed;
  }

  .top-4 {
    top: 1rem;
  }

  .right-4 {
    right: 1rem;
  }

  .z-50 {
    z-index: 50;
  }

  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .gap-2 {
    gap: 0.5rem;
  }

  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .py-2 {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .rounded-lg {
    border-radius: 0.5rem;
  }

  .text-white {
    color: white;
  }

  .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .min-w-300 {
    min-width: 300px;
  }

  .bg-green-500 {
    background-color: #10b981;
  }

  .bg-red-500 {
    background-color: #ef4444;
  }

  .bg-gray-600 {
    background-color: #4b5563;
  }

  .bg-yellow-500 {
    background-color: #f59e0b;
  }
</style>