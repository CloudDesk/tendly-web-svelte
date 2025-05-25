<script lang="ts">
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { onMessageListener } from "$lib/firebase/getFCMToken";
  import { CheckIcon, X } from "lucide-svelte";

  interface Notification {
    id: string;
    title: string;
    body: string;
    timestamp: number;
  }

  let notifications: Notification[] = [];

  function addNotification(title: string, body: string) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      title,
      body,
      timestamp: Date.now()
    };

    notifications = [notification, ...notifications];

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  }

  function removeNotification(id: string) {
    notifications = notifications.filter(n => n.id !== id);
  }

  function handleForegroundMessage(payload: any) {
    const title = payload.notification?.title || "New Message";
    const body = payload.notification?.body || "Check this out";
    addNotification(title, body);
  }

  onMount(() => {
    onMessageListener(handleForegroundMessage);
  });
</script>

<div class="fixed top-5 right-5 z-50 space-y-2">
  {#each notifications as notification (notification.id)}
    <div 
      class="w-80 bg-white shadow-lg rounded-lg p-4 flex items-start gap-3 border-l-4 border-blue-500"
      transition:fade={{ duration: 300 }}
    >
      <CheckIcon class="w-6 h-6 text-blue-500 mt-0.5 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-900 truncate">
          {notification.title}
        </p>
        <p class="text-sm text-gray-600 mt-1 break-words">
          {notification.body}
        </p>
      </div>
      <button 
        class="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 p-1 rounded hover:bg-gray-100"
        on:click={() => removeNotification(notification.id)}
        aria-label="Close notification"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  {/each}
</div>