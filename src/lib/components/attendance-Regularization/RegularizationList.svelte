<script lang="ts">
  import { attendanceRegularizeApi } from "$lib/services/api";
  import { auth } from "$lib/stores/auth";
  import { onMount } from "svelte";
  import { format } from "date-fns";
  import {
    Clock,
    Calendar,
    MessageSquare,
    User,
    CheckCircle,
    XCircle,
    Filter,
    Calendar as CalendarIcon,
    RefreshCw,
    ChevronDown,
    Loader,
  } from "lucide-svelte";
  import LoaderNew from "../common/LoaderNew.svelte";
  import { slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import Modal from "../common/Modal.svelte";
  import { toast } from "../common/stores/toast.store";

  export let viewType: "user" | "manager" | "admin" = "user";
  export let isAdmin: boolean = false;
  const user = $auth.user;

  interface ApiRegularizationRecord {
    _id: string;
    attendanceId: string;
    shiftDay?: string;
    from: string | Date;
    to: string | Date;
    reason: string;
    status: string;
    approver: {
      id: string;
      name: string;
    };
    employee?: {
      id: string;
      name: string;
      department?: string;
    };
    approvedDate: string | Date | null;
    comments: string | null;
  }

  interface RegularizationRecord {
    _id: string;
    attendanceId: string;
    shiftDay?: string;
    from: string | Date;
    to: string | Date;
    reason: string;
    status:
      | "Approved"
      | "Rejected"
      | "Pending"
      | "Rejected-Absent"
      | "Rejected-Leave";
    approver: {
      id: string;
      name: string;
    };
    employee?: {
      id: string;
      name: string;
      department?: string;
    };
    approvedDate: string | Date | null;
    comments: string | null;
  }

  let isLoading = true;
  let regularizations: RegularizationRecord[] = [];
  let error: string | null = null;
  let filterStatus:
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Rejected-Absent"
    | "Rejected-Leave" = "Pending";
  let filterDate: string | null = null;
  let comments: string = "";
  let activeRecord: string | null = null;
  let showCommentsModal = false;
  let actionType: "approve" | "reject" | null = null;
  let showFilters = false;
  let processing = false;

  // Format date to display
  function formatDateTime(date: string | Date | undefined): string {
    if (!date) return "N/A";
    return format(new Date(date), "dd MMM yyyy, hh:mm a");
  }

  // Format date only
  function formatDate(date: string | Date | undefined): string {
    if (!date) return "N/A";
    return format(new Date(date), "dd MMM yyyy");
  }

  // Format time only
  function formatTime(date: string | Date): string {
    return format(new Date(date), "hh:mm a");
  }

  // Get status color class
  function getStatusClass(status: string): string {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Rejected":
      case "Rejected-Absent":
      case "Rejected-Leave":
        return "bg-red-100 text-red-800 border border-red-200";
      case "Pending":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "Approved":
        return CheckCircle;
      case "Rejected":
      case "Rejected-Absent":
      case "Rejected-Leave":
        return XCircle;
      default:
        return Clock;
    }
  }

  async function fetchRegularizations() {
    isLoading = true;
    error = null;
    try {
      const userId = $auth.user?._id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      let response;
      if (viewType === "user") {
        response = await attendanceRegularizeApi.getMyRegularizationRecords(
          userId,
          filterStatus,
          filterDate || undefined
        );
      } else {
        // For manager or admin view
        response =
          await attendanceRegularizeApi.getAssignedRegularizationRecords(
            userId,
            filterStatus,
            viewType === "admin",
            filterDate || undefined
          );
      }

      if (response.success && response.data) {
        const apiData = Array.isArray(response.data)
          ? response.data
          : [response.data];

        regularizations = apiData.map((record) => ({
          ...record,
          status: validateStatus(record.status),
        })) as RegularizationRecord[];
      } else {
        throw new Error("Failed to fetch regularizations");
      }
    } catch (e) {
      console.error("Error fetching regularizations:", e);
      error = "Unable to load regularization records";
    } finally {
      isLoading = false;
    }
  }

  // Process action (approve/reject)
  async function processAction(recordId: string, action: "approve" | "reject") {
    console.log("processAction", recordId, action, comments);
    if (!recordId) return;

    // Normalize comments by removing extra newlines and trimming
    const normalizedComments = comments.replace(/\n+/g, " ").trim();

    processing = true;
    try {
      let result = await attendanceRegularizeApi.updateRegularizationStatus(
        recordId,
        {
          status: action === "approve" ? "Approved" : "Rejected",
          approver: { id: user?._id, name: user?.name },
          comments: normalizedComments,
        }
      );
      console.log(result, "result processAction");
      if (result.success) {
        toast.success(
          `Attendance Regularization ${action === "approve" ? "Approved" : "Rejected"}`
        );
      }

      closeModal();
      // Optionally refresh data from server
      await fetchRegularizations();
    } catch (e) {
      console.error("Error processing action:", e);
      error = "An error occurred while processing your request";
    } finally {
      processing = false;
    }
  }

  // Validate and transform status to ensure it matches our enum
  function validateStatus(
    status: string | string[]
  ):
    | "Approved"
    | "Rejected"
    | "Pending"
    | "Rejected-Absent"
    | "Rejected-Leave" {
    const validStatuses = [
      "Approved",
      "Rejected",
      "Pending",
      "Rejected-Absent",
      "Rejected-Leave",
    ];

    // Handle array status by taking the first status
    const statusStr = Array.isArray(status) ? status[0] : status;

    // Handle case variations
    const normalizedStatus = statusStr
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("-");

    return validStatuses.includes(normalizedStatus)
      ? (normalizedStatus as any)
      : "Pending";
  }

  function openModal(
    record: RegularizationRecord,
    action: "approve" | "reject"
  ) {
    activeRecord = record._id;
    actionType = action;
    comments = "";
    showCommentsModal = true;
  }

  function closeModal() {
    activeRecord = null;
    actionType = null;
    comments = "";
    showCommentsModal = false;
  }

  function handleSubmitAction() {
    if (activeRecord && actionType) {
      processAction(activeRecord, actionType);
    }
  }

  function toggleFilters() {
    showFilters = !showFilters;
  }

  function applyFilters() {
    fetchRegularizations();
    showFilters = false;
  }

  function resetFilters() {
    filterStatus = "Pending";
    filterDate = null;
    fetchRegularizations();
    showFilters = false;
  }

  onMount(() => {
    fetchRegularizations();
  });
</script>

<div
  class="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100"
>
  <div
    class="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-4 text-white"
  >
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-semibold leading-6">
          {#if viewType === "user"}
            My Regularization History
          {:else if viewType === "manager"}
            Team Regularization Requests
          {:else}
            All Regularization Requests
          {/if}
        </h3>
        <p class="mt-1 text-sm text-indigo-100">
          {#if viewType === "user"}
            Your attendance regularization requests
          {:else}
            Manage attendance regularization requests
          {/if}
        </p>
      </div>

      <div class="flex space-x-2">
        <button
          on:click={toggleFilters}
          class="flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1.5 rounded-md text-sm transition-colors duration-200"
        >
          <Filter class="w-4 h-4" />
          <span>Filter</span>
          <ChevronDown class="w-4 h-4" />
        </button>

        <button
          on:click={fetchRegularizations}
          class="flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1.5 rounded-md text-sm transition-colors duration-200"
          disabled={isLoading}
        >
          <RefreshCw class="w-4 h-4 {isLoading ? 'animate-spin' : ''}" />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  </div>

  {#if showFilters}
    <div
      class="bg-gray-50 p-4 border-b border-gray-200"
      transition:slide={{ duration: 300, easing: quintOut }}
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            for="status"
            class="block text-sm font-medium text-gray-700 mb-1">Status</label
          >
          <select
            id="status"
            bind:value={filterStatus}
            class="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Rejected-Absent">Rejected (Absent)</option>
            <option value="Rejected-Leave">Rejected (Leave)</option>
          </select>
        </div>

        <div>
          <label for="date" class="block text-sm font-medium text-gray-700 mb-1"
            >Date</label
          >
          <div class="relative">
            <input
              type="date"
              id="date"
              bind:value={filterDate}
              class="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <CalendarIcon
              class="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
            />
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end space-x-3">
        <button
          on:click={resetFilters}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
        >
          Reset
        </button>
        <button
          on:click={applyFilters}
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
        >
          Apply Filters
        </button>
      </div>
    </div>
  {/if}

  {#if isLoading}
    <div class="flex justify-center items-center p-12">
      <LoaderNew />
    </div>
  {:else if error}
    <div class="p-8 text-center">
      <div
        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4"
      >
        <XCircle class="w-8 h-8" />
      </div>
      <p class="text-lg font-medium text-gray-900">{error}</p>
      <button
        on:click={fetchRegularizations}
        class="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
      >
        Try Again
      </button>
    </div>
  {:else if regularizations.length === 0}
    <div class="p-12 text-center">
      <div
        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4"
      >
        <Calendar class="w-8 h-8" />
      </div>
      <p class="text-lg font-medium text-gray-900">
        No regularization records found
      </p>
      <p class="mt-1 text-sm text-gray-500">
        {#if viewType === "user"}
          You don't have any {filterStatus.toLowerCase()} regularization requests
        {:else}
          There are no {filterStatus.toLowerCase()} regularization requests to manage
        {/if}
      </p>
    </div>
  {:else}
    <div class="divide-y divide-gray-200">
      {#each regularizations as record}
        <div class="px-6 py-5 hover:bg-gray-50 transition-colors">
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="flex-shrink-0">
                <div
                  class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center"
                >
                  {#if record.employee?.name}
                    <span class="text-indigo-700 font-semibold text-lg">
                      {record.employee.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)}
                    </span>
                  {:else}
                    <User class="w-6 h-6 text-indigo-600" />
                  {/if}
                </div>
              </div>

              <div>
                {#if viewType !== "user" && record.employee}
                  <div class="font-medium text-gray-900">
                    {record.employee.name}
                  </div>
                  {#if record.employee.department}
                    <div class="text-sm text-gray-500">
                      {record.employee.department}
                    </div>
                  {/if}
                {/if}

                <div class="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar class="w-4 h-4 mr-1.5 text-gray-400" />
                  <span>{formatDate(record.shiftDay || record.from)}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-3">
              <span
                class="flex items-center px-3 py-1 text-sm font-medium rounded-full {getStatusClass(
                  record.status
                )}"
              >
                <svelte:component
                  this={getStatusIcon(record.status)}
                  class="w-4 h-4 mr-1"
                />
                {record.status}
              </span>

              {#if (viewType === "manager" || viewType === "admin") && record.status === "Pending"}
                <div class="flex space-x-2">
                  <button
                    on:click={() => openModal(record, "approve")}
                    class="flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle class="w-4 h-4 mr-1" />
                    Approve
                  </button>
                  <button
                    on:click={() => openModal(record, "reject")}
                    class="flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    <XCircle class="w-4 h-4 mr-1" />
                    Reject
                  </button>
                </div>
              {/if}
            </div>
          </div>

          <div class="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex items-center">
                <Clock class="w-5 h-5 mr-2 text-indigo-500" />
                <div>
                  <div class="text-xs text-gray-500">Time Period</div>
                  <div class="font-medium">
                    {formatTime(record.from)} - {formatTime(record.to)}
                  </div>
                </div>
              </div>

              <div class="flex items-center">
                <User class="w-5 h-5 mr-2 text-indigo-500" />
                <div>
                  <div class="text-xs text-gray-500">Approver</div>
                  <div class="font-medium">{record.approver.name}</div>
                </div>
              </div>

              {#if record.approvedDate}
                <div class="flex items-center">
                  <Calendar class="w-5 h-5 mr-2 text-indigo-500" />
                  <div>
                    <div class="text-xs text-gray-500">Processed On</div>
                    <div class="font-medium">
                      {formatDateTime(record.approvedDate)}
                    </div>
                  </div>
                </div>
              {/if}
            </div>

            <div class="mt-3 pt-3 border-t border-gray-200">
              <div class="text-sm text-gray-500">Reason:</div>
              <p class="mt-1 text-gray-700">{record.reason}</p>
            </div>

            {#if record.comments}
              <div class="mt-3 pt-3 border-t border-gray-200">
                <div class="flex items-start gap-2">
                  <MessageSquare class="w-4 h-4 mt-0.5 text-gray-400" />
                  <div>
                    <div class="text-sm text-gray-500">Comments:</div>
                    <p class="mt-1 text-gray-700 italic">{record.comments}</p>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showCommentsModal}
  <Modal
    show={showCommentsModal}
    title={`${actionType === "approve" ? "Approve" : "Reject"} Regularization`}
    onClose={closeModal}
  >
    <div class="sm:flex sm:items-start">
      <div
        class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-{actionType ===
        'approve'
          ? 'green'
          : 'red'}-100 sm:mx-0 sm:h-10 sm:w-10"
      >
        {#if actionType === "approve"}
          <CheckCircle class="h-6 w-6 text-green-600" />
        {:else}
          <XCircle class="h-6 w-6 text-red-600" />
        {/if}
      </div>
      <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
        <div class="mt-2">
          <p class="text-sm text-gray-500">
            Are you sure you want to {actionType === "approve"
              ? "approve"
              : "reject"}
            this regularization request ?
          </p>
          <div class="mt-4">
            <label
              for="comments"
              class="block text-sm font-medium text-gray-700"
            >
              Comments (Optional)
            </label>
            <textarea
              id="comments"
              bind:value={comments}
              rows="3"
              class="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add your comments here..."
            />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
      <button
        type="button"
        on:click={handleSubmitAction}
        disabled={processing}
        class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-{actionType ===
        'approve'
          ? 'green'
          : 'red'}-600 text-base font-medium text-white hover:bg-{actionType ===
        'approve'
          ? 'green'
          : 'red'}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-{actionType ===
        'approve'
          ? 'green'
          : 'red'}-500 sm:ml-3 sm:w-auto sm:text-sm"
      >
        {#if processing}
          <Loader class="animate-spin h-5 w-5 text-white mr-3" />
          Processing...
        {:else}
          {actionType === "approve" ? "Approve" : "Reject"}
        {/if}
      </button>
      <button
        type="button"
        on:click={closeModal}
        class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
      >
        Cancel
      </button>
    </div>
  </Modal>
{/if}
