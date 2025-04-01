<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";
  import Modal from "../common/Modal.svelte";
  import { CircleCheck, Download, Loader2 } from "lucide-svelte";
  import { formatCurrency } from "$lib/utils/currency";
  import * as XLSX from "xlsx";
  import Table from "../common/Table.svelte";

  const dispatch = createEventDispatcher();

  export let year: number;
  export let month: { full: string; short: string; numeric: string };
  export let payrollData: any;
  export let isLoading = false;
  export let canInitiate;
  export let canApprove;

  let isDownloaded = false;
  let showModal = writable(false);
  let showConfirmationModal = writable(false);
  console.log(payrollData, "payrollData");
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
      disabled={!canInitiate || isLoading || canApprove}
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
      disabled={!canApprove || isLoading}
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
  .payroll-container {
    @apply relative;
  }

  .quick-actions {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6 mb-8;
  }

  .action-card {
    @apply flex items-center p-5 bg-white rounded-xl shadow-md hover:shadow-xl 
           transform hover:-translate-y-1 transition-all duration-300 
           disabled:opacity-50 disabled:cursor-not-allowed 
           disabled:hover:shadow-md disabled:hover:translate-y-0;
  }

  .action-icon {
    @apply mr-5 w-14 h-14 flex items-center justify-center 
           bg-gradient-to-br from-blue-100 to-blue-200 
           rounded-xl text-3xl;
  }

  .action-text h3 {
    @apply text-xl font-bold text-gray-800 mb-1;
  }

  .action-text p {
    @apply text-sm text-gray-600;
  }

  .summary-grid {
    @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8;
  }

  .summary-card {
    @apply bg-white p-5 rounded-xl shadow-md 
           hover:shadow-lg transition-shadow 
           border-l-4 border-blue-500;
  }

  .summary-card h3 {
    @apply text-sm text-gray-500 mb-2 uppercase tracking-wider;
  }

  .summary-value {
    @apply text-3xl font-extrabold text-gray-800;
  }

  .action-buttons {
    @apply flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6;
  }

  .download-btn,
  .approve-btn {
    @apply flex items-center justify-center px-6 py-3 rounded-lg 
           transition-all duration-300 space-x-2 
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .download-btn {
    @apply bg-green-100 text-green-700 hover:bg-green-200;
  }

  .approve-btn {
    @apply bg-blue-100 text-blue-700 hover:bg-blue-200;
  }

  .confirmation-content {
    @apply p-6 text-center;
  }

  .modal-actions {
    @apply flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-6;
  }

  .cancel-btn {
    @apply px-6 py-3 bg-gray-200 text-gray-700 rounded-lg 
           hover:bg-gray-300 transition-colors;
  }

  .confirm-btn {
    @apply px-6 py-3 bg-blue-600 text-white rounded-lg 
           hover:bg-blue-700 transition-colors;
  }

  .table-container {
    @apply bg-white rounded-xl shadow-md overflow-hidden;
  }
</style>
