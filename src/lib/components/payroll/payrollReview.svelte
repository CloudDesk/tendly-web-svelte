<script lang="ts">
  import { onMount } from "svelte";
  import { payrollApi } from "$lib/services/api";
  import PayrollSummaryTable from "./payrollSummaryTable.svelte";
  import LoaderNew from "../common/LoaderNew.svelte";
  import { toast } from "../common/stores/toast.store";
  import { AlertCircle, CheckCircle, Download, Import } from "lucide-svelte";
  import Button from "../common/Button.svelte";
  import { formatCurrency } from "$lib/utils/currency";
  import * as XLSX from "xlsx";
  import type { DialogConfig } from "$lib/types";
  import ConfirmDialog from "../common/ConfirmDialog.svelte";
    import Modal from "../common/Modal.svelte";

    interface ValidatedRow {
        payrollId: string;
        employeeName?: string;
        status: string;
        utrNumber?: string;
    failureReason?: string;
    errors?: string[];
}

  let statusFilters = "PendingApproval"; // default on mount

  let month = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 0).padStart(2, "0");
    return `${y}-${m}`;
  })();



  let summary: any = null;
  let isLoadingSummary = false;
  let isSubmitting = false;
  let isDownloaded = false;
  let isImported = false;
  let selectedFile: File | null = null;
  let validatedRows: any[] = [];
  let showValidationResults = false;
  let isConfirming = false;


  let showConfirmationDialog = false;
  let confirmationDialogConfig: DialogConfig = {
    title: "Payroll Processing Confirmation",
    message: "Are you sure you want to proceed with payroll processing?",
    confirmText: "Proceed",
    cancelText: "Cancel",
  };
  
  // Add state for bulk action details
  let bulkActionDetails: {
    currentStatus: string;
    processIds: string[];
    cancelIds: string[];
  } | null = null;

  function closeConfirmationDialog() {
    showConfirmationDialog = false;
    isDownloaded = false;
    bulkActionDetails = null;
  }
  
  async function fetchPayrollSummary() {
    try {
      isLoadingSummary = true;
      const [year, monthNum] = month.split("-");
      console.log(month);
      const response = (await payrollApi.payrollSummary(
        parseInt(monthNum),
        parseInt(year),
        statusFilters
      )) as { data: any }; // Add a type assertion here
      summary = response.data;
    } catch (err) {
      console.error("Failed to load payroll summary", err);
      summary = null;
    } finally {
      isLoadingSummary = false;
    }
  }

  async function toggleStatus(status: string) {
    statusFilters = status
 await fetchPayrollSummary(); 
}

  function handleFilterChange() {
    fetchPayrollSummary();
  }

  async function handleBulkAction(event: CustomEvent) {
    const { currentStatus, processIds, cancelIds } = event.detail;
    
    if (!isDownloaded) {
      toast.warning("Please download the payroll data before proceeding with the action");
      return;
    }

    // Store the bulk action details
    bulkActionDetails = { currentStatus, processIds, cancelIds };
    showConfirmationDialog = true;
  }

  async function handleConfirm(event: CustomEvent) {
    if (!bulkActionDetails) {
      toast.error("No action details found");
      return;
    }

    try {
      const { processIds, cancelIds } = bulkActionDetails;
      const results = [];

      // Handle "Proceed" actions (move to next status)
      if (processIds?.length > 0) {
        const nextStatus = "InPayment";
        const proceedPayload = {
          recordIds: processIds,
          status: nextStatus,
        };

        const proceedResult: any = await payrollApi.updateStatus(proceedPayload);
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
            toast.success(`${updatedCount} records updated to ${status}`);
          }
          if (failedRecords?.length > 0) {
            failedRecords.forEach(
              ({ id, reason }: { id: string; reason: string }) => {
                toast.error(`Record ${id} failed: ${reason}`);
              }
            );
          }
        } else {
          toast.error(
            `Failed to update status ${status}: ${data?.error?.message || "Unknown error"}`
          );
        }
      });

      // Reset bulk action details after processing
      bulkActionDetails = null;
    } catch (error: any) {
      console.error("error in bulk action", error);
      toast.error(`Bulk action failed: ${error.message}`);
    } finally {
      closeConfirmationDialog();
    }
  }

  function handleExportExcel() {
    console.log("Exporting Excel",summary);
    if (!summary?.exportableDetails?.length) {
      alert("No payroll data available.");
      return;
    }

    // Extract headers dynamically and convert to uppercase
    const headers = Object.keys(summary.exportableDetails[0]).map((key) =>
      key.toUpperCase()
    );

    // Transform data and format `NETSALARY`
    const formattedData = summary.exportableDetails.map((row: any) => {
      let formattedRow: Record<string, any> = {};
      Object.keys(row).forEach((key) => {
        let newKey = key.toUpperCase(); // Convert headers to uppercase
        formattedRow[newKey] =
          key === "netSalary" ? formatCurrency(row[key]) : row[key];
      });
      return formattedRow;
    });

    // Create a worksheet and apply headers
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: headers,
    });

    // Auto-adjust column widths based on data length
    const columnWidths = headers.map((header) => ({
      wch:
        Math.max(
          header.length,
          ...formattedData.map((row: any) => String(row[header] || "").length)
        ) + 2,
    }));
    worksheet["!cols"] = columnWidths;

    // Create workbook and append sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PAYROLL DATA");
    const [year, monthNum] = month.split("-");
    const fileName = `${monthNum}-${year}-Payroll_Data.xlsx`;
    // Trigger file download
    XLSX.writeFile(workbook, fileName);

    // Set download state
    isDownloaded = true;
  
  }

  function handleImportExcel() {
    console.log("Opening import modal");
    isImported = true;
    // Reset state
    validatedRows = [];
    showValidationResults = false;
    selectedFile = null;
  }

  const handleFileUpload = async (event:any) => {
    const input = event.target;
    if (!input.files || !input.files.length) return;
    
    selectedFile = input.files[0];
    isSubmitting = true;
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const result = await payrollApi.importPayments(formData);
      console.log(result, "result in handleFileUpload");
      
      validatedRows = result.data;
      showValidationResults = true;
      
    } catch (error) {
      console.error(error, "error in handleFileUpload");
      // Show error notification
      alert(`Error: ${error.message || 'Failed to process file'}`);
    } finally {
      isSubmitting = false;
    }
  }

  const handleConfirmImport = async () => {
    // Filter only rows without errors
    const validRows = validatedRows.filter(row => row.errors.length === 0);
    
    if (validRows.length === 0) {
      alert('No valid rows to import. Please fix all errors first.');
      return;
    }
    
    isConfirming = true;
    
    try {
      // Call the existing status update API
      const result = await payrollApi.confirmPaymentUpdates(validRows);
      console.log('Payment updates confirmed:', result);
      
      // Close modal and refresh data
      isImported = false;
      showValidationResults = false;
      validatedRows = [];
      
      // Dispatch event to parent to refresh data
      // dispatch('importComplete', { updatedRows: validRows.length });
      
      alert(`Successfully updated ${validRows.length} payroll records.`);
      
    } catch (error:any) {
      console.error('Error confirming updates:', error);
      alert(`Error: ${error.message || 'Failed to update payroll records'}`);
    } finally {
      isConfirming = false;
    }
  }
  
  const closeModal = () => {
    isImported = false;
    showValidationResults = false;
    validatedRows = [];
    selectedFile = null;
  }
  
  const hasErrors = validatedRows.some(row => row.errors.length > 0);
  const validRowsCount = validatedRows.filter(row => row.errors.length === 0).length;


  onMount(fetchPayrollSummary);
</script>


<div class="p-4 md:p-6 bg-gray-50 min-h-screen">
  <!-- Header -->
  <div class="filter-header">
    <h1 class="text-xl md:text-2xl font-bold text-gray-900">
      Payroll Review –
      {new Date(month + "-01").toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}
    </h1>

      <!-- Status Toggle -->
      <div class="status-toggle">
        <button
          class="toggle-button"
          class:active={statusFilters === "PendingApproval"}
          on:click={() => toggleStatus("PendingApproval")}
        >
          Pending Approval
        </button>
        <button
          class="toggle-button"
          class:active={statusFilters === "InPayment"}
          on:click={() => toggleStatus("InPayment")}
        >
          In Payment
        </button>
      </div>
  </div>

  <!-- Filter Section -->
  <div class="filter-container">
    <div class="filter-controls">
      <!-- Month Filter -->
      <div class="month-filter">
        <label>Month:</label>
        <input
          type="month"
          bind:value={month}
          on:change={handleFilterChange}
        />
      </div>

    

      <!-- Action Buttons -->
      <div class="action-buttons">
        <Button disabled={!summary} on:click={handleImportExcel}>
          <Download class="w-4 h-4 mr-2" />
          Export Excel
        </Button>
      </div>

      <div class="action-buttons">
        <Button disabled={!summary} on:click={handleImportExcel}>
          <Import class="w-4 h-4 mr-2" />
          Improt Excel
        </Button>
      </div>

    </div>
  </div>

  <!-- Summary Section -->
  {#if isLoadingSummary}
    <LoaderNew />
  {:else if summary}
    <PayrollSummaryTable
      {summary}
      allowedActions={["PendingApproval", "InPayment"]}
      tableColumns={[
        { key: "employee", label: "Employee", type: "employee" },
        { key: "bankAccountNumber", label: "Bank Account", type: "bank" },
        { key: "netSalary", label: "Net Salary", type: "currency" },
        { key: "status", label: "Status", type: "status" },
      ]}
      
      columnActions={statusFilters==='PendingApproval'?[
        { key: "Proceed", label: "Approve", color: "green" },
        { key: "Cancel", label: "Reject", color: "red" },
      ]:[]}
      showCheckboxes={statusFilters==='PendingApproval'}
      on:bulkAction={handleBulkAction}
    />
    {:else}
    <div class="text-center text-gray-500">No data found</div>
  {/if}
</div>

{#if showConfirmationDialog}
  <ConfirmDialog
    show={showConfirmationDialog}
    config={confirmationDialogConfig}
    on:confirm={handleConfirm}
    on:cancel={closeConfirmationDialog}
  />
{/if}

{#if isImported}
  <Modal
  show={isImported}
  title="Upload Payment confirmation Data"
  onClose={closeModal}
  wide={true}
  >
  <div class="p-6">
    {#if !showValidationResults}
      <!-- File Upload Section -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Select Excel File (.xlsx, .xls)
          </label>
          <input 
            type="file" 
            accept=".xlsx,.xls"
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            on:change={handleFileUpload}
            disabled={isSubmitting}
          />
        </div>
        
        {#if isSubmitting}
          <div class="flex items-center justify-center p-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600">Processing file...</span>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Validation Results Section -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Validation Results</h3>
          <div class="text-sm text-gray-600">
            {validRowsCount} valid / {validatedRows.length} total rows
          </div>
        </div>
        
        {#if hasErrors}
          <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div class="flex items-center">
              <AlertCircle class="h-5 w-5 text-yellow-600 mr-2" />
              <span class="text-yellow-800">
                Some rows have validation errors. Please review and re-upload the corrected file.
              </span>
            </div>
          </div>
        {:else}
          <div class="bg-green-50 border border-green-200 rounded-md p-4">
            <div class="flex items-center">
              <CheckCircle class="h-5 w-5 text-green-600 mr-2" />
              <span class="text-green-800">
                All rows are valid and ready for import.
              </span>
            </div>
          </div>
        {/if}
        
        <!-- Results Table -->
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <div class="overflow-x-auto max-h-96">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payroll ID</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UTR/Reason</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each validatedRows as row, index}
                  <tr class={row.errors.length > 0 ? 'bg-red-50' : 'bg-white'}>
                    <td class="px-4 py-3">
                      {#if row.errors.length > 0}
                        <AlertCircle class="h-5 w-5 text-red-500" />
                      {:else}
                        <CheckCircle class="h-5 w-5 text-green-500" />
                      {/if}
                    </td>
                    <td class="px-4 py-3 text-sm font-mono">{row.payrollId}</td>
                    <td class="px-4 py-3 text-sm">{row.employeeName || '-'}</td>
                    <td class="px-4 py-3">
                      <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        row.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        row.status === 'Failed' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm">
                      {row.utrNumber || row.failureReason || '-'}
                    </td>
                    <td class="px-4 py-3">
                      {#if row.errors.length > 0}
                        <div class="space-y-1">
                          {#each row.errors as error}
                            <div class="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                              {error}
                            </div>
                          {/each}
                        </div>
                      {:else}
                        <span class="text-xs text-green-600">Valid</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-between items-center pt-4 border-t">
          <Button 
            variant="outline" 
            on:click={() => showValidationResults = false}
          >
            Upload Different File
          </Button>
          
          <div class="space-x-3">
            <Button variant="outline" on:click={closeModal}>
              Cancel
            </Button>
            
            {#if !hasErrors}
              <Button 
                on:click={handleConfirmImport}
                disabled={isConfirming}
                class="bg-green-600 hover:bg-green-700"
              >
                {#if isConfirming}
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {/if}
                Confirm Import ({validRowsCount} rows)
              </Button>
            {:else}
              <Button disabled class="bg-gray-400">
                Fix Errors First
              </Button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
  </Modal>
{/if}



<style>
  .filter-container {
    @apply bg-white shadow rounded-md mb-4 md:mb-6 p-4;
  }

  .filter-header {
    @apply flex flex-col  md:flex-row md:items-center md:justify-between gap-4 mb-4;
  }

  .filter-controls {
    @apply flex flex-col justify-between md:flex-row items-start md:items-center gap-4;
  }

  .month-filter {
    @apply flex items-center gap-2 min-w-[200px];
  }

  .month-filter input {
    @apply px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  }

  .month-filter label {
    @apply text-sm font-medium text-gray-600 whitespace-nowrap;
  }

  .status-toggle {
    @apply flex gap-2 p-1 bg-gray-100 rounded-lg;
  }

  .toggle-button {
    @apply px-4 py-2 text-sm font-medium rounded-md transition-all duration-200;
  }

  .toggle-button:not(.active) {
    @apply text-gray-600 hover:text-gray-900 hover:bg-gray-200;
  }

  .toggle-button.active {
    @apply bg-white text-blue-600 shadow-sm;
  }

  .action-buttons {
    @apply flex items-center gap-3;
  }
</style>
