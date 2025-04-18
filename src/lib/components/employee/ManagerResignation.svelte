<script lang="ts">
  import { resignationApi } from "$lib/services/api";
  import { toast } from "$lib/components/common/stores/toast.store";
  import { onMount } from "svelte";

  let awaitingResignations = [];
  let historyResignations = [];
  let loading = false;
  let selectedResignation = null;
  let noticePeriodDays = 30;
  let approvedLastWorkingDay = new Date().toISOString();

  async function loadResignations() {
    loading = true;
    try {
      const response = await resignationApi.list();
      awaitingResignations = response.data.awaiting || [];
      historyResignations = response.data.history || [];
    } catch (err) {
      console.error(err);
      toast.error("Failed to load resignations.");
    } finally {
      loading = false;
    }
  }

  async function approveResignation(resignationId) {
    try {
      await resignationApi.approve(resignationId, {
        noticePeriodDays,
        approvedLastWorkingDay,
      });
      toast.success("Resignation approved successfully.");
      await loadResignations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve resignation.");
    }
  }

  async function rejectResignation(resignationId) {
    try {
      await resignationApi.reject(resignationId);
      toast.success("Resignation rejected successfully.");
      await loadResignations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject resignation.");
    }
  }

  onMount(loadResignations);
</script>

<div class="bg-white shadow rounded-lg p-6">
  <h2 class="text-xl font-bold mb-4">Resignation Management</h2>

  <div class="tabs">
    <button
      class="tab tab-bordered"
      on:click={() => (selectedTab = "awaiting")}
    >
      Awaiting Review
    </button>
    <button class="tab tab-bordered" on:click={() => (selectedTab = "history")}>
      History
    </button>
  </div>

  {#if selectedTab === "awaiting"}
    <div class="mt-4">
      {#if awaitingResignations.length === 0}
        <p class="text-gray-600">No resignations awaiting review.</p>
      {:else}
        {#each awaitingResignations as resignation}
          <div class="border rounded-lg p-4 mb-4">
            <p class="text-sm text-gray-600">
              <strong>Employee:</strong>
              {resignation.employeeName}
            </p>
            <p class="text-sm text-gray-600">
              <strong>Summary:</strong>
              {resignation.summary}
            </p>
            <p class="text-sm text-gray-600">
              <strong>Submitted At:</strong>
              {new Date(resignation.submittedAt).toLocaleDateString()}
            </p>
            <div class="mt-4">
              <label class="block text-sm font-medium mb-2"
                >Notice Period (Days)</label
              >
              <input
                type="number"
                bind:value={noticePeriodDays}
                class="input input-bordered w-full mb-4"
              />
              <label class="block text-sm font-medium mb-2"
                >Approved Last Working Day</label
              >
              <input
                type="date"
                bind:value={approvedLastWorkingDay}
                class="input input-bordered w-full mb-4"
              />
              <button
                class="btn btn-success mr-2"
                on:click={() => approveResignation(resignation._id)}
              >
                Approve
              </button>
              <button
                class="btn btn-danger"
                on:click={() => rejectResignation(resignation._id)}
              >
                Reject
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {:else if selectedTab === "history"}
    <div class="mt-4">
      {#if historyResignations.length === 0}
        <p class="text-gray-600">No resignation history available.</p>
      {:else}
        {#each historyResignations as resignation}
          <div class="border rounded-lg p-4 mb-4">
            <p class="text-sm text-gray-600">
              <strong>Employee:</strong>
              {resignation.employeeName}
            </p>
            <p class="text-sm text-gray-600">
              <strong>Summary:</strong>
              {resignation.summary}
            </p>
            <p class="text-sm text-gray-600">
              <strong>Status:</strong>
              {resignation.status}
            </p>
            <p class="text-sm text-gray-600">
              <strong>Approved Last Working Day:</strong>
              {resignation.approvedLastWorkingDay
                ? new Date(
                    resignation.approvedLastWorkingDay
                  ).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
