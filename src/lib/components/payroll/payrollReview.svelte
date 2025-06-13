<script lang="ts">
  import { onMount } from "svelte";
  import { payrollApi } from "$lib/services/api";
  import PayrollSummaryTable from "./payrollSummaryTable.svelte";
  import LoaderNew from "../common/LoaderNew.svelte";
  import { toast } from "../common/stores/toast.store";
  let month = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 0).padStart(2, "0");
    return `${y}-${m}`;
  })();

  let summary: any = null;
  let isLoadingSummary = false;
  let selectedIds = new Set<string>();

  async function fetchPayrollSummary() {
    try {
      isLoadingSummary = true;
      const [year, monthNum] = month.split("-");
      console.log(month);
      const response = (await payrollApi.payrollSummary(
        parseInt(monthNum),
        parseInt(year),
        "PendingApproval"
      )) as { data: any }; // Add a type assertion here
      summary = response.data;
    } catch (err) {
      console.error("Failed to load payroll summary", err);
      summary = null;
    } finally {
      isLoadingSummary = false;
    }
  }

  function handleFilterChange() {
    fetchPayrollSummary();
  }

  async function handleBulkAction(event: CustomEvent) {
    const { currentStatus, processIds, cancelIds } = event.detail;
    console.log("Received bulk action:", currentStatus, processIds, cancelIds);

    try {
      const results = [];
      // Handle "Proceed" actions (move to next status)
      if (processIds?.length > 0) {
        // const nextStatus = statusTransitionMap[currentStatus] || "PendingApproval"; // Default to PendingApproval if unknown
        const nextStatus = "InPayment";
        const proceedPayload = {
          recordIds: processIds,
          status: nextStatus,
        };

        const proceedResult: any =
          await payrollApi.updateStatus(proceedPayload);
        results.push({
          status: nextStatus,
          success: proceedResult?.success ?? false,
          data: proceedResult?.data,
        });
      }
      // Handle "Cancel" actions
      if (cancelIds?.length > 0) {
        const cancelPayload = {
          recordIds: cancelIds,
          status: "Cancelled",
        };

        const cancelResult: any = await payrollApi.updateStatus(cancelPayload);
        results.push({
          status: "Cancelled",
          success: cancelResult?.success ?? false,
          data: cancelResult?.data,
        });
      }
      // Process results for user feedback
      results.forEach(({ status, success, data }) => {
        if (success) {
          const { updatedCount, failedRecords } = data;
          if (updatedCount > 0) {
            toast.success(`${updatedCount} records updated to ${status}`); // Optional: Show success toast
          }
          if (failedRecords?.length > 0) {
            failedRecords.forEach(
              ({ id, reason }: { id: string; reason: string }) => {
                toast.error(`Record ${id} failed: ${reason}`); // Optional: Show error toast
              }
            );
          }
        } else {
          toast.error(
            `Failed to update status ${status}: ${data?.error?.message || "Unknown error"}`
          );
        }
      });
    } catch (error: any) {
      console.log("error in bulk action", error);
      toast.error(`Bulk action failed: ${error.message}`);
    }
  }
  onMount(fetchPayrollSummary);
</script>

<div class="p-4 md:p-6 bg-gray-50 min-h-screen">
  <!-- Header -->
  <div class="mb-4 md:mb-6">
    <h1 class="text-xl md:text-2xl font-bold text-gray-900">
      Payroll Review
      {new Date(month + "-01").toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}
    </h1>
  </div>

  <!-- Filter Section -->
  <div class="bg-white shadow rounded-md mb-4 md:mb-6">
    <div class="flex flex-wrap gap-4 p-4">
      <!-- Month Filter -->
      <div class="flex flex-col w-full sm:w-auto">
        <label class="text-sm font-medium text-gray-600 mb-1">Month</label>
        <input
          type="month"
          bind:value={month}
          on:change={handleFilterChange}
          class="min-w-[160px] px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  </div>
  <!-- Summary Section -->

  {#if isLoadingSummary}
    <LoaderNew />
  {:else if summary}
    <PayrollSummaryTable
      {summary}
      allowedActions={["PendingApproval"]}
      tableColumns={[
        { key: "employee", label: "Employee", type: "employee" },
        // { key: "monthlyGross", label: "Gross Salary", type: "currency" },
        { key: "bankAccountNumber", label: "Bank Account", type: "bank" },
        { key: "netSalary", label: "Net Salary", type: "currency" },
        { key: "status", label: "Status", type: "status" },
      ]}
      columnActions={[
        { key: "Proceed", label: "Approve", color: "green" },
        { key: "Cancel", label: "Reject", color: "red" },
      ]}
      on:bulkAction={handleBulkAction}
    />
  {/if}
</div>
