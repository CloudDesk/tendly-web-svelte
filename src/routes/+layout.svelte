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
  import { getFCMToken } from "$lib/firebase/getFCMToken";
  import { employeesApi } from "$lib/services/api";

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

  onMount(() => {
    if (browser) {
      import("../lib/service-worker"); // for PWA
    }
    console.log("first", "serviceWorker" in navigator);
  });

  async function initializeFCM(userId: string) {
    try {
      const token: any = await getFCMToken();
      console.log("FCM Token:", token);
      if (token && userId) {
        const result = await employeesApi.fcmToken(userId, token);
        console.log(result, "FCM Token saved successfully");
      }
    } catch (error) {
      console.error("Failed to initialize FCM:", error);
    }
  }

  const isSidebarCollapsed = writable(false);
  const isMobileSidebarOpen = writable(false);

  function handleSidebarToggle(event: CustomEvent) {
    isSidebarCollapsed.set(event.detail);
  }

  function handleMobileSidebarToggle(event: CustomEvent) {
    isMobileSidebarOpen.set(event.detail);
  }
</script>

<div
  class="min-h-screen max-h-screen bg-surface-muted overflow-hidden"
  data-theme="tendlyPro"
>
  {#if !isPublicPage}
    <div class="flex h-screen">
      {#if isAuthenticated}
        <Sidebar
          on:toggleSidebar={handleSidebarToggle}
          on:toggleSidebar2={handleMobileSidebarToggle}
        />
      {/if}
      <div
        class="flex-1 transition-all duration-300 ease-in-out overflow-hidden {isAuthenticated
          ? $isSidebarCollapsed
            ? 'lg:ml-20 ml-0' /* Collapsed sidebar on desktop, no margin on mobile */
            : 'lg:ml-64 ml-0' /* Full sidebar on desktop, no margin on mobile */
          : ''}"
      >
        <div class="h-full overflow-y-auto">
          <div class="p-4 md:p-6 lg:p-8 min-h-full">
            <slot />
            <Toast />
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="h-screen overflow-y-auto">
      <slot />
    </div>
  {/if}
  {#if isAuthenticated}
    <FcmToast />
  {/if}
</div>

<style>
  :global(body) {
    font-family: Inter, system-ui, sans-serif;
    color: #111827;
    overflow: hidden; /* Prevent body scroll */
  }

  :global(.bg-surface-muted) {
    background-color: #f6f7fb;
  }

  /* Ensure proper mobile viewport handling */
  :global(html) {
    height: 100%;
    overflow: hidden;
  }

  /* Custom scrollbar for content areas */
  :global(.overflow-y-auto::-webkit-scrollbar) {
    width: 6px;
  }

  :global(.overflow-y-auto::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  :global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
    background: rgba(0, 0, 0, 0.2);
  }
</style>
