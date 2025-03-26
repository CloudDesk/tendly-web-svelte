<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";
  import Modal from "../common/Modal.svelte";
  import { CircleCheck, Download, Loader2 } from "lucide-svelte";
  import { formatCurrency } from "$lib/utils/currency";
  import * as XLSX from "xlsx";
  import Table from "../common/Table.svelte";

  const dispatch = createEventDispatcher();
  export let showReviewPayroll = false;
  export let payrollData: any;
  export let year: number;
  export let month: { full: string; short: string; numeric: string };
  export let isLoading = false;
  export let disableAction;

  let isDownloaded = false;
  let showModal = writable(false);
  let showConfirmationModal = writable(false);

  const columns = [
    {
      key: "employeeName",
      label: "Name",
      sortable: true,
    },
    {
      key: "bankAccountNumber",
      label: "Bank Account No",
    },
    {
      key: "ifscCode",
      label: "IFSC Code",
    },
    {
      key: "netSalary",
      label: "Net Salary",
      sortable: true,
      render: (item: any) => formatCurrency(item.netSalary),
    },
  ];
  const processPayroll = async () => {
    dispatch("initiate");
  };

  const reviewPayroll = async () => {
    showModal.set(true);
  };

  const closeModal = () => {
    showModal.set(false);
  };

  const exportToCSV = () => {
    console.log("payrollData", payrollData);
    if (!payrollData?.exportableDetails?.length) {
      alert("No payroll data available.");
      return;
    }
    // Extract headers dynamically and convert to uppercase
    const headers = Object.keys(payrollData.exportableDetails[0]).map((key) =>
      key.toUpperCase()
    );

    // Transform data and format `NETSALARY`
    const formattedData = payrollData.exportableDetails.map((row: any) => {
      let formattedRow: Record<string, any> = {};
      Object.keys(row).forEach((key) => {
        let newKey = key.toUpperCase(); // Convert headers to uppercase
        formattedRow[newKey] =
          key === "netSalary" ? formatCurrency(row[key]) : row[key];
      });
      return formattedRow;
    });

    //  Create a worksheet and apply headers
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
    const fileName = `${month.short}-${year}-Payroll_Data.xlsx`;
    // Trigger file download
    XLSX.writeFile(workbook, fileName);

    // Simulate CSV export
    isDownloaded = true;
  };

  const initiateApproval = () => {
    showConfirmationModal.set(true);
  };

  const confirmApproval = () => {
    // Actual approval logic here
    showConfirmationModal.set(false);
    showModal.set(false);
    dispatch("approval");
  };
</script>

<div class="payroll-container">
  <div class="quick-actions">
    <button
      type="button"
      class="action-card"
      on:click={processPayroll}
      disabled={disableAction || showReviewPayroll || isLoading}
    >
      <div class="action-icon">💰</div>
      <div class="action-text">
        <h3>Process Payroll for {month.short} {year}</h3>
        <p>Calculate payroll for all employees</p>
      </div>
    </button>

    <button
      class="action-card"
      on:click={reviewPayroll}
      disabled={disableAction || !showReviewPayroll || isLoading}
    >
      <div class="action-icon">
        <CircleCheck />
      </div>
      <div class="action-text">
        <h3>Review Payroll {month.short} {year}</h3>
        <p>Approve or reject payroll</p>
      </div>
    </button>
  </div>

  {#if $showModal}
    <Modal title="Payroll Review" show={$showModal} onClose={closeModal} wide>
      <div class="payroll-summary">
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Employees</h3>
            <div class="summary-value">{payrollData.totalEmployees}</div>
          </div>
          <div class="summary-card">
            <h3>Gross Salary</h3>
            <div class="summary-value">
              {formatCurrency(payrollData.totalGrossSalary)}
            </div>
          </div>
          <div class="summary-card">
            <h3>Total Deductions</h3>
            <div class="summary-value">
              {formatCurrency(payrollData.totalDeductions)}
            </div>
          </div>
          <div class="summary-card">
            <h3>Net Salary</h3>
            <div class="summary-value">
              {formatCurrency(payrollData.totalNetSalary)}
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button
            on:click={exportToCSV}
            class="download-btn"
            disabled={isDownloaded}
          >
            <Download class="mr-2" />
            {isDownloaded ? "Downloaded" : "Export to CSV"}
          </button>
          <button
            on:click={initiateApproval}
            class="approve-btn"
            disabled={!isDownloaded}
          >
            <CircleCheck class="mr-2" />
            Approve Payroll
          </button>
        </div>

        <!-- <div class="employee-details"> -->
        <div class="table-container">
          <Table
            {columns}
            data={payrollData?.exportableDetails}
            searchable={false}
          />
        </div>
      </div>
    </Modal>
  {/if}

  {#if $showConfirmationModal}
    <Modal
      title="Confirm Payroll Approval"
      show={$showConfirmationModal}
      onClose={() => showConfirmationModal.set(false)}
    >
      <div class="confirmation-content">
        <p>
          Are you sure you want to approve the payroll for {month.full}
          {year}?
        </p>
        <div class="modal-actions">
          <button
            class="cancel-btn"
            on:click={() => showConfirmationModal.set(false)}
          >
            Cancel
          </button>
          <button class="confirm-btn" on:click={confirmApproval}>
            Confirm Approval
          </button>
        </div>
      </div>
    </Modal>
  {/if}
</div>

<style>
  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .payroll-container {
    @apply relative;
  }

  .quick-actions {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4 mb-6;
  }

  .action-card {
    @apply flex items-center p-4 bg-white rounded-lg shadow-md transition-all 
             hover:shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .action-icon {
    @apply mr-4 w-12 h-12 flex items-center justify-center bg-blue-50 rounded-lg;
  }

  .action-text h3 {
    @apply text-lg font-semibold text-gray-800;
  }

  .action-text p {
    @apply text-sm text-gray-500;
  }

  .summary-grid {
    @apply grid grid-cols-2 gap-4 mb-6;
  }

  .summary-card {
    @apply bg-white p-4 rounded-lg shadow-md;
  }

  .summary-card h3 {
    @apply text-sm text-gray-500 mb-2;
  }

  .summary-value {
    @apply text-2xl font-bold text-gray-800;
  }

  .action-buttons {
    @apply flex space-x-4 mb-4;
  }

  .download-btn,
  .approve-btn {
    @apply flex items-center px-4 py-2 rounded-lg transition-all
             disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .download-btn {
    @apply bg-green-50 text-green-600 hover:bg-green-100;
  }

  .approve-btn {
    @apply bg-blue-50 text-blue-600 hover:bg-blue-100;
  }

  .employee-details table {
    @apply w-full border-collapse;
  }

  .employee-details th,
  .employee-details td {
    @apply border border-gray-200 p-2 text-left;
  }

  .confirmation-content {
    @apply p-4 text-center;
  }

  .modal-actions {
    @apply flex justify-center space-x-4 mt-4;
  }

  .cancel-btn {
    @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200;
  }

  .confirm-btn {
    @apply px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600;
  }
</style>
