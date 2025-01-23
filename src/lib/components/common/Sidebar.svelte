<script lang="ts">
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import { navigationContext } from '$lib/stores/navigation';
  import type { ComponentType } from 'svelte';
  import logo from '$lib/assets/Tendly_logo_Full.png';
  import logoSmall from '$lib/assets/Tendly_T_logo.png';
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
    BookOpen
  } from 'lucide-svelte';
  import { writable } from 'svelte/store';
  export const ssr = false;

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
      label: 'Trainings', 
      href: '/admin/trainings', 
      icon: BookOpen
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
      icon: LayoutDashboard,
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
      label: 'Leaves', 
      href: '/my/leaves', 
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

<aside class="fixed left-0 top-0 h-screen bg-gradient-to-b from-[#F8FAFF] to-[#EDF3FF] border-r border-surface-border shadow-sm {$isCollapsed ? 'w-20' : 'w-64'} transition-all duration-200 z-20">
  <!-- Header -->
  <div class="h-16 flex items-center justify-between px-4 border-b border-surface-border/50 backdrop-blur-sm bg-white/50">
    <div class="{$isCollapsed ? 'w-8' : 'w-[120px]'} transition-all duration-200">
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
      aria-label={$isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
            on:click={() => toggleSection(section.label)}
            on:keydown={(e) => e.key === 'Enter' && toggleSection(section.label)}
          >
            <span class="text-xs font-medium text-text-muted uppercase tracking-wider">
              {section.label}
            </span>
            <ChevronDown 
              size={16} 
              class="text-text-muted transition-transform {$collapsedSections[section.label] ? '-rotate-90' : ''}"
            />
          </div>
        {/if}
        
        {#if !$collapsedSections[section.label] || $isCollapsed}
          <div class="space-y-1">
            {#each section.items as item}
              {@const isActive = getIsActive(item.href)}
              <a
                href={item.href}
                class="flex items-center gap-3 px-4 py-2 text-sm {isActive ? 'bg-white/70 text-primary font-medium shadow-sm' : 'text-text-muted hover:text-text hover:bg-white/50'} transition-all"
              >
                <svelte:component this={item.icon} size={20} />
                {#if !$isCollapsed}
                  <span>{item.label}</span>
                  {#if item.children}
                    <ChevronDown 
                      size={16} 
                      class="ml-auto transition-transform {isActive ? '' : '-rotate-90'}"
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
                      class="block py-2 text-sm {isChildActive ? 'text-primary font-medium' : 'text-text-muted hover:text-text'} transition-colors"
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
</style>
