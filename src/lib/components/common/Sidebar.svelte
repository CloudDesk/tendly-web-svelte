<script lang="ts">
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import { navigationContext } from '$lib/stores/navigation';
  import type { ComponentType } from 'svelte';
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
    ChevronDown
  } from 'lucide-svelte';
  import { writable } from 'svelte/store';

  const isCollapsed = writable(false);
  
  // Initialize collapsedSections based on navigation sections
  function initializeCollapsedSections(sections: NavigationSection[]) {
    const initialState: {[key: string]: boolean} = {};
    sections.forEach((section, index) => {
      initialState[section.label] = index !== 0; // Only first section is expanded (false)
    });
    collapsedSections.set(initialState);
  }

  const collapsedSections = writable<{[key: string]: boolean}>({});

  function toggleSection(label: string) {
    collapsedSections.update(sections => ({
      ...sections,
      [label]: !sections[label]
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

  // Admin navigation items
  const adminItems: NavItem[] = [
    { 
      label: 'Dashboard', 
      href: '/admin/dashboard', 
      icon: LayoutDashboard
    },
    { 
      label: 'Employees', 
      href: '/admin/employees', 
      icon: Users
    },
    { 
      label: 'Attendance', 
      href: '/admin/attendance', 
      icon: CalendarCheck
    },
    { 
      label: 'Leaves', 
      href: '/admin/leaves', 
      icon: CalendarOff
    },
    { 
      label: 'Configurations', 
      href: '/admin/configurations', 
      icon: Settings,
      children: [
        {
          label: 'Shifts',
          href: '/admin/configurations?tab=shifts'
        },
        {
          label: 'Trainings',
          href: '/admin/configurations?tab=trainings'
        },
        {
          label: 'LOVs',
          href: '/admin/configurations?tab=lovs'
        }
      ]
    }
  ];

  // Manager navigation items
  const managerItems: NavItem[] = [
    { 
      label: 'Dashboard', 
      href: '/manager/dashboard', 
      icon: LayoutDashboard
    },
    { 
      label: 'Actions', 
      href: '/manager/actions', 
      icon: Bell
    },
    { 
      label: 'Employees', 
      href: '/manager/employees', 
      icon: Users
    },
    { 
      label: 'Attendance', 
      href: '/manager/attendance', 
      icon: CalendarCheck
    },
    { 
      label: 'Leaves', 
      href: '/manager/leaves', 
      icon: CalendarOff
    }
  ];

  // My Items navigation
  const myItems: NavItem[] = [
    { 
      label: 'Dashboard', 
      href: '/my/dashboard', 
      icon: LayoutDashboard
    },
    { 
      label: 'Profile', 
      href: '/my/profile', 
      icon: UserCircle
    },
    { 
      label: 'Requests', 
      href: '/my/requests', 
      icon: ClipboardList
    },
    { 
      label: 'Attendance', 
      href: '/my/attendance', 
      icon: CalendarCheck
    },
    { 
      label: 'Assignments', 
      href: '/my/assignments', 
      icon: Briefcase
    }
  ];

  // Determine which navigation sections to show based on user role
  $: userRole = $auth.user?.roleId;
  $: isAdmin = userRole?.toUpperCase() === 'ADMIN';
  $: isManager = userRole?.toUpperCase() === 'MANAGER';

  // Build navigation sections based on role
  const navigationSections = writable<NavigationSection[]>([]);

  $: {
    if (isAdmin) {
      const sections = [
        { label: 'Admin', items: adminItems },
        { label: 'Manager', items: managerItems },
        { label: 'My Items', items: myItems }
      ];
      navigationSections.set(sections);
      initializeCollapsedSections(sections);
    } else if (isManager) {
      const sections = [
        { label: 'Manager', items: managerItems },
        { label: 'My Items', items: myItems }
      ];
      navigationSections.set(sections);
      initializeCollapsedSections(sections);
    } else {
      const sections = [
        { label: 'My Items', items: myItems }
      ];
      navigationSections.set(sections);
      initializeCollapsedSections(sections);
    }
  }

  $: currentPath = $page.url.pathname;
  $: currentTab = $page.url.searchParams.get('tab');

  $: getIsActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/';
    }

    // Handle configuration tabs
    if (href.includes('?tab=')) {
      const [path, search] = href.split('?');
      const params = new URLSearchParams(search);
      return currentPath.startsWith(path) && currentTab === params.get('tab');
    }

    // For dynamic routes, check if the current path starts with the href
    // This ensures that /admin/employees is considered active when viewing /admin/employees/123
    return currentPath.startsWith(href);
  };

  $: getIsChildActive = (href: string) => {
    const [path, search] = href.split('?');
    if (!search) return false;
    
    const params = new URLSearchParams(search);
    return currentPath === path && currentTab === params.get('tab');
  };

  function toggleSidebar() {
    isCollapsed.update(v => !v);
  }
</script>

<aside class="fixed left-0 top-0 h-screen bg-base-100 border-r border-base-200 shadow-sm {$isCollapsed ? 'w-20' : 'w-64'} transition-all duration-200 z-20">
  <!-- Header -->
  <div class="h-16 flex items-center px-4 border-b border-base-200 bg-base-100">
    <div class="flex items-center gap-3 {$isCollapsed ? 'justify-center w-full' : ''}">
      <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
        <span class="text-primary-content font-bold text-xl">T</span>
      </div>
      {#if !$isCollapsed}
        <div>
          <h1 class="font-bold text-lg text-neutral">Tendly</h1>
          <p class="text-xs text-neutral/60">HR Management</p>
        </div>
      {/if}
    </div>
    <button
      class="ml-auto w-8 h-8 flex items-center justify-center text-neutral/60 hover:text-neutral rounded-lg hover:bg-base-200 transition-colors"
      on:click={toggleSidebar}
    >
      <svelte:component this={$isCollapsed ? ChevronRight : ChevronLeft} class="w-5 h-5" />
    </button>
  </div>

  <!-- Navigation -->
  <nav class="p-3 overflow-y-auto" style="height: calc(100vh - 9rem);">
    {#each $navigationSections as section (section.label)}
      <div class="mb-6">
        {#if !$isCollapsed}
          <button 
            class="w-full px-3 mb-2 flex items-center justify-between text-xs font-semibold text-neutral/50 uppercase tracking-wider hover:text-neutral/70 transition-colors"
            on:click={() => toggleSection(section.label)}
          >
            <span>{section.label}</span>
            <ChevronDown 
              class="w-4 h-4 transform transition-transform duration-200 {$collapsedSections[section.label] ? 'rotate-180' : ''}"
            />
          </button>
        {/if}
        {#if !$collapsedSections[section.label]}
          <ul class="space-y-1">
            {#each section.items as item (item.href)}
              <li>
                <a 
                  href={item.href}
                  class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all overflow-hidden
                    {getIsActive(item.href) 
                      ? 'bg-primary text-primary-content shadow-md shadow-primary/20' 
                      : 'text-neutral/70 hover:text-neutral hover:bg-base-200'}"
                >
                  <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svelte:component this={item.icon} class="w-5 h-5 relative z-10" />
                  {#if !$isCollapsed}
                    <span class="relative z-10">{item.label}</span>
                  {/if}
                </a>

                {#if item.children && getIsActive(item.href) && !$isCollapsed}
                  <ul class="mt-2 ml-4 pl-4 border-l-2 border-base-200">
                    {#each item.children as child (child.href)}
                      <li>
                        <a 
                          href={child.href}
                          class="group relative flex items-center px-3 py-2 text-sm rounded-lg transition-all overflow-hidden
                            {getIsChildActive(child.href)
                              ? 'text-primary bg-primary/5 font-medium' 
                              : 'text-neutral/70 hover:text-neutral hover:bg-base-200'}"
                        >
                          <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span class="relative z-10">{child.label}</span>
                        </a>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </nav>

  <!-- User Section -->
  <div class="absolute bottom-0 left-0 right-0 border-t border-base-200 bg-base-100">
    <div class="p-4 {$isCollapsed ? 'justify-center' : ''} flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span class="text-primary font-medium">
          {($auth.user?.name?.[0] || '?').toUpperCase()}
        </span>
      </div>
      {#if !$isCollapsed}
        <div class="flex-1 min-w-0">
          <p class="font-medium text-neutral truncate">
            {$auth.user?.name || 'User'}
          </p>
          <p class="text-sm text-neutral/60 truncate">
            {$auth.user?.email || ''}
          </p>
        </div>
        <button 
          class="w-9 h-9 flex items-center justify-center text-neutral/60 hover:text-neutral rounded-lg hover:bg-base-200 transition-all hover:shadow-sm"
          on:click={() => auth.logout()}
        >
          <LogOut class="w-5 h-5" />
        </button>
      {/if}
    </div>
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
    
    border-radius: 20px;
  }
  nav {
    scrollbar-width: thin;
    
  }
</style>
