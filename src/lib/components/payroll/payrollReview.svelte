<script lang="ts">
  import { onMount } from "svelte";
  import { payrollApi } from "$lib/services/api";
  import { HandCoins, Scissors, Users, Wallet } from "lucide-svelte";
  import PayrollSummaryTable from "./payrollSummaryTable.svelte";
  import LoaderNew from "../common/LoaderNew.svelte";
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

  async function handleBulkAction(event: CustomEvent) {}
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
      on:bulkAction={handleBulkAction}
    />
  {/if}
</div>

<!-- 
  {#if summary}
    <div class="bg-white shadow rounded p-4 flex flex-col gap-2">
      <div class="text-sm">Status: <strong>Pending Approval</strong></div>
      <div class="flex gap-6 text-sm">
        <div>Total Employees: <strong>{summary.totalEmployees}</strong></div>
        <div>Draft: <strong>{summary.statusBreakdown?.Draft ?? 0}</strong></div>
        <div>
          Approved: <strong>{summary.statusBreakdown?.Approved ?? 0}</strong>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center bg-white p-4 shadow rounded">
      <div class="space-x-2">
        <button
          class="px-3 py-2 bg-blue-500 text-white rounded shadow-sm text-sm hover:bg-blue-600"
          >Download Excel Summary</button
        >
        <button class="px-3 py-2 bg-gray-100 text-sm rounded hover:bg-gray-200"
          >Audit Log</button
        >
      </div>
    </div>

    <div class="overflow-x-auto bg-white rounded shadow">
      <table class="min-w-full text-sm border-t">
        <thead class="bg-gray-100 text-gray-700 text-left">
          <tr>
            <th class="p-2">Employee Name</th>
            <th class="p-2">Net Pay</th>
            <th class="p-2">Bank Acc.</th>
            <th class="p-2">Status</th>
            <th class="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {#each summary.exportableDetails as emp}
            <tr class="border-t hover:bg-gray-50">
              <td class="p-2">{emp.employeeName}</td>
              <td class="p-2">₹{emp.netSalary.toLocaleString()}</td>
              <td class="p-2"
                >{emp.bankAccountNumber?.slice(-4)?.padStart(8, "*") ??
                  "N/A"}</td
              >
              <td class="p-2">{emp.status}</td>
              <td class="p-2 flex gap-2">
                <button
                  class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                  on:click={() => selectedIds.add(emp._id)}>✔ Approve</button
                >
                <button
                  class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                  on:click={() => selectedIds.add(emp._id)}>✖ Cancel</button
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded"
        on:click={markAsProcessing}
      >
        ▶ Mark as Processing
      </button>
    </div>
  {:else if isLoadingSummary}
    <div class="text-gray-500">Loading payroll summary...</div>
  {:else}
    <div class="text-red-500">No payroll summary found for selected month.</div>
  {/if}
-->

<style>
  th,
  td {
    white-space: nowrap;
  }
</style>
