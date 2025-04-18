<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import { resignationApi } from "$lib/services/api/user-resignation";
  import Modal from "$lib/components/common/Modal.svelte";
  import { toast } from "$lib/components/common/stores/toast.store";
  import type {
    Resignation,
    SubmitResignationData,
  } from "$lib/types/userResignation";

  $: user = $auth.user;
  let resignation: Resignation | null = null;
  let showModal = false;
  let submitting = false;
  let reason = "";
  let proposedLastWorkingDay = "";
  let noticePeriodServed = false;
  let error = "";

  async function loadResignationStatus() {
    if (!user?._id) return;
    try {
      const result: any = await resignationApi.getStatus(user._id);
      console.log(result, "resignation status");
      resignation = !result.data ? result.data : null;
    } catch (err: any) {
      error = err.message || "Failed to load resignation status.";
      toast.error(error);
    }
  }

  async function submitResignation() {
    if (!reason.trim()) {
      toast.error("Please provide a reason for resignation.");
      return;
    }
    if (!proposedLastWorkingDay) {
      toast.error("Please select a proposed last working day.");
      return;
    }
    const lwd = new Date(proposedLastWorkingDay);
    if (lwd <= new Date(new Date().setDate(new Date().getDate() + 6))) {
      toast.error(
        "Proposed last working day must be at least 7 days from today."
      );
      return;
    }

    submitting = true;
    try {
      const data: SubmitResignationData = {
        summary: reason,
        preferredLastWorkingDay: proposedLastWorkingDay,
        remarks: noticePeriodServed ? "Notice period served" : undefined,
      };
      const result = await resignationApi.submit(user._id, data);
      resignation = result.data;
      toast.success("Resignation submitted successfully.");
      showModal = false;
      reason = "";
      proposedLastWorkingDay = "";
      noticePeriodServed = false;
    } catch (err: any) {
      toast.error(err.message || "Failed to submit resignation.");
    } finally {
      submitting = false;
    }
  }

  async function withdrawResignation() {
    submitting = true;
    try {
      await resignationApi.withdraw(user._id);
      resignation = null;
      toast.success("Resignation withdrawn successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to withdraw resignation.");
    } finally {
      submitting = false;
    }
  }

  onMount(loadResignationStatus);
</script>

<div class="bg-white shadow rounded-lg p-6 max-w-2xl mx-auto">
  <h2 class="text-xl font-bold mb-4">My Resignation</h2>

  {#if resignation}
    <div class="card bg-base-100 shadow-md mb-4">
      <div class="card-body">
        <p><strong>Status:</strong> {resignation.status}</p>
        <p><strong>Reason:</strong> {resignation.summary}</p>
        <p>
          <strong>Proposed Last Working Day:</strong>
          {new Date(resignation.preferredLastWorkingDay).toLocaleDateString()}
        </p>
        {#if resignation.status === "Pending"}
          <button
            class="btn btn-error mt-4"
            on:click={withdrawResignation}
            disabled={submitting}
          >
            {submitting ? "Withdrawing..." : "Withdraw Request"}
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <button class="btn btn-primary" on:click={() => (showModal = true)}>
      Apply for Resignation
    </button>
  {/if}
</div>

<!-- Resignation Modal -->
<Modal
  show={showModal}
  title="Apply for Resignation"
  onClose={() => (showModal = false)}
>
  <form on:submit|preventDefault={submitResignation} class="space-y-4">
    <div>
      <label for="reason" class="label">
        <span class="label-text">Reason for Resignation</span>
      </label>
      <textarea
        id="reason"
        bind:value={reason}
        required
        class="textarea textarea-bordered w-full"
        placeholder="Enter your reason for resignation"
      ></textarea>
    </div>
    <div>
      <label for="proposedLastWorkingDay" class="label">
        <span class="label-text">Proposed Last Working Day</span>
      </label>
      <input
        id="proposedLastWorkingDay"
        type="date"
        bind:value={proposedLastWorkingDay}
        class="input input-bordered w-full"
        min={new Date(new Date().setDate(new Date().getDate() + 7))
          .toISOString()
          .split("T")[0]}
      />
    </div>
    <!-- <div class="form-control">
      <label class="cursor-pointer label">
        <span class="label-text">Notice Period Served</span>
        <input
          type="checkbox"
          class="toggle toggle-primary"
          bind:checked={noticePeriodServed}
        />
      </label>
    </div> -->
    <div class="flex justify-end space-x-4">
      <button
        type="button"
        class="btn btn-ghost"
        on:click={() => (showModal = false)}
      >
        Cancel
      </button>
      <button type="submit" class="btn btn-primary" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </div>
  </form>
</Modal>
