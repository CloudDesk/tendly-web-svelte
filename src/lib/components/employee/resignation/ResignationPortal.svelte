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
  import { FileText, Info, LoaderCircle } from "lucide-svelte";

  interface IResignationStatus {
    canApply: boolean;
    canWithdraw: boolean;
    activeResignation: Partial<Resignation> | null;
  }

  const ADMIN_MAIL = import.meta.env.VITE_ADMIN_MAIL;
  $: user = $auth.user;
  let resignation: Resignation | null = null;
  let showModal = false;
  let submitting = false;
  let reason = "";
  let proposedLastWorkingDay = "";
  let noticePeriodServed = false;

  // ✅ Error fields
  let reasonError = "";
  let lwdError = "";

  // Calculate minimum date (7 days from today)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 7);
  const minDateString = minDate.toISOString().split("T")[0];

  async function loadResignationStatus() {
    if (!user?._id) return;
    try {
      const result: any = await resignationApi.getStatus(user._id);
      console.log(result, "getStatus result");
      if (result.success) {
        let data: IResignationStatus = result.data;
        console.log(data, "getStatus data");
        resignation = data.activeResignation
          ? ({
              ...(() => {
                const { _id, ...rest } = data.activeResignation; // Exclude `_id`
                return rest;
              })(),
              status: data.activeResignation.status || "Pending",
            } as Resignation)
          : null;
      } else {
        resignation = null;
      }
      console.log(resignation, "getStatus result");
      // resignation = Object.keys(result.data).length > 0 ? result.data : null;
    } catch (err: any) {
      toast.error(err.message || "Failed to load resignation status.");
    }
  }

  async function submitResignation() {
    // Reset error messages
    reasonError = "";
    lwdError = "";
    let hasError = false;

    if (!reason.trim()) {
      reasonError = "Please provide a reason for resignation.";
      hasError = true;
    }

    if (!proposedLastWorkingDay) {
      lwdError = "Please select a proposed last working day.";
      hasError = true;
    } else {
      const lwd = new Date(proposedLastWorkingDay);
      if (lwd <= new Date(new Date().setDate(new Date().getDate() + 6))) {
        lwdError = "Date must be at least 7 days from today.";
        hasError = true;
      }
    }

    if (hasError) return;

    submitting = true;
    try {
      // Convert `proposedLastWorkingDay` to ISO 8601 format
      const isoLastWorkingDay = new Date(proposedLastWorkingDay).toISOString();

      const data: SubmitResignationData = {
        summary: reason,
        preferredLastWorkingDay: isoLastWorkingDay, // Use ISO format
      };

      if (!user?._id) {
        toast.error("User information is missing. Cannot submit resignation.");
        return;
      }
      const result: any = await resignationApi.submit(user._id, data);
      console.log(result, "reslt SubmitResignationData");
      // Close the modal first
      showModal = false;

      // Clear form data
      reason = "";
      proposedLastWorkingDay = "";
      noticePeriodServed = false;

      // Then reload resignation status
      await loadResignationStatus();

      toast.success("Resignation submitted successfully.");
    } catch (err: any) {
      console.error("Error submitting resignation:", err);
      toast.error(err.message || "Failed to submit resignation.");
    } finally {
      showModal = false;
      submitting = false;
    }
  }

  async function withdrawResignation() {
    submitting = true;
    if (!user?._id) {
      toast.error("User information is missing. Cannot submit resignation.");
      return;
    }

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

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  onMount(loadResignationStatus);
</script>

<div class="bg-white rounded-lg max-w-3xl mx-auto">
  <div class="mb-6"></div>

  {#if resignation}
    <div class="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
      <div class="flex items-center mb-4">
        {#if resignation.status === "Pending"}
          <div class="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
          <span class="font-medium text-yellow-700">Pending Review</span>
        {:else if resignation.status === "Approved"}
          <div class="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
          <span class="font-medium text-green-700">Approved</span>
        {:else if resignation.status === "Rejected"}
          <div class="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
          <span class="font-medium text-red-700">Rejected</span>
        {:else}
          <div class="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
          <span class="font-medium text-gray-700">{resignation.status}</span>
        {/if}
      </div>

      <div class="space-y-3 text-gray-700">
        <div class="grid grid-cols-3 gap-4">
          <div class="text-sm text-gray-500">Submission Date</div>
          <div class="col-span-2 font-medium">
            {resignation.submittedAt
              ? formatDate(resignation.submittedAt)
              : "N/A"}
          </div>
        </div>
        <!-- Requested Last Working Day - shown for all statuses -->
        <div class="grid grid-cols-3 gap-4">
          <div class="text-sm text-gray-500">Requested Last Working Day</div>
          <div class="col-span-2 font-medium">
            {resignation.preferredLastWorkingDay
              ? formatDate(resignation.preferredLastWorkingDay)
              : "N/A"}
          </div>
        </div>
        <!-- Approved Last Working Day - shown only for approved status -->
        {#if resignation.status === "Approved" && resignation.approvedLastWorkingDay}
          <div class="grid grid-cols-3 gap-4">
            <div class="text-sm text-gray-500">Approved Last Working Day</div>
            <div class="col-span-2 font-medium">
              {formatDate(resignation.approvedLastWorkingDay)}
            </div>
          </div>
        {/if}

        <!-- Notice Period - shown only for approved status -->
        {#if resignation.status === "Approved" && resignation.noticePeriodDays}
          <div class="grid grid-cols-3 gap-4">
            <div class="text-sm text-gray-500">Notice Period</div>
            <div class="col-span-2 font-medium">
              {resignation.noticePeriodDays} days
            </div>
          </div>
        {/if}
        <!-- Remarks/Comments - shown for approved or rejected status -->
        {#if (resignation.status === "Approved" || resignation.status === "Rejected") && resignation.remarks}
          <div class="grid grid-cols-3 gap-4">
            <div class="text-sm text-gray-500">
              {resignation.status === "Approved"
                ? "Approval Remarks"
                : "Rejection Reason"}
            </div>
            <div
              class="col-span-2 font-medium truncate hover:overflow-visible relative group"
              title={resignation.remarks}
            >
              {resignation.remarks?.slice(0, 30)}{resignation.remarks.length >
              30
                ? "..."
                : ""}
              <!-- Custom tooltip -->
              <div
                class="absolute left-0 top-full mt-1 hidden w-max bg-gray-800 text-white text-xs rounded-md px-2 py-1 shadow-lg group-hover:block z-10"
              >
                {resignation.remarks}
              </div>
            </div>
          </div>
        {/if}
        <!-- Reason for resignation - shown for all statuses -->
        <div class="grid grid-cols-3 gap-4">
          <div class="text-sm text-gray-500">Reason</div>
          <div
            class="col-span-2 font-medium truncate hover:overflow-visible relative"
            title={resignation.summary}
          >
            {resignation.summary.slice(0, 30)}{resignation.summary.length > 30
              ? "..."
              : ""}
            <!-- Custom tooltip -->
            <div
              class="absolute left-0 top-full mt-1 hidden w-max bg-gray-800 text-white text-xs rounded-md px-2 py-1 shadow-lg group-hover:block"
            >
              {resignation.summary}
            </div>
          </div>
        </div>
      </div>

      {#if resignation.status === "Pending"}
        <div class="mt-6 border-t pt-4">
          <button
            class="flex items-center justify-center px-4 py-2 bg-white text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors duration-200"
            on:click={withdrawResignation}
            disabled={submitting}
          >
            {#if submitting}
              <LoaderCircle
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600"
              />
              Withdrawing...
            {:else}
              Withdraw Resignation Request
            {/if}
          </button>
        </div>
      {/if}
    </div>

    <div class="bg-blue-50 p-4 rounded-md">
      <div class="flex">
        <div class="flex-shrink-0">
          <Info class="h-5 w-5 text-blue-600" />
        </div>
        <div class="ml-3">
          <p class="text-sm text-blue-700">
            For any questions regarding your resignation, please contact HR at <span
              class="font-medium">{ADMIN_MAIL}</span
            >
          </p>
        </div>
      </div>
    </div>
  {:else}
    <div class="text-center py-12 bg-gray-50 rounded-lg">
      <FileText class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900">
        No Resignation Request
      </h3>
      <p class="mt-1 text-sm text-gray-500">
        You haven't submitted a resignation request yet.
      </p>
      <div class="mt-6">
        <button
          class="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          on:click={() => (showModal = true)}
        >
          Resignation Request
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- Improved Resignation Modal -->
<Modal
  show={showModal}
  title="Apply for Resignation"
  onClose={() => (showModal = false)}
>
  <form on:submit|preventDefault={submitResignation} class="space-y-5">
    <div>
      <label for="reason" class="block text-sm font-medium text-gray-700 mb-1">
        Reason for Resignation <span class="text-red-500">*</span>
      </label>
      <textarea
        id="reason"
        bind:value={reason}
        required
        rows="4"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        placeholder="Please provide details about your decision to resign"
      ></textarea>
    </div>

    <div>
      <label
        for="proposedLastWorkingDay"
        class="block text-sm font-medium text-gray-700 mb-1"
      >
        Proposed Last Working Day <span class="text-red-500">*</span>
      </label>
      <input
        id="proposedLastWorkingDay"
        type="date"
        bind:value={proposedLastWorkingDay}
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        min={minDateString}
      />
      <p class="mt-1 text-xs text-gray-500">
        Must be at least 7 days from today
      </p>
    </div>

    <div class="pt-4 border-t flex justify-end space-x-3">
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        on:click={() => (showModal = false)}
      >
        Cancel
      </button>
      <button
        type="submit"
        class="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={submitting}
      >
        {#if submitting}
          <LoaderCircle class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
          Submitting...
        {:else}
          Submit Request
        {/if}
      </button>
    </div>
  </form>
</Modal>
