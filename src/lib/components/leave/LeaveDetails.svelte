<script lang="ts">
  import { onMount } from "svelte";
  import { leavesApi } from "$lib/services/api/leaves";
  import Modal from "$lib/components/common/Modal.svelte";
  import type { LeaveRequest } from "$lib/types";
  import {
    Calendar,
    Clock,
    MessageSquare,
    UserCheck,
    CheckCircle2,
    X as Close,
    Check,
  } from "lucide-svelte";
  import { getLeaveTypeLabel } from "$lib/constants/leaveTypes";
  import { getLeaveButtonVisibility } from "$lib/utils/getLeaveButtonVisibility";
  import { writable } from "svelte/store";
  import { t } from "svelte-i18n";

  export let leaveId: string;
  console.log(leaveId, "leaveId");
  const buttonVisibility = writable({
    canApprove: false,
    canReject: false,
    canWithdraw: false,
  });

  let leave: LeaveRequest | null = null;
  let loading = true;
  let error: string | null = null;

  let showApproveModal = false;
  let showRejectModal = false;
  let remarks = "";

  type FieldKey = keyof LeaveRequest | "user" | "approvedBy" | "leaveType";

  const fields = [
    {
      key: "leaveType" as FieldKey,
      label: $t("leaves.leave_details.fields.leave_type"),
      icon: Calendar,
    },
    {
      key: "status" as FieldKey,
      label: $t("leaves.leave_details.fields.status"),
      icon: CheckCircle2,
    },
    {
      key: "startDate" as FieldKey,
      label: $t("leaves.leave_details.fields.start_date"),
      icon: Calendar,
    },
    {
      key: "endDate" as FieldKey,
      label: $t("leaves.leave_details.fields.end_date"),
      icon: Calendar,
    },
    {
      key: "noOfDays" as FieldKey,
      label: $t("leaves.leave_details.fields.number_of_days"),
      icon: Clock,
    },
    {
      key: "reason" as FieldKey,
      label: $t("leaves.leave_details.fields.reason"),
      icon: MessageSquare,
    },
    {
      key: "user" as FieldKey,
      label: $t("leaves.leave_details.fields.applied_by"),
      icon: MessageSquare,
    },
    {
      key: "approvedBy" as FieldKey,
      label: $t("leaves.leave_details.fields.approved_by"),
      icon: UserCheck,
      condition: () => ["Approved", "Rejected"].includes(leave?.status || ""),
    },
  ];

  onMount(async () => {
    try {
      loading = true;
      const response: any = await leavesApi.getById(leaveId);
      leave = response.data;
      console.log(leave, "leave");
      if (leave) {
        const visibility = await getLeaveButtonVisibility({
          ...leave,
          appliedTo: leave.appliedTo || { _id: "", name: "" },
        });
        buttonVisibility.set(visibility);
        console.log("Button Visibility Set:", visibility);
      }
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  $: {
    console.log($buttonVisibility, "buttonVisibility***");
  }

  async function handleStatusUpdate(
    status: "Approved" | "Rejected" | "Cancelled"
  ) {
    if (!leave) return;

    try {
      loading = true;
      await leavesApi.updateStatus(
        leaveId,
        status,
        leave.noOfDays || 0,
        remarks
      );

      const updated: any = await leavesApi.getById(leaveId);
      leave = updated.data;

      showApproveModal = false;
      showRejectModal = false;
      remarks = "";
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function formatDate(date: string): string {
    return date
      ? new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : $t("leaves.leave_details.status.na");
  }

  const statusColors: Record<string, string> = {
    Pending: "text-amber-700 bg-amber-100",
    Approved: "text-emerald-700 bg-emerald-100",
    Rejected: "text-rose-700 bg-rose-100",
    Cancelled: "text-slate-600 bg-slate-200",
  };

  function getStatusColor(status: string): string {
    return statusColors[status] || "text-gray-600 bg-gray-100";
  }

  function getLeaveValue(key: FieldKey): any {
    if (!leave) return null;

    if (key === "user" || key === "approvedBy") {
      return leave[key]?.name || null;
    }

    return leave[key as keyof LeaveRequest];
  }
</script>

<div class="container mx-auto p-6 bg-white shadow-md rounded-lg">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold text-gray-800 flex items-center">
      <MessageSquare class="mr-3 text-blue-500" size={24} />
      {$t("leaves.leave_details.page_title")}
    </h2>

    {#if leave?.status === "Pending"}
      <div class="flex space-x-2">
        {#if $buttonVisibility.canApprove}
          <button
            class="btn btn-green"
            on:click={() => (showApproveModal = true)}
          >
            <Check class="mr-2" size={16} />
            {$t("leaves.leave_details.buttons.approve")}
          </button>
        {/if}

        {#if $buttonVisibility.canReject}
          <button class="btn btn-red" on:click={() => (showRejectModal = true)}>
            <Close class="mr-2" size={16} />
            {$t("leaves.leave_details.buttons.reject")}
          </button>
        {/if}

        {#if $buttonVisibility.canWithdraw}
          <button
            class="btn btn-red"
            on:click={() => handleStatusUpdate("Cancelled")}
          >
            <Close class="mr-2" size={16} />
            {$t("leaves.leave_details.buttons.withdraw")}
          </button>
        {/if}
      </div>
    {/if}
  </div>

  {#if error}
    <div class="alert alert-error">{error}</div>
  {:else if loading}
    <div class="text-center text-gray-500 py-10">
      {$t("leaves.leave_details.loading_message")}
    </div>
  {:else if leave}
    <div class="grid grid-cols-2 gap-6">
      {#each fields as field}
        {#if !field.condition || field.condition()}
          <div
            class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <div class="flex items-center mb-2">
              <svelte:component
                this={field.icon}
                class="mr-3 text-blue-500"
                size={20}
              />
              <h3 class="text-sm font-medium text-gray-600">{field.label}</h3>
            </div>

            <div class="text-base font-semibold text-gray-800">
              {#if field.key === "status"}
                <span
                  class={`px-2 py-1 rounded text-sm ${getStatusColor(leave[field.key])}`}
                >
                  {leave[field.key].toLowerCase()}
                </span>
              {:else if field.key === "leaveType"}
                {getLeaveTypeLabel(leave[field.key] ?? "")}
              {:else if field.key === "startDate" || field.key === "endDate"}
                {formatDate(leave[field.key])}
              {:else if field.key === "approvedBy"}
                {leave[field.key]?.name || $t("leaves.leave_details.status.na")}
              {:else if field.key === "user"}
                {leave[field.key]?.name || $t("leaves.leave_details.status.na")}
              {:else}
                {leave[field.key] || $t("leaves.leave_details.status.na")}
              {/if}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<Modal
  show={showApproveModal}
  title={$t("leaves.leave_details.modals.approve_title")}
  onClose={() => (showApproveModal = false)}
>
  <form
    on:submit|preventDefault={() => handleStatusUpdate("Approved")}
    class="space-y-6"
  >
    <div class="form-control">
      <label for="approve-remarks" class="label"
        >{$t("leaves.leave_details.modals.remarks_label")}</label
      >
      <textarea
        id="approve-remarks"
        class="textarea textarea-bordered h-24"
        bind:value={remarks}
      ></textarea>
    </div>

    <div class="flex justify-end space-x-2">
      <button
        type="button"
        class="btn btn-ghost"
        on:click={() => (showApproveModal = false)}
      >
        {$t("leaves.leave_details.buttons.cancel")}
      </button>
      <button type="submit" class="btn btn-green" disabled={loading}>
        {loading
          ? $t("leaves.leave_details.buttons.approving")
          : $t("leaves.leave_details.buttons.approve")}
      </button>
    </div>
  </form>
</Modal>

<Modal
  show={showRejectModal}
  title={$t("leaves.leave_details.modals.reject_title")}
  onClose={() => (showRejectModal = false)}
>
  <form
    on:submit|preventDefault={() => handleStatusUpdate("Rejected")}
    class="space-y-6"
  >
    <div class="form-control">
      <label for="reject-remarks" class="label"
        >{$t("leaves.leave_details.modals.remarks_label")}</label
      >
      <textarea
        id="reject-remarks"
        class="textarea textarea-bordered h-24"
        bind:value={remarks}
      ></textarea>
    </div>

    <div class="flex justify-end space-x-2">
      <button
        type="button"
        class="btn btn-ghost"
        on:click={() => (showRejectModal = false)}
      >
        {$t("leaves.leave_details.buttons.cancel")}
      </button>
      <button type="submit" class="btn btn-red" disabled={loading}>
        {loading
          ? $t("leaves.leave_details.buttons.rejecting")
          : $t("leaves.leave_details.buttons.reject")}
      </button>
    </div>
  </form>
</Modal>

<style lang="postcss">
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors;
  }
  .btn-green {
    @apply bg-green-500 text-white hover:bg-green-600;
  }
  .btn-red {
    @apply bg-red-500 text-white hover:bg-red-600;
  }
  .btn-ghost {
    @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
  }
  .alert-error {
    @apply bg-red-50 text-red-800 p-4 rounded-lg;
  }
  .textarea {
    @apply w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200;
  }
</style>
