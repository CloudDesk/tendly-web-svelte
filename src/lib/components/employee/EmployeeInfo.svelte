<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { User } from "$lib/types/user";
  import BankingDetails from "./Banking-Identity/BankingDetails.svelte";
  import DocumentDetails from "./Banking-Identity/DocumentDetails.svelte";

  export let employeeId: string;
  export let employee: User;

  const dispatch = createEventDispatcher<{
    refresh: { employee: User; employeeId: string };
  }>();

  // Tab management
  const tabs = ["Basic Info", "Bank Information"];
  //  const tabs = ["Basic Info", "Bank Information", "Document Details"];
  let activeTab = tabs[0];

  // Format date utility
  function formatDate(date: string | undefined): string {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  }

  // Handle refresh event from child components
  function handleRefresh(event: CustomEvent) {
    const { employee } = event.detail;
    dispatch("refresh", { employee, employeeId });
  }
</script>

<div class="container mx-auto p-6">
  <!-- Tab Navigation -->
  <div class="flex justify-end items-center mb-4">
    <div class="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
      {#each tabs as tab}
        <button
          on:click={() => (activeTab = tab)}
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out
              {activeTab === tab
            ? 'bg-[#e0effe] text-blue-900'
            : 'text-gray-500 hover:text-gray-700'}"
        >
          {tab}
        </button>
      {/each}
    </div>
  </div>

  <!-- Basic Info Section -->
  {#if activeTab === "Basic Info"}
    <div class="bg-white shadow-lg rounded-xl p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
        <div class="info-item">
          <h3 class="text-sm font-medium text-gray-500">Full Name</h3>
          <p class="mt-1 text-base font-semibold text-gray-900">
            {employee.name || "N/A"}
          </p>
        </div>

        <div class="info-item">
          <h3 class="text-sm font-medium text-gray-500">Email</h3>
          <p class="mt-1 text-base text-gray-900">{employee.email || "N/A"}</p>
        </div>

        <div class="info-item">
          <h3 class="text-sm font-medium text-gray-500">Phone</h3>
          <p class="mt-1 text-base text-gray-900">{employee.phone || "N/A"}</p>
        </div>

        <div class="info-item">
          <h3 class="text-sm font-medium text-gray-500">Role</h3>
          <p class="mt-1 text-base text-gray-900">{employee.role || "N/A"}</p>
        </div>

        <div class="info-item">
          <h3 class="text-sm font-medium text-gray-500">Manager</h3>
          <p class="mt-1 text-base text-gray-900">
            {employee.managerName || "N/A"}
          </p>
        </div>

        <div class="info-item">
          <h3 class="text-sm font-medium text-gray-500">Location</h3>
          <p class="mt-1 text-base text-gray-900">
            {employee.location || "N/A"}
          </p>
        </div>

        <div class="info-item">
          <h3 class="text-sm font-medium text-gray-500">Joining Date</h3>
          <p class="mt-1 text-base text-gray-900">
            {formatDate(employee.joiningDate)}
          </p>
        </div>

        <div class="info-item">
          <h3 class="text-sm font-medium text-gray-500">Employee ID</h3>
          <p class="mt-1 text-base text-gray-900">{employeeId}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Bank Information Section -->
  {#if activeTab === "Bank Information"}
    <BankingDetails
      {employeeId}
      bankDetails={employee.bankDetails || []}
      on:refresh={handleRefresh}
    />
  {/if}

  <!-- Document Details Section -->
  <!-- {#if activeTab === "Document Details"}
    <DocumentDetails {employeeId} {employee} />
  {/if} -->
</div>

<style>
  .badge-success {
    background-color: #10b981;
    color: white;
    padding: 0.15rem 0.35rem;
    border-radius: 0.25rem;
  }
  :global(.transition-all) {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }
</style>
