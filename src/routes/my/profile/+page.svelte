<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { Calendar, Mail, Briefcase, Shield, Users, Settings, Edit } from 'lucide-svelte';
  import LeaveSummary from '$lib/components/dashboard/LeaveSummary.svelte';
  import CurrentShift from '$lib/components/dashboard/CurrentShift.svelte';

  // Format joining date for display
  $: formattedJoiningDate = $auth.user?.joiningDate
    ? new Date($auth.user.joiningDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  // Format department ID
  $: formattedDepartment = $auth.user?.departmentId
    ? $auth.user.departmentId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'N/A';

  // Get first letter of the user's name
  $: firstLetter = $auth.user?.name ? $auth.user.name.charAt(0).toUpperCase() : 'N';

  let isSidebarOpen = false;

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }
</script>

<div class="min-h-screen bg-gray-50 flex">
  <!-- Sidebar -->
  <!-- <aside
    class="{isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static w-64 bg-blue-800 text-white h-full transition-transform duration-300 ease-in-out z-20"
  >
    <div class="p-6">
      <h2 class="text-xl font-bold">HRMS Dashboard</h2>
    </div>
    <nav class="mt-4">
      <a href="/profile" class="flex items-center gap-3 px-6 py-3 bg-blue-900">
        <User class="w-5 h-5" />
        Profile
      </a>
      <a href="/settings" class="flex items-center gap-3 px-6 py-3 hover:bg-blue-700">
        <Settings class="w-5 h-5" />
        Settings
      </a>
    </nav>
  </aside> -->

  <!-- Main Content -->
  <main class="flex-1 p-6 md:p-8">
    <!-- Mobile Sidebar Toggle -->
    <button
      class="md:hidden mb-6 p-2 bg-blue-600 text-white rounded-full"
      on:click={toggleSidebar}
    >
      <!-- <User class="w-6 h-6" /> -->
    </button>

    <!-- Profile Header -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800">My Profile</h1>
    </div>

    <!-- Profile Card -->
    <div class="bg-white rounded-xl p-6 md:p-8 shadow-sm">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
          <span class="text-2xl font-bold text-white">{firstLetter}</span>
        </div>
        <div>
          <h2 class="text-xl font-semibold text-gray-800">{$auth.user?.name || 'N/A'}</h2>
          <p class="text-gray-600 flex items-center gap-2">
            <Briefcase class="w-4 h-4" />
            {$auth.user?.role || 'N/A'}
          </p>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <!-- Email -->
        <div class="flex items-start gap-3">
          <Mail class="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <p class="text-sm font-medium text-gray-500">Email</p>
            <p class="text-gray-800">{$auth.user?.email || 'N/A'}</p>
          </div>
        </div>

        <!-- Department -->
        <div class="flex items-start gap-3">
          <Users class="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <p class="text-sm font-medium text-gray-500">Department</p>
            <p class="text-gray-800">{formattedDepartment}</p>
          </div>
        </div>

        <!-- Manager -->
        <div class="flex items-start gap-3">
          <Shield class="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <p class="text-sm font-medium text-gray-500">Manager</p>
            <p class="text-gray-800">{$auth.user?.managerName || 'N/A'}</p>
          </div>
        </div>

        <!-- Joining Date -->
        <div class="flex items-start gap-3">
          <Calendar class="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <p class="text-sm font-medium text-gray-500">Joining Date</p>
            <p class="text-gray-800">{formattedJoiningDate}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Leave Summary and Current Shift -->
    <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
      <LeaveSummary />
      <CurrentShift />
    </div>

    <!-- Additional Sections -->
    <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
      <!-- Work Information -->
      <div class="bg-white rounded-xl p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Work Information</h3>
        <p class="text-gray-600 text-sm">
          View team details, projects, or employee ID here.
        </p>
      </div>

      <!-- Account Settings -->
      <div class="bg-white rounded-xl p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Account Settings</h3>
        <p class="text-gray-600 text-sm">
          Manage password, notifications, or preferences.
        </p>
      </div>
    </div>
  </main>
</div>

<style>
  /* Hover effects for buttons */
  button:hover {
    transform: translateY(-1px);
  }
</style>