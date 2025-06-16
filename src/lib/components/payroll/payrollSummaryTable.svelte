<script lang="ts">
  import {Check,ClipboardList,HandCoins,Scissors,Users, Wallet, X,} from "lucide-svelte";
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
    action: string | null;
    employee: PayrollSummaryEmployee;
  }

  interface TableColumn {
    key: string;
    label: string;
    type?:
      | "text"
      | "number"
      | "currency"
      | "status"
      | "attendance"
      | "employee"
      | "date"
      | "boolean"
      | "bank";
    sortable?: boolean;
    width?: string;
  }

  interface ColumnAction {
    key: string;
    label: string;
    color: "green" | "red" | "blue" | "yellow" | "purple";
    variant?: "solid" | "outline";
  }
  export let filterValue :any;
  export let summary: any;
  export let allowedActions: string[] = [];
  export let tableColumns: TableColumn[] = [
    { key: "employee", label: "Employee", type: "employee" },
    { key: "attendance", label: "Attendance", type: "attendance" },
    { key: "monthlyGross", label: "Gross Salary", type: "currency" },
    { key: "netSalary", label: "Net Salary", type: "currency" },
    { key: "status", label: "Status", type: "status" },
  ];
  export let columnActions: ColumnAction[] = [
    { key: "Proceed", label: "Proceed", color: "green" },
    { key: "Cancel", label: "Cancel", color: "red" },
  ];
  export let showFilters: boolean = true;
  export let showSummaryCards: boolean = true;
export let showCheckboxes: boolean = true;
  console.log(summary, "summary table");
  const dispatch = createEventDispatcher();

  let selectedCurrentStatus: string = filterValue ? filterValue : allowedActions[1] || "Draft";
  console.log(filterValue,"filterValue");
  console.log(selectedCurrentStatus,"selectedCurrentStatus")
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

  // Action counters - dynamically calculate based on columnActions
  $: actionCounts = columnActions.reduce(
    (acc, action) => {
      acc[action.key] = selectedRows.filter(
        (row) => row.action === action.key
      ).length;
      return acc;
    },
    {} as Record<string, number>
  );

  function isActionAllowed(status: string): boolean {
    return allowedActions.includes(status);
  }

  function toggleRowSelection(
    employee: PayrollSummaryEmployee,
    action: string | null = null
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

  function setRowAction(employeeId: string, action: string) {
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

  function setGlobalAction(action: string) {
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
    const actionGroups = columnActions.reduce(
      (acc, action) => {
        acc[action.key] = selectedRows
          .filter((row) => row.action === action.key)
          .map((row) => row.id);
        return acc;
      },
      {} as Record<string, string[]>
    );
    console.log(actionGroups, "actionGroups");
    const payload = {
      currentStatus: selectedCurrentStatus,
      ...actionGroups,
      // Legacy support
      processIds: actionGroups["Proceed"] || [],
      cancelIds: actionGroups["Cancel"] || [],
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

  function getActionButtonClass(
    action: ColumnAction,
    isSelected: boolean
  ): string {
    const baseClass =
      "inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors";

    if (isSelected) {
      switch (action.color) {
        case "green":
          return `${baseClass} bg-green-600 text-white`;
        case "red":
          return `${baseClass} bg-red-600 text-white`;
        case "blue":
          return `${baseClass} bg-blue-600 text-white`;
        case "yellow":
          return `${baseClass} bg-yellow-600 text-white`;
        case "purple":
          return `${baseClass} bg-purple-600 text-white`;
        default:
          return `${baseClass} bg-gray-600 text-white`;
      }
    } else {
      switch (action.color) {
        case "green":
          return `${baseClass} bg-green-100 text-green-700 hover:bg-green-200`;
        case "red":
          return `${baseClass} bg-red-100 text-red-700 hover:bg-red-200`;
        case "blue":
          return `${baseClass} bg-blue-100 text-blue-700 hover:bg-blue-200`;
        case "yellow":
          return `${baseClass} bg-yellow-100 text-yellow-700 hover:bg-yellow-200`;
        case "purple":
          return `${baseClass} bg-purple-100 text-purple-700 hover:bg-purple-200`;
        default:
          return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`;
      }
    }
  }

  function getGlobalActionButtonClass(action: ColumnAction): string {
    const baseClass =
      "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:ring-2 transition-colors";

    switch (action.color) {
      case "green":
        return `${baseClass} bg-green-100 text-green-700 hover:bg-green-300 focus:ring-green-500`;
      case "red":
        return `${baseClass} bg-red-100 text-red-700 hover:bg-red-300 focus:ring-red-500`;
      case "blue":
        return `${baseClass} bg-blue-100 text-blue-700 hover:bg-blue-300 focus:ring-blue-500`;
      case "yellow":
        return `${baseClass} bg-yellow-100 text-yellow-700 hover:bg-yellow-300 focus:ring-yellow-500`;
      case "purple":
        return `${baseClass} bg-purple-100 text-purple-700 hover:bg-purple-300 focus:ring-purple-500`;
      default:
        return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-300 focus:ring-gray-500`;
    }
  }

  function getActionCountBadgeClass(action: ColumnAction): string {
    switch (action.color) {
      case "green":
        return "bg-green-100 text-green-800";
      case "red":
        return "bg-red-100 text-red-800";
      case "blue":
        return "bg-blue-100 text-blue-800";
      case "yellow":
        return "bg-yellow-100 text-yellow-800";
      case "purple":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function maskBankAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber === "N/A") return "N/A";
    const last4 = accountNumber.slice(-4);
    return "*******" + last4;
  }
  function renderCellContent(
    employee: PayrollSummaryEmployee,
    column: TableColumn
  ): string {
    switch (column.type) {
      case "currency":
        return `₹${employee[column.key as keyof PayrollSummaryEmployee]?.toLocaleString() || 0}`;
      case "number":
        return (
          employee[column.key as keyof PayrollSummaryEmployee]?.toString() ||
          "0"
        );
      case "bank":
        return maskBankAccountNumber(
          employee[column.key as keyof PayrollSummaryEmployee] as string
        );
      case "text":
      default:
        return (
          employee[column.key as keyof PayrollSummaryEmployee]?.toString() || ""
        );
    }
  }
</script>

<div class="flex flex-col h-[80vh]">
  <div class="flex-none">
    {#if showSummaryCards}
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
    {/if}
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
                {#each columnActions as action}
                  {#if actionCounts[action.key] > 0}
                    <span
                      class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getActionCountBadgeClass(
                        action
                      )}"
                    >
                      {actionCounts[action.key]} to {action.label.toLowerCase()}
                    </span>
                  {/if}
                {/each}
              </div>
            </div>

            <div class="flex space-x-3">
              {#if allValidSelected}
                {#each columnActions as action}
                  <button
                    on:click={() => setGlobalAction(action.key)}
                    class={getGlobalActionButtonClass(action)}
                  >
                    {#if action.key === "Proceed"}
                      <Check class="w-4 h-4 mr-2" />
                    {:else if action.key === "Cancel"}
                      <X class="w-4 h-4 mr-2" />
                    {/if}
                    {action.label} All
                  </button>
                {/each}
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
{:else if true}
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
          {#if showFilters}
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700"
                > Status:</label
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
          {/if}
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
              {#if showCheckboxes}
                <th class="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAllChecked}
                    on:change={toggleSelectAll}
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              {/if}
              {#each tableColumns as column}
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={column.width ? `width: ${column.width}` : ""}
                >
                  {column.label}
                </th>
              {/each}
              {#if columnActions.length > 0}
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              {/if}
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#if Array.isArray(summary?.exportableDetails)}
              {#each filteredEmployees as employee (employee._id)}
                {@const isSelected = rowSelections.has(employee._id)}
                {@const selectedAction = rowSelections.get(employee._id)?.action}
                <tr
                  class="hover:bg-gray-50 transition-colors {isSelected ? 'bg-blue-50' : ''}"
                >
                  {#if showCheckboxes}
                    <td class="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isActionAllowed(employee.status)}
                        on:change={() => toggleRowSelection(employee)}
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 {!isActionAllowed(employee.status) ? 'opacity-50 cursor-not-allowed' : ''}"
                      />
                    </td>
                  {/if}
                  {#each tableColumns as column}
                    <td class="px-4 py-4">
                      {#if column.type === "employee"}
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
                          </div>
                        </div>
                      {:else if column.type === "attendance"}
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
                      {:else if column.type === "status"}
                        <span
                          class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border {getStatusBadgeClass(
                            employee.status
                          )}"
                        >
                          {employee.status}
                        </span>
                      {:else if column.type === "currency"}
                        <span
                          class="text-sm font-{column.key === 'netSalary'
                            ? 'semibold text-green-600'
                            : 'medium text-gray-900'}"
                        >
                          {renderCellContent(employee, column)}
                        </span>
                      {:else if column.type === "bank"}
                        <span class="text-sm text-gray-900">
                          {renderCellContent(employee, column)}
                        </span>
                      {:else}
                        <span class="text-sm text-gray-900">
                          {renderCellContent(employee, column)}
                        </span>
                      {/if}
                    </td>
                  {/each}
                  {#if columnActions.length > 0}
                    <td class="px-4 py-4">
                      {#if isActionAllowed(employee.status)}
                        <div class="flex space-x-1">
                          {#each columnActions as action}
                            <button
                              on:click={() =>
                                setRowAction(employee._id, action.key)}
                              disabled={allValidSelected}
                              class="{getActionButtonClass(
                                action,
                                selectedAction === action.key
                              )} {allValidSelected
                                ? 'opacity-50 cursor-not-allowed'
                                : ''}"
                            >
                              {action.label}
                            </button>
                          {/each}
                        </div>
                      {:else}
                        <span class="text-xs text-gray-400"
                          >No actions available</span
                        >
                      {/if}
                    </td>
                  {/if}
                </tr>
              {/each}
            {:else}
              <tr>
                <td
                  class="px-4 py-8 text-center text-gray-500"
                  colspan={tableColumns.length + (columnActions.length > 0 ? 1 : 0) + (showCheckboxes ? 1 : 0)}
                >
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
