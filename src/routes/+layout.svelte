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
  import { Menu, ChevronLeft } from "lucide-svelte";
  import logo from "$lib/assets/T_logo_Full.png";

  export let data;
  $: ({ isAuthenticated } = data);
  $: isPublicPage = ["/login"].includes($page.url.pathname);

  export const ssr = false;
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

  // State for sidebar - use localStorage to make it globally accessible
  const isSidebarOpen = writable(false);
  const isSidebarCollapsed = writable(false);

  // Handle viewport size
  const isMobile = writable(false);

  onMount(() => {
    if (browser) {
      // Check if mobile on load
      checkMobileView();

      // Listen for window resize
      window.addEventListener("resize", checkMobileView);

      // Set up localStorage sync for sidebar state
      isSidebarOpen.subscribe((value) => {
        localStorage.setItem("sidebarOpen", String(value));
        // Dispatch custom event for other components
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "sidebarOpen",
            newValue: String(value),
          })
        );
      });

      return () => {
        window.removeEventListener("resize", checkMobileView);
      };
    }
  });

  function checkMobileView() {
    const isSmallScreen = window.innerWidth < 1024;
    isMobile.set(isSmallScreen);

    // On desktop, sidebar should be visible by default
    if (!isSmallScreen) {
      isSidebarOpen.set(true);
    } else {
      // On mobile, sidebar should be hidden by default
      isSidebarOpen.set(false);

      // Reset any scroll locks
      document.body.style.overflow = "";
    }
  }

  function handleSidebarToggle(event: CustomEvent) {
    if ($isMobile) {
      // On mobile, this toggles visibility
      isSidebarOpen.set(event.detail);
    } else {
      // On desktop, this toggles collapsed state
      isSidebarCollapsed.set(event.detail);
    }
  }

  function toggleMobileSidebar() {
    isSidebarOpen.update((v) => {
      const newValue = !v;
      // When opening sidebar on mobile, prevent body scroll
      if (newValue && $isMobile) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return newValue;
    });
  }
</script>

<!-- UPDATED: Added overflow-x-hidden and max-width constraints -->
<div class="min-h-screen bg-surface-muted overflow-x-hidden max-w-full">
  {#if !isPublicPage}
    <!-- Mobile top navigation bar (only visible on small screens) -->
    {#if isAuthenticated && $isMobile}
      <div
        class="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-30 flex items-center
        justify-between px-4 lg:hidden overflow-hidden max-w-full"
      >
        <div class="flex items-center min-w-0 flex-1">
          {#if $isSidebarOpen}
            <button
              class="p-2 mr-2 rounded-md hover:bg-gray-100 flex-shrink-0"
              on:click={toggleMobileSidebar}
              aria-label="Close Sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          {/if}
          <div class="logo-container flex-shrink-0">
            <img src={logo} alt="Tendly" class="max-w-full h-auto" />
          </div>
        </div>
        {#if !$isSidebarOpen}
          <button
            class="p-2 rounded-md hover:bg-gray-100 flex-shrink-0"
            on:click={toggleMobileSidebar}
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        {/if}
      </div>
    {/if}

    <!-- UPDATED: Added overflow-x-hidden and max-width constraints -->
    <div class="flex overflow-x-hidden max-w-full">
      {#if isAuthenticated}
        <Sidebar
          isOpen={$isSidebarOpen}
          isMobileView={$isMobile}
          on:toggleSidebar={handleSidebarToggle}
        />
      {/if}
      <!-- UPDATED: Added overflow-x-hidden and improved responsive classes -->
      <div
        class="flex-1 transition-all duration-300 ease-in-out overflow-x-hidden max-w-full {isAuthenticated
          ? $isMobile
            ? 'ml-0 pt-16' /* Top padding for mobile nav bar */
            : $isSidebarCollapsed
              ? 'ml-20'
              : 'ml-64' /* Desktop margins */
          : ''}"
        class:content-when-sidebar-open={$isMobile && $isSidebarOpen}
      >
        <!-- UPDATED: Added responsive padding and overflow constraints -->
        <div class="container mx-auto max-w-7xl overflow-x-hidden">
          <slot />
          <Toast />
        </div>
      </div>
    </div>
  {:else}
    <!-- UPDATED: Added overflow constraints for public pages -->
    <div class="overflow-x-hidden max-w-full">
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
    overflow-x: hidden; /* Prevent horizontal scrolling when sidebar is open */
    width: 100%;
    max-width: 100vw;
    background: #f8fafc;
  }

  :global(html) {
    overflow-x: hidden;
    width: 100%;
    max-width: 100vw;
  }

  :global(.bg-surface-muted) {
    background-color: #f6f7fb;
  }

  /* Mobile navbar styles */
  @media (max-width: 1023px) {
    .pt-16 {
      padding-top: 4rem; /* 64px to match the height of the top navbar */
    }

    .content-when-sidebar-open {
      opacity: 0.8;
      pointer-events: none;
      max-height: 100vh;
      overflow: hidden;
    }

    /* Logo container styles - UPDATED with better responsive handling */
    .logo-container {
      max-width: 140px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      overflow: hidden;
    }

    .logo-container img {
      width: 100%;
      height: auto;
      max-width: 100%;
      object-fit: contain;
    }
  }

  /* Add custom overlay when sidebar is open on mobile */
  :global(body.sidebar-open) {
    overflow: hidden;
  }

  /* UPDATED: Additional mobile-specific fixes */
  @media (max-width: 767px) {
    .logo-container {
      max-width: 120px;
    }
  }

  @media (max-width: 480px) {
    .logo-container {
      max-width: 100px;
    }
  }
</style>
