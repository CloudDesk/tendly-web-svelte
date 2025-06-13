<script lang="ts">
  import {
    Check,
    ClipboardList,
    HandCoins,
    Scissors,
    Users,
    Wallet,
    X,
  } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";

  interface PayrollSummaryEmployee {
    _id: string;
    employeeId: string;
    employeeName: string;
    bankAccountNumber: string;
    ifscCode: string;
    bankName: string;
    netSalary: number;
    monthlyGross: number;
    presentDays: number;
    totalDaysInMonth: number;
    lopDays: number;
    payableDays: number;
    status: string;
  }

  interface RowSelection {
    id: string;
    action: "Proceed" | "Cancel" | null;
    employee: PayrollSummaryEmployee;
  }

  export let summary: any;
  export let allowedActions: string[] = [];
  console.log(summary, "summary table");
  const dispatch = createEventDispatcher();

  let selectedCurrentStatus: string = allowedActions[0] || "Draft";
  let rowSelections = new Map<string, RowSelection>();
  let selectAllChecked = false;

  // Reactive declarations
  $: filteredEmployees =
    summary?.exportableDetails?.filter(
      (emp: PayrollSummaryEmployee) => emp.status === selectedCurrentStatus
    ) || [];

  $: validEmployees = filteredEmployees.filter((emp: PayrollSummaryEmployee) =>
    isActionAllowed(emp.status)
  );

  $: selectedRows = Array.from(rowSelections.values()).filter(
    (selection) => selection.action !== null
  );
  $: hasSelections = rowSelections.size > 0;
  $: allValidSelected =
    validEmployees.length > 0 &&
    validEmployees.every((emp: PayrollSummaryEmployee) =>
      rowSelections.has(emp._id)
    );

  // Action counters
  $: proceedCount = selectedRows.filter(
    (row) => row.action === "Proceed"
  ).length;
  $: cancelCount = selectedRows.filter((row) => row.action === "Cancel").length;

  function isActionAllowed(status: string): boolean {
    return allowedActions.includes(status);
  }

  function toggleRowSelection(
    employee: PayrollSummaryEmployee,
    action: "Proceed" | "Cancel" | null = null
  ) {
    if (!isActionAllowed(employee.status)) return;

    rowSelections = new Map(rowSelections);

    if (rowSelections.has(employee._id) && action === null) {
      rowSelections.delete(employee._id);
    } else {
      rowSelections.set(employee._id, {
        id: employee._id,
        action,
        employee,
      });
    }

    updateSelectAllState();
  }

  function setRowAction(employeeId: string, action: "Proceed" | "Cancel") {
    rowSelections = new Map(rowSelections);
    const selection = rowSelections.get(employeeId);
    if (selection) {
      selection.action = action;
      rowSelections.set(employeeId, selection);
    } else {
      const employee = filteredEmployees.find(
        (emp: PayrollSummaryEmployee) => emp._id === employeeId
      );
      if (employee && isActionAllowed(employee.status)) {
        rowSelections.set(employeeId, {
          id: employeeId,
          action,
          employee,
        });
      }
    }
    updateSelectAllState();
  }

  function setGlobalAction(action: "Proceed" | "Cancel") {
    rowSelections = new Map(rowSelections);
    rowSelections.forEach((selection, id) => {
      selection.action = action;
      rowSelections.set(id, selection);
    });
  }

  function toggleSelectAll() {
    rowSelections = new Map();

    if (!selectAllChecked) {
      validEmployees.forEach((employee: PayrollSummaryEmployee) => {
        rowSelections.set(employee._id, {
          id: employee._id,
          action: null,
          employee,
        });
      });
      selectAllChecked = true;
    } else {
      selectAllChecked = false;
    }
  }

  function updateSelectAllState() {
    selectAllChecked = allValidSelected;
  }

  function clearAllSelections() {
    rowSelections = new Map();
    selectAllChecked = false;
  }

  function executeActions() {
    const processIds = selectedRows
      .filter((row) => row.action === "Proceed")
      .map((row) => row.id);

    const cancelIds = selectedRows
      .filter((row) => row.action === "Cancel")
      .map((row) => row.id);

    const payload = {
      currentStatus: selectedCurrentStatus,
      processIds,
      cancelIds,
    };

    dispatch("bulkAction", payload);
    clearAllSelections();
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "Draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PendingApproval":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "InPayment":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "Failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }
</script>

<div class="flex flex-col h-[80vh]">
  <div class="flex-none">
    <div class="mb-4">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          class="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-blue-600">Total Employees</p>
              <p class="text-2xl font-bold text-blue-900">
                {summary?.totalEmployees || 0}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center"
            >
              <Users class="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div
          class="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-green-600">Gross Salary</p>
              <p class="text-2xl font-bold text-green-900">
                ₹{summary?.totalGrossSalary?.toLocaleString() || 0}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
            >
              <Wallet class="w-5 h-5 text-white" />
              <!-- <Database class="w-5 h-5 text-white" /> -->
            </div>
          </div>
        </div>
        <div
          class="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-red-600">Deductions</p>
              <p class="text-2xl font-bold text-red-900">
                ₹{summary?.totalDeductions?.toLocaleString() || 0}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center"
            >
              <Scissors class="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div
          class="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-purple-600">Net Salary</p>
              <p class="text-2xl font-bold text-purple-900">
                ₹{summary?.totalNetSalary?.toLocaleString() || 0}
              </p>
            </div>
            <div
              class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center"
            >
              <HandCoins class="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto min-h-0">
    {#if hasSelections}
      <div
        class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-4"
      >
        <div class="flex flex-col space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <h3 class="text-lg font-semibold text-gray-900">
                Selected Actions
              </h3>
              <div class="flex space-x-2">
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {rowSelections.size} selected
                </span>
                {#if proceedCount > 0}
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                  >
                    {proceedCount} to proceed
                  </span>
                {/if}
                {#if cancelCount > 0}
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                  >
                    {cancelCount} to cancel
                  </span>
                {/if}
              </div>
            </div>

            <div class="flex space-x-3">
              {#if allValidSelected}
                <button
                  on:click={() => setGlobalAction("Proceed")}
                  class="inline-flex items-center px-4 py-2
                  bg-green-100 text-green-700
                text-sm font-medium rounded-md hover:bg-green-300 focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  <Check class="w-4 h-4 mr-2" />
                  Proceed All
                </button>
                <button
                  on:click={() => setGlobalAction("Cancel")}
                  class="inline-flex items-center px-4 py-2
                 bg-red-100 text-red-700 hover:bg-red-300
                  text-sm font-medium rounded-md focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  <X class="w-4 h-4 mr-2" />
                  Cancel All
                </button>
              {/if}
              <button
                on:click={clearAllSelections}
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <X class="w-4 h-4 mr-2" />
                Clear
              </button>
              <button
                on:click={executeActions}
                disabled={selectedRows.every((row) => row.action === null)}
                class="inline-flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check class="w-4 h-4 mr-2" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div
        class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex-1">
            <div class="flex flex-wrap gap-2">
              {#each Object.entries(summary?.statusBreakdown || {}) as [status, count]}
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border {getStatusBadgeClass(
                    status
                  )}"
                >
                  {status}: {count}
                </span>
              {/each}
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700"
                >Filter by Status:</label
              >
              <select
                bind:value={selectedCurrentStatus}
                class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {#each Object.entries(summary?.statusBreakdown || {}) as [status, count]}
                  <option value={status}>{status} ({count})</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <div
      class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectAllChecked}
                  on:change={toggleSelectAll}
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >Employee</th
              >
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >Attendance</th
              >
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >Gross Salary</th
              >
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >Net Salary</th
              >
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >Status</th
              >
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >Actions</th
              >
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#if Array.isArray(summary?.exportableDetails)}
              {#each filteredEmployees as employee (employee._id)}
                {@const isSelected = rowSelections.has(employee._id)}
                {@const selectedAction = rowSelections.get(
                  employee._id
                )?.action}
                <tr
                  class="hover:bg-gray-50 transition-colors {isSelected
                    ? 'bg-blue-50'
                    : ''}"
                >
                  <td class="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isActionAllowed(employee.status)}
                      on:change={() => toggleRowSelection(employee)}
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 {!isActionAllowed(
                        employee.status
                      )
                        ? 'opacity-50 cursor-not-allowed'
                        : ''}"
                    />
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex items-center">
                      <div
                        class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3"
                      >
                        {employee.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          {employee.employeeName}
                        </div>
                        <!-- <div class="text-xs text-gray-500">
                          ID: {employee.employeeId.slice(-6)}
                        </div> -->
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      <div class="flex items-center space-x-2">
                        <span
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {employee.presentDays}P
                        </span>
                        {#if employee.lopDays > 0}
                          <span
                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                          >
                            {employee.lopDays}L
                          </span>
                        {/if}
                      </div>
                      <div class="text-xs text-gray-500 mt-1">
                        {employee.payableDays}/{employee.totalDaysInMonth} days
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-4 text-sm font-medium text-gray-900">
                    ₹{employee.monthlyGross.toLocaleString()}
                  </td>
                  <td class="px-4 py-4 text-sm font-semibold text-green-600">
                    ₹{employee.netSalary.toLocaleString()}
                  </td>
                  <td class="px-4 py-4">
                    <span
                      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border {getStatusBadgeClass(
                        employee.status
                      )}"
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    {#if isActionAllowed(employee.status)}
                      <div class="flex space-x-1">
                        <button
                          on:click={() => setRowAction(employee._id, "Proceed")}
                          disabled={allValidSelected}
                          class="inline-flex items-center px-2 py-1 text-xs font-medium rounded {selectedAction ===
                          'Proceed'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'} {allValidSelected
                            ? 'opacity-50 cursor-not-allowed'
                            : ''} transition-colors"
                        >
                          Proceed
                        </button>
                        <button
                          on:click={() => setRowAction(employee._id, "Cancel")}
                          disabled={allValidSelected}
                          class="inline-flex items-center px-2 py-1 text-xs font-medium rounded {selectedAction ===
                          'Cancel'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'} {allValidSelected
                            ? 'opacity-50 cursor-not-allowed'
                            : ''} transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    {:else}
                      <span class="text-xs text-gray-400"
                        >No actions available</span
                      >
                    {/if}
                  </td>
                </tr>
              {/each}
            {:else}
              <tr>
                <td class="px-4 py-8 text-center text-gray-500" colspan="7">
                  <div class="flex flex-col items-center">
                    <ClipboardList class="w-12 h-12 text-gray-400 mb-2" />
                    <p class="text-sm font-medium">No records found</p>
                    <p class="text-xs">
                      Data is not yet loaded or no employees match the current
                      filter.
                    </p>
                  </div>
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<style>
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }

  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>
