<script lang="ts">
  import { page } from "$app/stores";
  import { auth } from "$lib/stores/auth";
  import type { ComponentType } from "svelte";
  import logo from "$lib/assets/Tendly_logo_Full.png";
  import logoSmall from "$lib/assets/Tendly_T_logo.png";
  import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    UserCircle,
    ClipboardList,
    Briefcase,
    Bell,
    ChevronDown,
    ChartArea,
    FileCheck,
    Clock,
    GraduationCap,
    CalendarRange,
    X,
  } from "lucide-svelte";
  import PayrollIcon from "./icon/PayrollIcon.svelte";
  import { fly, slide, fade } from "svelte/transition";
  import { writable } from "svelte/store";
  import { createEventDispatcher, onMount } from "svelte";
  import { browser } from "$app/environment";
  export const ssr = false;

  // Props for responsive behavior
  export let isOpen = false;
  export let isMobileView = false;

  const isCollapsed = writable(false);
  const isLoggingOut = writable(false);
  const isMobile = writable(false);
  const dispatch = createEventDispatcher();

  // Update the internal mobile state when the prop changes
  $: isMobile.set(isMobileView);

  // Check for mobile view on component mount and window resize
  onMount(() => {
    if (browser) {
      const checkMobile = () => {
        isMobile.set(window.innerWidth < 1024);
      };

      // Initial check
      checkMobile();

      // Add resize listener
      window.addEventListener("resize", checkMobile);

      // Cleanup
      return () => {
        window.removeEventListener("resize", checkMobile);
      };
    }
  });

  function initializeCollapsedSections(sections: NavigationSection[]) {
    const initialState: { [key: string]: boolean } = {};
    sections.forEach((section, index) => {
      initialState[section.label] = index !== 0;
    });
    collapsedSections.set(initialState);
  }

  const collapsedSections = writable<{ [key: string]: boolean }>({});
  const collapsedSubItems = writable<{ [key: string]: boolean }>({});

  function toggleSection(label: string) {
    collapsedSections.update((sections) => ({
      ...sections,
      [label]: !sections[label],
    }));
  }

  function toggleSubItem(itemLabel: string) {
    collapsedSubItems.update((items) => ({
      ...items,
      [itemLabel]: !items[itemLabel],
    }));
  }

  type NavItem = {
    label: string;
    href: string;
    icon: ComponentType;
    children?: Array<{
      label: string;
      href: string;
    }>;
  };

  type NavigationSection = {
    label: string;
    items: NavItem[];
  };

  const adminItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Employee",
      href: "/admin/employees",
      icon: Users,
    },
    {
      label: "Attendance",
      href: "/admin/attendance",
      icon: Clock,
    },
    {
      label: "Trainings",
      href: "/admin/trainings",
      icon: GraduationCap,
    },
    {
      label: "Leaves",
      href: "/admin/leaves",
      icon: CalendarRange,
    },
    {
      label: "Payroll",
      href: "/admin/payroll",
      icon: PayrollIcon,
    },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: ChartArea,
    },
    {
      label: "Setup",
      href: "/admin/setup",
      icon: Settings,
      children: [
        {
          label: "LOVs",
          href: "/admin/setup?tab=lovs",
        },
        {
          label: "Shifts",
          href: "/admin/setup?tab=shifts",
        },
        {
          label: "Trainings",
          href: "/admin/setup?tab=trainings",
        },
        {
          label: "Salary Structure",
          href: "/admin/setup?tab=salary",
        },
        {
          label: "Tax Slab",
          href: "/admin/setup?tab=taxslab",
        },
        {
          label: "Holiday Calendar",
          href: "/admin/setup?tab=holiday",
        },
        {
          label: "Org Chart",
          href: "/admin/setup?tab=org",
        },
      ],
    },
  ];

  const managerItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/manager/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Actions",
      href: "/manager/actions",
      icon: Bell,
    },
    {
      label: "Employees",
      href: "/manager/employees",
      icon: Users,
    },
    {
      label: "Attendance",
      href: "/manager/attendance",
      icon: Clock,
    },
    {
      label: "Leaves",
      href: "/manager/leaves",
      icon: CalendarRange,
    },
  ];

  const myItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/my/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Profile",
      href: "/my/profile",
      icon: UserCircle,
    },
    {
      label: "Requests",
      href: "/my/requests",
      icon: ClipboardList,
    },
    {
      label: "Attendance",
      href: "/my/attendance",
      icon: CalendarCheck,
    },
    {
      label: "Leaves",
      href: "/my/leaves",
      icon: CalendarRange,
    },
    {
      label: "Tax Declaration",
      href: "/my/tax-declaration",
      icon: FileCheck,
    },
    {
      label: "Assignments",
      href: "/my/assignments",
      icon: Briefcase,
    },
    {
      label: "Payslips",
      href: "/my/payslips",
      icon: PayrollIcon,
    },
    {
      label: "Timesheet",
      href: "/my/Timesheet",
      icon: CalendarRange,
    },
  ];

  $: userRole = $auth.user?.role;
  $: isAdmin = userRole?.toUpperCase() === "ADMIN";
  $: isManager = userRole?.toUpperCase() === "MANAGER";

  const navigationSections = writable<NavigationSection[]>([]);

  $: {
    if (isAdmin) {
      const sections = [
        { label: "Admin", items: adminItems },
        { label: "Manager", items: managerItems },
        { label: "My Items", items: myItems },
      ];
      navigationSections.set(sections);
      initializeCollapsedSections(sections);
    } else if (isManager) {
      const sections = [
        { label: "Manager", items: managerItems },
        { label: "My Items", items: myItems },
      ];
      navigationSections.set(sections);
      initializeCollapsedSections(sections);
    } else {
      const sections = [{ label: "My Items", items: myItems }];
      navigationSections.set(sections);
      initializeCollapsedSections(sections);
    }
  }

  $: currentPath = $page.url.pathname;
  $: currentTab = $page.url.searchParams.get("tab");

  $: getIsActive = (href: string) => {
    if (href === "/") {
      return currentPath === "/";
    }

    if (href.includes("?tab=")) {
      const [path, search] = href.split("?");
      const params = new URLSearchParams(search);
      return currentPath.startsWith(path) && currentTab === params.get("tab");
    }

    return currentPath.startsWith(href);
  };

  $: getIsChildActive = (href: string) => {
    const [path, search] = href.split("?");
    if (!search) return false;

    const params = new URLSearchParams(search);
    return currentPath === path && currentTab === params.get("tab");
  };

  $: getHasActiveChild = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => getIsChildActive(child.href));
  };

  function toggleSidebar() {
    // On mobile, toggle open/closed state
    if ($isMobile) {
      dispatch("toggleSidebar", !isOpen);
      return;
    }

    // On desktop, toggle collapsed/expanded state
    isCollapsed.update((v) => {
      const newValue = !v;
      dispatch("toggleSidebar", newValue);
      return newValue;
    });
  }

  function closeSidebar() {
    if ($isMobile) {
      dispatch("toggleSidebar", false);
    }
  }

  // Handle navigation item click - close sidebar on mobile
  function handleNavItemClick() {
    if ($isMobile) {
      closeSidebar();
    }
  }

  // Handle clicks outside the sidebar to close it on mobile
  function handleClickOutside(node: HTMLElement) {
    if (!browser) return {};

    const handleClick = (event: MouseEvent) => {
      if ($isMobile && isOpen && node && !node.contains(event.target as Node)) {
        closeSidebar();
      }
    };

    document.addEventListener("click", handleClick, true);

    return {
      destroy() {
        document.removeEventListener("click", handleClick, true);
      },
    };
  }

  async function handleLogout() {
    isLoggingOut.set(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    localStorage.clear();
    window.location.href = "/login";
  }
</script>

<!-- Sidebar backdrop for mobile - only visible when sidebar is open on mobile -->
{#if $isMobile && isOpen}
  <div
    class="fixed inset-0 bg-black/30 z-40"
    on:click|stopPropagation={closeSidebar}
    transition:fade={{ duration: 200 }}
  ></div>
{/if}

<aside
  class="fixed left-0 top-0 h-screen bg-gradient-to-b from-[#F8FAFF] to-[#EDF3FF]
border-r border-surface-border shadow-sm transition-all duration-300 ease-in-out flex flex-col
{$isCollapsed && !$isMobile ? 'w-20' : 'w-64'} 
{$isMobile ? 'z-50' : 'z-30'}
{$isMobile
    ? isOpen
      ? 'translate-x-0'
      : '-translate-x-full'
    : 'translate-x-0'}"
  use:handleClickOutside
>
  <!-- Header -->
  <div
    class="h-16 flex items-center justify-between px-4 border-b border-surface-border/50 backdrop-blur-sm bg-white/50 flex-shrink-0"
  >
    <div
      class="{$isCollapsed ? 'w-8' : 'w-[120px]'} transition-all duration-300"
    >
      {#if !$isCollapsed}
        <img
          src={logo}
          alt="Tendly"
          class="w-full"
          style="aspect-ratio: 568/439;"
        />
      {:else}
        <img
          src={logoSmall}
          alt="Tendly"
          class="w-full"
          style="aspect-ratio: 1/1;"
        />
      {/if}
    </div>
    <button
      class="w-8 h-8 flex items-center justify-center text-text-muted hover:text-primary
    rounded-lg hover:bg-white/80 transition-colors"
      on:click={toggleSidebar}
      aria-label={$isMobile
        ? "Close sidebar"
        : $isCollapsed
          ? "Expand sidebar"
          : "Collapse sidebar"}
    >
      {#if $isMobile}
        <X size={18} />
      {:else if $isCollapsed}
        <ChevronRight size={18} />
      {:else}
        <ChevronLeft size={18} />
      {/if}
    </button>
  </div>

  <!-- Navigation - Uses flex-1 to take available space between header and user card -->
  <nav class="h-[calc(100vh-4rem)] pb-4 overflow-y-auto py-4 scrollbar-thin">
    {#each $navigationSections as section}
      <div class="mb-6">
        {#if !$isCollapsed}
          <div
            class="flex items-center justify-between px-4 mb-2 cursor-pointer"
            role="button"
            tabindex="0"
            on:click={() => toggleSection(section.label)}
            on:keydown={(e) =>
              e.key === "Enter" && toggleSection(section.label)}
          >
            <span
              class="text-xs font-medium text-text-muted uppercase tracking-wider"
            >
              {section.label}
            </span>
            <ChevronDown
              size={16}
              class="text-text-muted transition-transform {$collapsedSections[
                section.label
              ]
                ? '-rotate-90'
                : ''}"
            />
          </div>
        {/if}

        {#if !$collapsedSections[section.label] || $isCollapsed}
          <div class="space-y-1">
            {#each section.items as item}
              {@const isActive = getIsActive(item.href)}
              {@const hasActiveChild = getHasActiveChild(item)}
              {@const isSubItemExpanded = !$collapsedSubItems[item.label]}

              <!-- Main nav item -->
              <div>
                {#if item.children && !$isCollapsed}
                  <!-- Item with children - make it clickable to toggle -->
                  <div
                    class="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer {isActive ||
                    hasActiveChild
                      ? 'bg-white/70 text-primary font-medium shadow-sm'
                      : 'text-text-muted hover:text-text hover:bg-white/50'} transition-all"
                    role="button"
                    tabindex="0"
                    on:click={() => toggleSubItem(item.label)}
                    on:keydown={(e) =>
                      e.key === "Enter" && toggleSubItem(item.label)}
                  >
                    <svelte:component this={item.icon} size={20} />
                    <span class="flex-1">{item.label}</span>
                    <ChevronDown
                      size={16}
                      class="transition-transform {isSubItemExpanded
                        ? ''
                        : '-rotate-90'}"
                    />
                  </div>
                {:else}
                  <!-- Regular nav item -->
                  <a
                    href={item.href}
                    class="flex items-center gap-3 px-4 py-2 text-sm {isActive
                      ? 'bg-white/70 text-primary font-medium shadow-sm'
                      : 'text-text-muted hover:text-text hover:bg-white/50'} transition-all"
                    on:click={handleNavItemClick}
                  >
                    <svelte:component this={item.icon} size={20} />
                    {#if !$isCollapsed || $isMobile}
                      <span>{item.label}</span>
                    {/if}
                  </a>
                {/if}

                <!-- Children items with slide transition -->
                {#if item.children && !$isCollapsed && isSubItemExpanded}
                  <div
                    class="pl-12 space-y-1 bg-white/30"
                    transition:slide={{ duration: 200 }}
                  >
                    {#each item.children as child}
                      {@const isChildActive = getIsChildActive(child.href)}
                      <a
                        href={child.href}
                        class="block py-2 text-sm {isChildActive
                          ? 'text-primary font-medium'
                          : 'text-text-muted hover:text-text'} transition-colors"
                        on:click={handleNavItemClick}
                      >
                        {child.label}
                      </a>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </nav>

  <!-- User Card - Fixed at bottom -->
  <div
    class="p-3 bg-white border-t border-surface-border/50 flex items-center justify-between gap-2 flex-shrink-0"
  >
    <a
      href="/my/profile"
      class="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 transition-colors flex-1"
    >
      <div
        class="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full text-base font-semibold"
      >
        {$auth.user?.name[0]}
      </div>
      {#if !$isCollapsed}
        <div>
          <div class="text-sm font-medium text-gray-900">
            {$auth.user?.name}
          </div>
          <div class="text-xs text-gray-500">{$auth.user?.role}</div>
        </div>
      {/if}
    </a>
    <button
      class="group relative w-8 h-8 flex items-center justify-center rounded-md transition-all duration-300 hover:bg-blue-50"
      on:click={handleLogout}
      aria-label="Logout"
      disabled={$isLoggingOut}
    >
      {#if $isLoggingOut}
        <div
          class="w-full h-full flex items-center justify-center text-sm text-gray-700"
          in:fly={{ x: 20, duration: 200 }}
        >
          <LogOut size={16} />
        </div>
      {:else}
        <div class="relative w-full h-full">
          <div
            class="absolute inset-y-0 left-0 flex items-center justify-center w-8 h-8 transition-all duration-300 group-hover:text-blue-600"
          >
            <LogOut size={16} />
          </div>
          {#if !$isCollapsed}
            <div
              class="absolute inset-0 flex items-center justify-center text-xs font-medium opacity-0 transition-all duration-300 group-hover:opacity-100 text-blue-600"
            >
              Log Out
            </div>
          {/if}
          <div
            class="absolute inset-0 w-0 bg-blue-50/50 transition-all duration-300 group-hover:w-full"
          />
        </div>
      {/if}
    </button>
  </div>
</aside>

<style lang="postcss">
  :global(nav.scrollbar-thin::-webkit-scrollbar) {
    width: 4px;
  }

  :global(nav.scrollbar-thin::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(nav.scrollbar-thin::-webkit-scrollbar-thumb) {
    @apply bg-surface-border/50 rounded-full;
  }

  nav.scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: var(--surface-border) transparent;
  }

  /* Add box-shadow to sidebar for subtle elevation */
  aside {
    box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.1);
  }

  /* Mobile sidebar has stronger elevation */
  @media (max-width: 1023px) {
    aside {
      box-shadow: 0 0 25px rgba(0, 0, 0, 0.15);
    }
  }

  /* Fix for dropdowns and other components */
  :global(.dropdown-menu),
  :global(.modal),
  :global(.dialog),
  :global(.popup) {
    z-index: 60 !important; /* Higher than sidebar on mobile */
  }

  /* Mobile sidebar has stronger elevation */
  @media (max-width: 1023px) {
    aside {
      box-shadow: 0 0 25px rgba(0, 0, 0, 0.15);
    }
  }

  /* Fix for dropdowns and other components */
  :global(.dropdown-menu),
  :global(.modal),
  :global(.dialog),
  :global(.popup) {
    z-index: 60 !important; /* Higher than sidebar on mobile */
  }
</style>
