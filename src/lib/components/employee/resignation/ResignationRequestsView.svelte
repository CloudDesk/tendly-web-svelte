<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { auth } from "$lib/stores/auth";
  import { resignationApi } from "$lib/services/api";
  import type {
    ApproveResignationData,
    IResignationEmployee,
  } from "$lib/types";
  import {
    X,
    CheckCircle2,
    Ban,
    Loader2,
    Filter,
    User,
    Mail,
    FileText,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
  } from "lucide-svelte";
  import Modal from "$lib/components/common/Modal.svelte";
  import { toast } from "$lib/components/common/stores/toast.store";

  // Props
  export let role: "admin" | "manager";
  export let title: string =
    role === "admin"
      ? "Resignation Requests (All)"
      : "Manager – Resignation Requests";

  // Component state
  let user = $auth.user;
  let resignations: IResignationEmployee[] = [];
  let loading = true;
  let showModal = false;
  let actionType: "approve" | "reject" | null = null;
  let selectedEmployee: IResignationEmployee | null = null;

  // Form state
  let remarks = "";
  let noticePeriodDays: number | null = null;
  let approvedLastWorkingDay: string | null = null;
  let formErrors = {
    remarks: "",
    noticePeriodDays: "",
    approvedLastWorkingDay: "",
  };
  let today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd format
  // Filter state
  let selectedStatus:
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Withdrawn"
    | "All" = "All";

  let showFilters = false;

  // Pagination state
  let meta = {
    page: 1,
    limit: 1,
    total: 0,
    totalPages: 1,
  };

  // Status colors
  const statusColors = {
    Pending: "bg-amber-100 text-amber-800",
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
    Withdrawn: "bg-gray-100 text-gray-800",
  };

  const loadResignationData = async () => {
    if (!user?._id) return;
    loading = true;
    try {
      const status = selectedStatus === "All" ? null : selectedStatus; // Use null for 'All'
      // Use the appropriate API method based on role
      const apiMethod =
        role === "admin" ? resignationApi.admin : resignationApi.manager;
      const response: any = await apiMethod(user._id, status, meta);
      console.log(response, "response");
      if (response.success) {
        resignations = response.data.resignations;
        meta = response.data.meta;
      } else {
        console.error("Failed to load data");
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      loading = false;
    }
  };

  const openModal = (
    type: "approve" | "reject",
    employee: IResignationEmployee
  ) => {
    actionType = type;
    selectedEmployee = employee;
    showModal = true;
    // Reset form values
    remarks = "";
    noticePeriodDays = null;
    approvedLastWorkingDay = null;
    // Reset form errors
    formErrors = {
      remarks: "",
      noticePeriodDays: "",
      approvedLastWorkingDay: "",
    };
  };

  const closeModal = () => {
    showModal = false;
    actionType = null;
    selectedEmployee = null;
  };

  const validateForm = (): boolean => {
    let isValid = true;
    formErrors = {
      remarks: "",
      noticePeriodDays: "",
      approvedLastWorkingDay: "",
    };

    if (!remarks.trim()) {
      formErrors.remarks = "Remarks are required";
      isValid = false;
    }

    if (actionType === "approve") {
      if (!noticePeriodDays || noticePeriodDays <= 0) {
        formErrors.noticePeriodDays = "Notice period must be greater than 0";
        isValid = false;
      }

      if (!approvedLastWorkingDay) {
        formErrors.approvedLastWorkingDay = "Last working day is required";
        isValid = false;
      }
    }

    return isValid;
  };

  const submitAction = async () => {
    if (!selectedEmployee) return;

    if (!validateForm()) {
      return;
    }
    const today = new Date();
    const approvedLastWorkingDayUTC = new Date(
      `${approvedLastWorkingDay || today.toISOString().split("T")[0]}T00:00:00Z`
    );

    console.log(
      approvedLastWorkingDayUTC.toISOString(),
      "approvedLastWorkingDayUTC"
    );
    const payload: ApproveResignationData = {
      remarks,
      noticePeriodDays: noticePeriodDays || 0, // Ensure a default value
      approvedLastWorkingDay: approvedLastWorkingDayUTC.toISOString(), // Ensure a default value
    };
    //approvedLastWorkingDay :"2025-06-19"
    console.log(payload, "submitAction payload");
    console.log(actionType, "submitAction actionType");
    try {
      if (actionType === "approve") {
        let result = await resignationApi.approve(
          selectedEmployee.employeeId,
          payload
        );
        console.log(result, "Resignation approved successfully.");
        toast.success("Resignation approved successfully.");
      } else if (actionType === "reject") {
        let result = await resignationApi.reject(
          selectedEmployee.employeeId,
          payload.remarks
        );
        console.log(result, "Resignation rejected successfully.");

        toast.success("Resignation rejected successfully.");
      }
      closeModal();
      loadResignationData(); // Refresh data after action
    } catch (error) {
      console.error("Failed to submit action", error);
    }
  };

  // Handle page change
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      meta.page = newPage;
      loadResignationData();
    }
  };

  // Toggle filters
  const toggleFilters = () => {
    showFilters = !showFilters;
  };

  // Reload data when the filter changes
  $: if (selectedStatus) {
    meta.page = 1; // Reset to first page when filter changes
    loadResignationData();
  }

  onMount(() => {
    loadResignationData();
  });
</script>

<!-- UI -->
<div class="bg-gray-50 min-h-screen">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6">
      <p class="text-2xl font-bold text-gray-900 flex items-center">
        {title}
      </p>

      <div class="mt-3 md:mt-0 flex items-center">
        <button
          on:click={toggleFilters}
          class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Filter size={16} />
          {#if showFilters}Hide{:else}Show{/if} Filters
        </button>
      </div>
    </div>

    <!-- Filters -->
    {#if showFilters}
      <div
        transition:fly={{ y: -10, duration: 200 }}
        class="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100"
      >
        <div class="flex flex-wrap items-center gap-4">
          <label
            for="statusFilter"
            class="text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            <AlertCircle size={14} />
            Status:
          </label>
          <select
            id="statusFilter"
            bind:value={selectedStatus}
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
            <option value="All">All Statuses</option>
          </select>
        </div>
      </div>
    {/if}

    {#if loading}
      <div class="flex flex-col items-center justify-center py-12">
        <Loader2 class="animate-spin text-blue-500 mb-2" size={32} />
        <p class="text-gray-500">Loading resignation requests...</p>
      </div>
    {:else if resignations.length === 0}
      <div class="bg-gray-50 rounded-xl p-12 text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4"
        >
          <FileText class="text-gray-400" size={24} />
        </div>
        <p class="text-gray-600 text-lg font-medium">
          No resignation requests found
        </p>
        <p class="text-gray-500 mt-1">
          Try changing your filters or check back later
        </p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each resignations as item, index (item.employeeId + item.resignation.submittedAt)}
          <div
            transition:fade={{ duration: 150, delay: index * 50 }}
            class="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
          >
            <div
              class="p-5 sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div class="flex-1 space-y-2">
                <div class="flex items-start justify-between">
                  <div>
                    <h3
                      class="text-lg font-semibold text-gray-900 flex items-center gap-2"
                    >
                      <User size={18} class="text-gray-500" />
                      {item.employeeName}
                    </h3>
                    <p
                      class="text-sm text-gray-500 flex items-center gap-1 mt-1"
                    >
                      <Mail size={14} class="text-gray-400" />
                      {item.email}
                    </p>
                  </div>
                  <span
                    class={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[item.resignation.status] || "bg-gray-100 text-gray-800"}`}
                  >
                    {item.resignation.status}
                  </span>
                </div>

                <div class="pt-2 border-t border-gray-100 mt-2">
                  <p class="text-sm text-gray-700 flex items-start gap-2">
                    <FileText
                      size={16}
                      class="text-gray-400 mt-0.5 flex-shrink-0"
                    />
                    <span>
                      <strong class="font-medium">Summary</strong>
                      <span class="block mt-1">{item.resignation.summary}</span>
                    </span>
                  </p>
                </div>
              </div>

              <div
                class="pt-4 border-t border-gray-100 mt-4 items-center flex justify-end"
              >
                {#if item.resignation.status === "Pending"}
                  <div class="flex gap-3 mt-2 sm:mt-0">
                    <button
                      on:click={() => openModal("approve", item)}
                      class="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <CheckCircle2 size={18} /> Approve
                    </button>
                    <button
                      on:click={() => openModal("reject", item)}
                      class="px-4 py-2 bg-rose-600 text-white rounded-lg flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-sm"
                    >
                      <Ban size={18} /> Reject
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Pagination -->
      {#if meta.totalPages > 1}
        <div
          class="flex justify-between items-center mt-6 bg-white rounded-xl p-3 shadow-sm border border-gray-100"
        >
          <button
            class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            on:click={() => changePage(meta.page - 1)}
            disabled={meta.page === 1}
          >
            <ChevronLeft class="h-4 w-4" />
            Previous
          </button>
          <div class="flex items-center gap-1">
            {#each Array(meta.totalPages) as _, i}
              {#if i + 1 === meta.page}
                <button
                  class="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded font-medium"
                >
                  {i + 1}
                </button>
              {:else if i + 1 === 1 || i + 1 === meta.totalPages || (i + 1 >= meta.page - 1 && i + 1 <= meta.page + 1)}
                <button
                  on:click={() => changePage(i + 1)}
                  class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
                >
                  {i + 1}
                </button>
              {:else if (i + 1 === 2 && meta.page > 3) || (i + 1 === meta.totalPages - 1 && meta.page < meta.totalPages - 2)}
                <span class="w-8 h-8 flex items-center justify-center">...</span
                >
              {/if}
            {/each}
          </div>
          <button
            class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            on:click={() => changePage(meta.page + 1)}
            disabled={meta.page === meta.totalPages}
          >
            Next

            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Modal -->
{#if showModal && selectedEmployee}
  <Modal
    show={showModal}
    onClose={closeModal}
    title={`Approve Resignation - ${selectedEmployee.employeeName}`}
  >
    <div class="space-y-5">
      <div>
        <label
          for="remarks"
          class="block text-sm font-medium text-gray-700 mb-1">Remarks</label
        >
        <textarea
          id="remarks"
          bind:value={remarks}
          placeholder="Enter your comments or reasons..."
          class="w-full border rounded-lg p-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all {formErrors.remarks
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300'}"
          rows={3}
        ></textarea>
        {#if formErrors.remarks}
          <p class="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {formErrors.remarks}
          </p>
        {/if}
      </div>

      {#if actionType === "approve"}
        <div>
          <label
            for="noticePeriodDays"
            class="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
          >
            Notice Period Days
          </label>
          <input
            type="number"
            bind:value={noticePeriodDays}
            id="noticePeriodDays"
            class="w-full border rounded-lg p-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all {formErrors.noticePeriodDays
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300'}
              : 'border-gray-300'}"
            min={1}
          />
          {#if formErrors.noticePeriodDays}
            <p class="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {formErrors.noticePeriodDays}
            </p>
          {/if}
        </div>

        <div>
          <label
            for="lastWorkingDay"
            class="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"
          >
            Last Working Day
          </label>
          <input
            id="lastWorkingDay"
            type="date"
            min={today}
            bind:value={approvedLastWorkingDay}
            class="w-full border rounded-lg p-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all {formErrors.approvedLastWorkingDay
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300'}"
          />
          {#if formErrors.approvedLastWorkingDay}
            <p class="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {formErrors.approvedLastWorkingDay}
            </p>
          {/if}
        </div>
      {/if}
      <div class="flex items-center justify-end gap-2 mt-4">
        <button
          on:click={submitAction}
          class={`flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
            actionType === "approve"
              ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
              : "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
          }`}
        >
          {#if actionType === "approve"}
            <CheckCircle2 size={18} />
          {:else}
            <Ban size={18} />
          {/if}
          <span>Submit {actionType}</span>
        </button>
      </div>
    </div>
  </Modal>
{/if}
