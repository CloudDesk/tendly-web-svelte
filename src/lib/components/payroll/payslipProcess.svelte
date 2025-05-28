<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { writable } from "svelte/store";
  import Modal from "../common/Modal.svelte";
  import LoaderNew from "../common/LoaderNew.svelte";
  import { FileText, Send, Users, UserCheck } from "lucide-svelte";
  import Table from "../common/Table.svelte";

  const dispatch = createEventDispatcher();

  export let year: number;
  export let month: { full: string; short: string; numeric: string };
  export let isPayslipGenerated: boolean;
  export let payslips: {
    employeeId: string;
    employeeName: string;
    payslipId: string;
    payslipUrl: string;
    status: string;
    emailSent: boolean;
    lastEmailSentAt: string;
  }[] = [];

  // State management
  let isGenerating = writable(false);
  let isSending = writable(false);
  // let isPayslipGenerated = writable(false);
  let showSendOptionsModal = writable(false);
  let selectedEmployees = writable<string[]>([]);
  console.log(isGenerating, "isGenerating");
  console.log(isPayslipGenerated, "isPayslipGenerated");
  // Format the payslip URL for display
  const formatPayslipUrl = (url: string) => {
    const parts = url.split("/");
    return parts[parts.length - 1]; // Extract the file name
  };

  const columns = [
    {
      key: "employeeName",
      label: "Employee Name",
      sortable: false,
      render: (payslips: any) => payslips.employeeName || "",
    },
    {
      key: "month",
      label: "Month Year",
      sortable: false,
      render: (payslips: any) =>
        `${payslips.month.short} - ${payslips.year}` || "",
    },
    {
      key: "payslipUrl",
      label: "Payslip",
      sortable: false,
      render: (payslips: any) => `
    <a target="_blank" href=${payslips.payslipUrl} class="text-blue-500 hover:underline">
      ${formatPayslipUrl(payslips.payslipUrl)}
    </a>
  `,
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (payslips: any) => {
        const statusClasses = {
          Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
          Completed: "bg-green-100 text-green-800 border-green-300",
          Failed: "bg-red-100 text-red-800 border-red-300",
        };

        return `
      <span class="px-4 py-3 text-xs font-semibold border rounded-full ${statusClasses[payslips.status as keyof typeof statusClasses] || "bg-gray-100 text-gray-800 border-gray-300"}">
        ${payslips.status}
      </span>
    `;
      },
    },
    {
      key: "emailSent",
      label: "Email Sent",
      sortable: false,
      render: (payslips: any) => {
        const emailStatus = payslips.emailSent ? "Sent" : "Not Sent";
        const emailClasses = payslips.emailSent
          ? "bg-green-100 text-green-800 border-green-300"
          : "bg-gray-100 text-gray-800 border-gray-300";

        return `
        <span class="px-3 py-1 text-xs font-semibold border rounded-full ${emailClasses}">
          ${emailStatus}
        </span>
      `;
      },
    },
    {
      key: "sentDate",
      label: "Sent Date",
      sortable: false,
      render: (payslips: any) =>
        payslips.sentDate
          ? new Date(payslips.sentDate).toLocaleDateString()
          : "—",
    },
  ];
  let newData = payslips.map((i) => ({ ...i, year: year, month: month }));
  console.log(month, year);
  console.log(newData, "newData");
  // Simulated employee list (in real app, this would come from an API)
  $: employeeList = payslips.map((i) => ({
    id: i.employeeId,
    name: i.employeeName,
  }));
  console.log(employeeList);
  console.log(payslips, "payslips");
  console.log(employeeList, "*****");
  // Generate Payslips
  const generatePayslips = async () => {
    isGenerating.set(true);
    try {
      dispatch("payslip-generated");
    } catch (error) {
      console.error("Payslip generation failed", error);
    } finally {
      isGenerating.set(false);
    }
  };

  // Send Payslips
  const openSendOptionsModal = () => {
    showSendOptionsModal.set(true);
  };

  const sendToAllEmployees = async () => {
    isSending.set(true);
    const payload = {
      month,
      year,
      recipients: payslips.map((p) => p.employeeId),
    };
    try {
      dispatch("payslip-sent", payload);
      showSendOptionsModal.set(false);
    } catch (error) {
      console.error("Sending payslips failed", error);
    } finally {
      isSending.set(false);
    }
  };

  const sendToSelectedEmployees = async () => {
    console.log("selectedEmployees", selectedEmployees);
    if ($selectedEmployees.length === 0) {
      alert("Please select employees to send payslips");
      return;
    }
    isSending.set(true);
    const payload = {
      month,
      year,
      recipients: $selectedEmployees,
    };

    try {
      dispatch("payslip-sent", payload);
      selectedEmployees.set([]);
      showSendOptionsModal.set(false);
    } catch (error) {
      console.error("Sending selected payslips failed", error);
    } finally {
      isSending.set(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    selectedEmployees.update((selected) =>
      selected.includes(employeeId)
        ? selected.filter((id) => id !== employeeId)
        : [...selected, employeeId]
    );
  };
</script>

<div class="payslip-container">
  <div class="payslip-actions">
    <button
      class="action-card generate-card"
      on:click={generatePayslips}
      disabled={$isGenerating || !isPayslipGenerated}
    >
      {#if $isGenerating}
        <LoaderNew />
      {:else}
        <div class="action-icon">
          <FileText />
        </div>
      {/if}

      <div class="action-text">
        <h3>Generate Payslips</h3>
        <p>For {month.full} {year}</p>
      </div>
    </button>

    <button
      class="action-card send-card"
      on:click={openSendOptionsModal}
      disabled={!isPayslipGenerated || $isSending}
    >
      <div class="action-icon">
        <Send />
      </div>

      <div class="action-text">
        <h3>Send Payslips</h3>
        <p>Distribute to employees</p>
      </div>
    </button>
  </div>
  {#if payslips.length > 0}
    <Table {columns} data={newData} searchable={false} />
  {:else}
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p class="text-yellow-700">
        No payslips available for {month.full}
        {year}.
      </p>
    </div>
  {/if}
  {#if $showSendOptionsModal}
    <Modal
      title="Send Payslips"
      show={$showSendOptionsModal}
      onClose={() => showSendOptionsModal.set(false)}
    >
      <div class="send-options">
        <button
          class="send-option"
          on:click={sendToAllEmployees}
          disabled={$isSending}
        >
          <Users class="mr-2" />
          Send to All Employees
        </button>

        <div class="divider">
          <span>OR</span>
        </div>

        <div class="selected-employees">
          <h4>Select Employees to Send</h4>
          <div class="employee-list">
            {#each employeeList as employee}
              <label class="employee-item">
                <input
                  type="checkbox"
                  checked={$selectedEmployees.includes(employee.id)}
                  on:change={() => toggleEmployeeSelection(employee.id)}
                />
                <span>{employee.name}</span>
              </label>
            {/each}
          </div>

          <button
            class="send-selected-btn"
            on:click={sendToSelectedEmployees}
            disabled={$isSending || $selectedEmployees.length === 0}
          >
            {#if $isSending}
              <LoaderNew />
            {:else}
              <UserCheck class="mr-2" />
              Send to Selected
            {/if}
          </button>
        </div>
      </div>
    </Modal>
  {/if}
</div>

<!--   /* .search-filter-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  @media (min-width: 768px) {
    .search-filter-section {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .search-box {
    display: flex;
    align-items: center;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 16px;
    width: 100%;
    max-width: 320px;
  }

  .search-box svg {
    color: #718096;
    margin-right: 10px;
  }

  .search-box input {
    border: none;
    outline: none;
    background: transparent;
    width: 100%;
    font-size: 14px;
    color: #4a5568;
  }

  .filters {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .filter {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter label {
    font-size: 12px;
    color: #718096;
    font-weight: 500;
  }

  .filter select {
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: white;
    font-size: 14px;
    color: #4a5568;
    outline: none;
    cursor: pointer;
    min-width: 100px;
  }
    
   /* Dropdown styles */
  .dropdown-parent {
    position: relative;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    z-index: 10;
    display: none;
    overflow: hidden;
  }

  .dropdown-parent:hover .dropdown-menu {
    display: block;
  }

  .dropdown-item {
    padding: 12px 16px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .dropdown-item:hover {
    background: #f7fafc;
  }*/
 -->

<style lang="postcss">
  .payslip-container {
    @apply relative;
  }

  .payslip-actions {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
  }

  .action-card {
    @apply flex items-center p-5 bg-white rounded-xl shadow-md 
             hover:shadow-xl transform hover:-translate-y-1 
             transition-all duration-300 
             disabled:opacity-50 disabled:cursor-not-allowed 
             disabled:hover:shadow-md disabled:hover:translate-y-0;
  }

  .action-icon {
    @apply mr-5 w-14 h-14 flex items-center justify-center 
             bg-gradient-to-br from-blue-100 to-blue-200 
             rounded-xl text-3xl;
  }

  .generate-card .action-icon {
    @apply bg-gradient-to-br from-green-100 to-green-200;
  }

  .send-card .action-icon {
    @apply bg-gradient-to-br from-purple-100 to-purple-200;
  }

  .action-text h3 {
    @apply text-xl font-bold text-gray-800 mb-1;
  }

  .action-text p {
    @apply text-sm text-gray-600;
  }

  .send-options {
    @apply p-6 space-y-6;
  }

  .send-option {
    @apply w-full flex items-center justify-center 
             px-4 py-3 bg-blue-100 text-blue-700 
             rounded-lg hover:bg-blue-200 
             transition-colors disabled:opacity-50;
  }

  .divider {
    @apply relative text-center text-gray-500;
  }

  .divider span {
    @apply bg-white px-4 relative z-10;
  }

  .divider::before {
    content: "";
    @apply absolute top-1/2 left-0 right-0 h-px bg-gray-300 -z-10;
  }

  .selected-employees {
    @apply space-y-4;
  }

  .employee-list {
    @apply grid grid-cols-1 sm:grid-cols-2 gap-2 
             max-h-60 overflow-y-auto 
             border border-gray-200 rounded-lg p-4;
  }

  .employee-item {
    @apply flex items-center space-x-2 
             hover:bg-gray-100 p-2 rounded-md 
             cursor-pointer transition-colors;
  }

  .send-selected-btn {
    @apply w-full flex items-center justify-center 
             px-4 py-3 bg-green-100 text-green-700 
             rounded-lg hover:bg-green-200 
             transition-colors disabled:opacity-50;
  }
</style>
