<script lang="ts">
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { onMessageListener } from "$lib/firebase/getFCMToken";
  import { notifications, addNotification } from "$lib/stores/notifications";
  import { CheckIcon } from "lucide-svelte";

  function handleForegroundMessage(payload: any) {
    const title = payload.notification?.title || "New Message";
    const body = payload.notification?.body || "Check this out";
    addNotification(title, body);
  }

  onMount(() => {
    onMessageListener(handleForegroundMessage);
  });
</script>

{#each $notifications as notification (notification.id)}
  <div
    class="fixed top-5 right-5 w-80 bg-white shadow-lg rounded-lg p-4 flex items-start gap-3 z-50 border-l-4 border-blue-500"
    transition:fade={{ duration: 300 }}
  >
    <CheckIcon class="w-6 h-6 text-blue-500 mt-0.5 flex-shrink-0" />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-gray-900 truncate">
        {notification.title}
      </p>
      <p class="text-sm text-gray-600 mt-1 break-words">{notification.body}</p>
    </div>
    <button
      class="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
      on:click={() =>
        notifications.update((n) =>
          n.filter((notif) => notif.id !== notification.id)
        )}
    >
      ×
    </button>
  </div>
{/each}
