<script lang="ts">
  import { page } from "$app/stores";
  import { auth } from "$lib/stores/auth";
  import { navigationContext } from "$lib/stores/navigation";
  import type { ComponentType } from "svelte";
  import logo from "$lib/assets/Tendly_logo_Full.png";
  import logoSmall from "$lib/assets/Tendly_T_logo.png";
  import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    CalendarOff,
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
    Menu,
  } from "lucide-svelte";
  import PayrollIcon from "./icon/PayrollIcon.svelte";
  import { fly } from "svelte/transition";
  import { writable } from "svelte/store";
  import { createEventDispatcher } from "svelte";
  export const ssr = false;

  const isCollapsed = writable(false);
  const isLoggingOut = writable(false);
  const isSidebarOpen = writable(false);
  const dispatch = createEventDispatcher();

  function initializeCollapsedSections(sections: NavigationSection[]) {
    const initialState: { [key: string]: boolean } = {};
    sections.forEach((section, index) => {
      initialState[section.label] = index !== 0;
    });
    collapsedSections.set(initialState);
  }

  const collapsedSections = writable<{ [key: string]: boolean }>({});

  function toggleSection(label: string) {
    collapsedSections.update((sections) => ({
      ...sections,
      [label]: !sections[label],
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

  function toggleSidebar() {
    isCollapsed.update((v) => {
      const newValue = !v;
      dispatch("toggleSidebar", newValue);
      return newValue;
    });
    isSidebarOpen.update((v2) => {
      const newValuev2 = !v2;
      dispatch("toggleSidebar2", newValuev2);
      return newValuev2;
    });
  }

  async function handleLogout() {
    isLoggingOut.set(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    localStorage.clear();
    window.location.href = "/login";
  }
</script>

<!-- Hamburger Menu Button -->
<button
  class="hamburger-menu lg:hidden"
  on:click={toggleSidebar}
  aria-label="Toggle Sidebar"
>
  <Menu />
</button>

<aside
  class="sidebar fixed left-0 top-0 h-screen bg-gradient-to-b from-[#F8FAFF] to-[#EDF3FF] border-r border-surface-border shadow-sm {$isCollapsed
    ? 'w-20'
    : 'w-64'} transition-all duration-200 z-20 {$isSidebarOpen
    ? 'open'
    : ''} lg:translate-x-0"
>
  <!-- Header -->
  <div
    class="h-16 flex items-center justify-between px-4 border-b border-surface-border/50 backdrop-blur-sm bg-white/50"
  >
    <div
      class="{$isCollapsed ? 'w-8' : 'w-[120px]'} transition-all duration-200"
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
      class="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text rounded-lg hover:bg-white/50 transition-colors"
      on:click={toggleSidebar}
      aria-label={$isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {#if $isCollapsed}
        <ChevronRight size={20} />
      {:else}
        <ChevronLeft size={20} />
      {/if}
    </button>
  </div>

  <!-- Navigation -->
  <nav class="h-[calc(100vh-4rem)] overflow-y-auto py-4">
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
              <a
                href={item.href}
                class="flex items-center gap-3 px-4 py-2 text-sm {isActive
                  ? 'bg-white/70 text-primary font-medium shadow-sm'
                  : 'text-text-muted hover:text-text hover:bg-white/50'} transition-all"
              >
                <svelte:component this={item.icon} size={20} />
                {#if !$isCollapsed}
                  <span>{item.label}</span>
                  {#if item.children}
                    <ChevronDown
                      size={16}
                      class="ml-auto transition-transform {isActive
                        ? ''
                        : '-rotate-90'}"
                    />
                  {/if}
                {/if}
              </a>
              {#if item.children && !$isCollapsed && isActive}
                <div class="pl-12 space-y-1 bg-white/30">
                  {#each item.children as child}
                    {@const isChildActive = getIsChildActive(child.href)}
                    <a
                      href={child.href}
                      class="block py-2 text-sm {isChildActive
                        ? 'text-primary font-medium'
                        : 'text-text-muted hover:text-text'} transition-colors"
                    >
                      {child.label}
                    </a>
                  {/each}
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </nav>

  <!-- User Card -->
  <div
    class="absolute bottom-0 w-full p-3 bg-white border-t border-surface-border/50 flex items-center justify-between gap-2"
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
  :global(nav::-webkit-scrollbar) {
    width: 5px;
  }
  :global(nav::-webkit-scrollbar-track) {
    background: transparent;
  }
  :global(nav::-webkit-scrollbar-thumb) {
    @apply bg-surface-border/50 rounded-full;
  }
  nav {
    scrollbar-width: thin;
    scrollbar-color: var(--surface-border) transparent;
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
</style>
