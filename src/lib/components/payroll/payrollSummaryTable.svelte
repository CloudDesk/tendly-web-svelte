<script lang="ts">
  import { createEventDispatcher } from 'svelte';

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
    action: 'Proceed' | 'Cancel' | null;
    employee: PayrollSummaryEmployee;
  }

  export let summary: any;
  export let allowedActions: string[] = [];

  const dispatch = createEventDispatcher();

  let selectedCurrentStatus: string = "Draft";
  let rowSelections = new Map<string, RowSelection>();
  let selectAllChecked = false;

  // Reactive declarations
  $: filteredEmployees = summary?.exportableDetails?.filter(
    (emp: PayrollSummaryEmployee) => emp.status === selectedCurrentStatus
  ) || [];

  $: validEmployees = filteredEmployees.filter(
    (emp: PayrollSummaryEmployee) => isActionAllowed(emp.status)
  );

  $: selectedRows = Array.from(rowSelections.values()).filter(selection => selection.action !== null);
  $: hasSelections = selectedRows.length > 0;
  $: allValidSelected = validEmployees.length > 0 && validEmployees.every(emp => rowSelections.has(emp._id));

  // Action counters
  $: proceedCount = selectedRows.filter(row => row.action === 'Proceed').length;
  $: cancelCount = selectedRows.filter(row => row.action === 'Cancel').length;

  function isActionAllowed(status: string): boolean {
    return allowedActions.includes(status);
  }

  function toggleRowSelection(employee: PayrollSummaryEmployee) {
    if (!isActionAllowed(employee.status)) return;

    rowSelections = new Map(rowSelections);
    
    if (rowSelections.has(employee._id)) {
      // If already selected, remove it
      rowSelections.delete(employee._id);
    } else {
      // Add with no action selected initially
      rowSelections.set(employee._id, {
        id: employee._id,
        action: null,
        employee: employee
      });
    }
    
    updateSelectAllState();
  }

  function setRowAction(employeeId: string, action: 'Proceed' | 'Cancel') {
    rowSelections = new Map(rowSelections);
    const selection = rowSelections.get(employeeId);
    if (selection) {
      selection.action = action;
      rowSelections.set(employeeId, selection);
    }
  }

  function toggleSelectAll() {
    rowSelections = new Map();
    
    if (!selectAllChecked) {
      // Select all valid employees
      validEmployees.forEach(employee => {
        rowSelections.set(employee._id, {
          id: employee._id,
          action: null,
          employee: employee
        });
      });
      selectAllChecked = true;
    } else {
      // Deselect all
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
    const proceedIds = selectedRows
      .filter(row => row.action === 'Proceed')
      .map(row => row.id);
    
    const cancelIds = selectedRows
      .filter(row => row.action === 'Cancel')
      .map(row => row.id);

    const payload = {
      currentStatus: selectedCurrentStatus,
      proceed: proceedIds,
      cancel: cancelIds
    };

    dispatch('bulkAction', payload);
    clearAllSelections();
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "Draft": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PendingApproval": return "bg-blue-100 text-blue-800 border-blue-200";
      case "InPayment": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled": return "bg-red-100 text-red-800 border-red-200";
      case "Failed": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  function getActionBadgeClass(action: string | null): string {
    switch (action) {
      case "Proceed": return "bg-green-100 text-green-800 border-green-200";
      case "Cancel": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  }

  // Reset selections when status changes
  $: if (selectedCurrentStatus) {
    clearAllSelections();
  }
</script>

<div class="flex flex-col h-[80vh]">
  <div class="flex-none">
    <!-- Enhanced Summary Cards -->
    <div class="mb-4">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-blue-600">Total Employees</p>
              <p class="text-2xl font-bold text-blue-900">{summary?.totalEmployees || 0}</p>
            </div>
            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-green-600">Gross Salary</p>
              <p class="text-2xl font-bold text-green-900">₹{summary?.totalGrossSalary?.toLocaleString() || 0}</p>
            </div>
            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-red-600">Deductions</p>
              <p class="text-2xl font-bold text-red-900">₹{summary?.totalDeductions?.toLocaleString() || 0}</p>
            </div>
            <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-purple-600">Net Salary</p>
              <p class="text-2xl font-bold text-purple-900">₹{summary?.totalNetSalary?.toLocaleString() || 0}</p>
            </div>
            <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698A2.305 2.305 0 007.5 8c0-.32.118-.614.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.315-.032.433.262.433.582 0 .32-.118.614-.433.582A2.305 2.305 0 0011 12.849z"/>
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Scrollable Content -->
  <div class="flex-1 overflow-y-auto min-h-0">
    {#if hasSelections}
      <!-- Action Panel - Shown when selections exist -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-4">
        <div class="flex flex-col space-y-4">
          <!-- Selection Summary -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <h3 class="text-lg font-semibold text-gray-900">Selected Actions</h3>
              <div class="flex space-x-2">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {selectedRows.length} selected
                </span>
                {#if proceedCount > 0}
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {proceedCount} to proceed
                  </span>
                {/if}
                {#if cancelCount > 0}
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {cancelCount} to cancel
                  </span>
                {/if}
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex space-x-3">
              <button
                on:click={clearAllSelections}
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
                Clear All
              </button>
              
              <button
                on:click={executeActions}
                disabled={selectedRows.every(row => row.action === null)}
                class="inline-flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                Process Actions
              </button>
            </div>
          </div>

          <!-- Selected Rows List -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="grid gap-3 max-h-64 overflow-y-auto">
              {#each selectedRows as selection (selection.id)}
                <div class="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {selection.employee.employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1">
                      <div class="text-sm font-medium text-gray-900">{selection.employee.employeeName}</div>
                      <div class="text-xs text-gray-500">ID: {selection.employee.employeeId.slice(-6)} • Net: ₹{selection.employee.netSalary.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border {getActionBadgeClass(selection.action)}">
                      {selection.action || 'No Action'}
                    </span>
                    
                    <div class="flex space-x-1">
                      <button
                        on:click={() => setRowAction(selection.id, 'Proceed')}
                        class="inline-flex items-center px-2 py-1 text-xs font-medium rounded {selection.action === 'Proceed' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-colors"
                      >
                        Proceed
                      </button>
                      <button
                        on:click={() => setRowAction(selection.id, 'Cancel')}
                        class="inline-flex items-center px-2 py-1 text-xs font-medium rounded {selection.action === 'Cancel' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'} transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Filter and Status Header - Shown when no selections -->
      <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Status Breakdown -->
          <div class="flex-1">
            <div class="flex flex-wrap gap-2">
              {#each Object.entries(summary?.statusBreakdown || {}) as [status, count]}
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border {getStatusBadgeClass(status)}">
                  {status}: {count}
                </span>
              {/each}
            </div>
          </div>

          <!-- Filter -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700">Filter by Status:</label>
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

    <!-- Enhanced Table -->
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selected Action</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#if Array.isArray(summary?.exportableDetails)}
              {#each filteredEmployees as employee (employee._id)}
                {@const isSelected = rowSelections.has(employee._id)}
                {@const selectedAction = rowSelections.get(employee._id)?.action}
                <tr class="hover:bg-gray-50 transition-colors {isSelected ? 'bg-blue-50' : ''}">
                  <td class="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isActionAllowed(employee.status)}
                      on:change={() => toggleRowSelection(employee)}
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 {!isActionAllowed(employee.status) ? 'opacity-50 cursor-not-allowed' : ''}"
                    />
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex items-center">
                      <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                        {employee.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div class="text-sm font-medium text-gray-900">{employee.employeeName}</div>
                        <div class="text-xs text-gray-500">ID: {employee.employeeId.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">
                      <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {employee.presentDays}P
                        </span>
                        {#if employee.lopDays > 0}
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {employee.lopDays}L
                          </span>
                        {/if}
                      </div>
                      <div class="text-xs text-gray-500 mt-1">{employee.payableDays}/{employee.totalDaysInMonth} days</div>
                    </div>
                  </td>
                  <td class="px-4 py-4 text-sm font-medium text-gray-900">
                    ₹{employee.monthlyGross.toLocaleString()}
                  </td>
                  <td class="px-4 py-4 text-sm font-semibold text-green-600">
                    ₹{employee.netSalary.toLocaleString()}
                  </td>
                  <td class="px-4 py-4">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border {getStatusBadgeClass(employee.status)}">
                      {employee.status}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    {#if isSelected}
                      <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border {getActionBadgeClass(selectedAction)}">
                          {selectedAction || 'No Action'}
                        </span>
                        <div class="flex space-x-1">
                          <button
                            on:click={() => setRowAction(employee._id, 'Proceed')}
                            class="inline-flex items-center px-2 py-1 text-xs font-medium rounded {selectedAction === 'Proceed' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-colors"
                          >
                            P
                          </button>
                          <button
                            on:click={() => setRowAction(employee._id, 'Cancel')}
                            class="inline-flex items-center px-2 py-1 text-xs font-medium rounded {selectedAction === 'Cancel' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'} transition-colors"
                          >
                            C
                          </button>
                        </div>
                      </div>
                    {:else if isActionAllowed(employee.status)}
                      <span class="text-xs text-gray-400">Select to choose action</span>
                    {:else}
                      <span class="text-xs text-gray-400">No actions available</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            {:else}
              <tr>
                <td class="px-4 py-8 text-center text-gray-500" colspan="7">
                  <div class="flex flex-col items-center">
                    <svg class="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p class="text-sm font-medium">No records found</p>
                    <p class="text-xs">Data is not yet loaded or no employees match the current filter.</p>
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