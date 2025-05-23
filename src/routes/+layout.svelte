<script lang="ts">
  import "../app.css";
  import Sidebar from "$lib/components/common/Sidebar.svelte";
  import { page } from "$app/stores";
  import Toast from "$lib/components/common/Toast.svelte";
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import FcmToast from "$lib/components/common/FCMToast.svelte";
  import { auth } from "$lib/stores/auth";
  import { fcmTokenApi } from "$lib/services/api/fcm";
  import { getFCMToken } from "$lib/firebase/getFCMToken";

  export let data;
  $: ({ isAuthenticated } = data);
  $: isPublicPage = ["/login"].includes($page.url.pathname);

  const userId = $auth.user?._id || "";
  export const ssr = false;
  let notifications: { id: string; title: string; body: string }[] = [];

  // src/lib/service-worker.ts

  // Initialize FCM when user is authenticated
  $: if (browser && isAuthenticated && $auth.user?._id) {
    initializeFCM($auth.user._id);
  }

  // // Reset FCM when user logs out
  // $: if (browser && !isAuthenticated) {
  //     fcmService?.reset();
  // }

  onMount(() => {
    if (browser) {
      import("../lib/service-worker");
    }
    console.log("first", "serviceWorker" in navigator);
  });

  async function initializeFCM(userId: string) {
    try {
      const token: any = await getFCMToken();
      console.log("FCM Token:", token);
      if (token && userId) {
        const result = await fcmTokenApi.save(userId, token);
        console.log(result, "FCM Token saved successfully");
      }
    } catch (error) {
      console.error("Failed to initialize FCM:", error);
    }
  }

  const isSidebarOpen = writable(false);

  function handleSidebarToggle(event: CustomEvent) {
    isSidebarOpen.set(event.detail);
  }
</script>

<div class="min-h-screen bg-surface-muted" data-theme="tendlyPro">
  {#if !isPublicPage}
    <div class="flex">
      {#if isAuthenticated}
        <Sidebar on:toggleSidebar={handleSidebarToggle} />
      {/if}
      <div
        class="flex-1 transition-all duration-300 ease-in-out {isAuthenticated
          ? $isSidebarOpen
            ? 'ml-20 lg:ml-20' /* Sidebar open */
            : 'ml-0 lg:ml-64' /* Sidebar closed */
          : ''}"
      >
        <div class="p-4 md:p-6 lg:p-8">
          <slot />
          <Toast />
        </div>
      </div>
    </div>
  {:else}
    <slot />
  {/if}
  {#if isAuthenticated}
    <FcmToast />
  {/if}
</div>

<style>
  :global(body) {
    font-family: Inter, system-ui, sans-serif;
    color: #111827;
  }

  :global(.bg-surface-muted) {
    background-color: #f6f7fb;
  }
</style>
