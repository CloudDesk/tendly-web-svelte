<script lang="ts">
  import LoaderNew from "$lib/components/common/LoaderNew.svelte";
  import Modal from "$lib/components/common/Modal.svelte";
  import { toast } from "$lib/components/common/stores/toast.store";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import PayrollProcess from "$lib/components/payroll/payrollProcess.svelte";
  import { payrollApi } from "$lib/services/api/payroll";
  import { formatCurrency } from "$lib/utils/currency";
  import { getMonthFormats } from "$lib/utils/monthFormats";
  import { onMount } from "svelte";
  import {
    CheckCircle,
    XCircle,
    Check,
    X,
    AlertTriangle,
    DollarSign,
  } from "lucide-svelte";
  import PayslipProcess from "$lib/components/payroll/payslipProcess.svelte";
  import { payslipApi } from "$lib/services/payslip";

  let today = new Date();
  let year = today.getFullYear();
  let month = getMonthFormats(today.getMonth());
  let reviewPayrollData: any;

  let payrollInitiateResponse: any = null; // New variable for initiation response
  let showModal = false; // Control modal visibility
  let showConfirmDialog = false;
  let needsAdminApproval: boolean = false;
  let canApprove: boolean = false;
  let canInitiate: boolean = false;
  let isLoading = false;
  let isPayslipGenerated: boolean = false;
  let payslips: {
    employeeId: string;
    employeeName: string;
    payslipId: string;
    payslipUrl: string;
  }[] = [];

  const getPayrolls = async () => {
    try {
      let result: any = await payrollApi.payrollApprovalSummary(
        today.getMonth(),
        year
      );
      console.log(result, "result getpayrolls");
      if (result.success) {
        reviewPayrollData = result.data;
      }
    } catch (error) {
      console.log(error, "error getPayrolls");
    }
  };

  const checkPayrollStatus = async () => {
    let months = Number(month.numeric);
    needsAdminApproval = false;
    canApprove = false;
    canInitiate = false;
    try {
      const statusResponse: any = await payrollApi.getPayrollStatus(
        months,
        year
      );
      console.log(statusResponse, "statusResponse");
      if (statusResponse.success) {
        let payrollSummary = statusResponse.data;

        // Ensure statusBreakdown exists and totalRecords is a valid number
        if (
          payrollSummary.statusBreakdown &&
          typeof payrollSummary.totalRecords === "number"
        ) {
          let totalRecords = payrollSummary.totalRecords;
          let draftCount = payrollSummary.statusBreakdown.Draft || 0;
          let cancelledCount = payrollSummary.statusBreakdown.Cancelled || 0;
          let failedCount = payrollSummary.statusBreakdown.Failed || 0;

          let nonProcessedCount = draftCount + cancelledCount + failedCount;
          // ✅ Scenario 1: If all values are 0, proceed to approve/initiate response checks
          if (totalRecords === 0) {
            console.log("All records are zero, proceeding to next checks.");
          }
          // ✅ Scenario 2: If Draft count equals Total Records, restrict processing
          else if (totalRecords === draftCount) {
            needsAdminApproval = true;
            return;
          }
          // ✅ Scenario 3: If Draft + Cancelled = Total Records, restrict processing
          else if (
            totalRecords === draftCount + cancelledCount &&
            draftCount > 0
          ) {
            needsAdminApproval = true;
            return;
          }
          // ✅ Scenario 4: If all records are Cancelled and no Draft exists, proceed
          else if (totalRecords === cancelledCount && draftCount === 0) {
            console.log(
              "All records are Cancelled, proceeding to next checks."
            );
          } else {
            console.log("Proceeding as conditions don't restrict the process.");
          }
        }
      }
      //if reApprove true breake  below
      const initiateResponse: any = await payrollApi.canInitiatePayroll(
        months,
        year
      );
      console.log(initiateResponse, "initiateResponse");
      if (initiateResponse.success) {
        canInitiate = initiateResponse.data.canInitiate;
      }

      const approveResponse: any = await payrollApi.canApprovePayroll(
        months,
        year
      );
      console.log(approveResponse, "approveresponse");
      if (approveResponse.success) {
        canApprove = approveResponse.data.canApprove;
      }
    } catch (error) {}
  };
  const checkPayslipGeneration = async () => {
    isLoading = true;
    try {
      const result: any = await payslipApi.checkPayslipStatus(
        Number(month.numeric),
        year
      );
      console.log(result, "Payslip Generation Status");
      if (result.success) {
        isPayslipGenerated = result.data.generated;
        payslips = [...result.data.payslips];
      }
      console.log(payslips);
    } catch (error) {
      console.error("Error checking payslip generation status:", error);
    } finally {
      isLoading = false;
    }
  };

  // Action handlers
  const processPayroll = async () => {
    console.log("processPayroll", today);

    const formattedDate = `${year}-${month.numeric}`;
    console.log("Formatted Date:", formattedDate);
    isLoading = true;
    try {
      let result: any = await payrollApi.payrollInitiate({
        monthYear: formattedDate,
      });
      console.log(result);
      if (result.success) {
        payrollInitiateResponse = result.data;
        showModal = true;
      }
    } catch (error) {
      console.log(error);
      toast.error("error in Pyroll initate ");
    } finally {
      await checkPayrollStatus();
      isLoading = false;
    }
  };

  // Handle Proceed action
  const handleProceed = async () => {
    console.log(payrollInitiateResponse, "handleProceed");
    if (
      payrollInitiateResponse.totalEmployees ===
      payrollInitiateResponse.totalActiveEmployees
    ) {
      await proceedToPendingApproval();
    } else {
      showConfirmDialog = true;
    }
  };

  // Confirm Proceed and update to PendingApproval
  const proceedToPendingApproval = async () => {
    isLoading = true;
    try {
      const result = await payrollApi.updateStatus(
        Number(month.numeric),
        year,
        "Pending Approval"
      );
      console.log(result, "Proceed result");
      toast.success("Payroll moved to Pending Approval");
      showModal = false;
      showConfirmDialog = false;
    } catch (error) {
      console.log(error);
      toast.error("Failed to proceed with payroll");
    } finally {
      await checkPayrollStatus();
      isLoading = false;
    }
  };

  // Handle Decline action
  const handleDecline = async () => {
    isLoading = true;
    try {
      const result = await payrollApi.updateStatus(
        Number(month.numeric),
        year,
        "Cancelled"
      );
      console.log(result, "Decline result");
      toast.success("Payroll marked as Failed");
      showModal = false;
    } catch (error) {
      console.log(error);
      toast.error("Failed to decline payroll");
    } finally {
      await checkPayrollStatus();
      isLoading = false;
    }
  };

  const approvalPayroll = async () => {
    console.log("approvalPayroll");
    isLoading = true;
    try {
      let result: any = await payrollApi.updateStatus(
        Number(month.numeric),
        year,
        "Processing"
      );
      console.log(result, "Result approvalPayroll");
      if (result.success) {
      }
      toast.success(result.data?.message);
    } catch (error) {
      console.log(error, "error approvalPayroll");
    } finally {
      await checkPayrollStatus();
      isLoading = false;
    }
  };

  const handleAdminApproval = async () => {
    isLoading = true;
    try {
      const result = await payrollApi.updateStatus(
        Number(month.numeric),
        year,
        "Pending Approval"
      );
      console.log(result, "Admin approval result");
      toast.success("Payroll approved for further processing");
      needsAdminApproval = false;
    } catch (error) {
      console.log(error);
      toast.error("Failed to approve payroll");
    } finally {
      await checkPayrollStatus();
      isLoading = false;
    }
  };

  const handleCancelDraft = async () => {
    isLoading = true;
    try {
      const result = await payrollApi.updateStatus(
        Number(month.numeric),
        year,
        "Cancelled"
      );
      console.log(result, "Cancel draft result");
      toast.success("Draft payroll cancelled");
      needsAdminApproval = false;
    } catch (error) {
      console.log(error);
      toast.error("Failed to cancel payroll");
    } finally {
      await checkPayrollStatus();
      isLoading = false;
    }
  };

  const generatePayslip = async () => {
    try {
      let result = await payslipApi.bulkGenerate({
        month: Number(month.numeric),
        year,
      });
      console.log(result, "result generatePayslip");
      isPayslipGenerated = true;
    } catch (error) {
      console.log(error, "error generatePayslip");
    }
  };

  const sendPayslip = async (event: CustomEvent) => {
    console.log("sendPayslip", event.detail);
    const { month, year, recipients } = event.detail;

    try {
      let result = await payslipApi.sendPayslips({
        year,
        month: Number(month.numeric),
        recipients,
      });
      console.log(result, "sendPayslip");
    } catch (error) {
      console.log("error", error);
    }
  };

  const tabs = [
    { id: "processing", label: "Payroll Processing" },
    { id: "payslips", label: "Payslips" },
    { id: "history", label: "History" },
    { id: "templates", label: "Templates" },
    { id: "trends", label: "Trends" },
  ];

  $: payslips;
  console.log(payslips, "payslip");

  onMount(() => {
    getPayrolls();
    checkPayrollStatus();
    checkPayslipGeneration();
  });
</script>

<div class="page">
  <div class="header">
    <div class="title-section">
      <h1>Payroll Management</h1>
      <p class="subtitle">
        Manage employee payroll, generate payslips, and track payroll history.
      </p>
    </div>
  </div>
  <Tabs {tabs} let:activeTab>
    {#if activeTab === "processing"}
      <PayrollProcess
        {month}
        {year}
        payrollData={reviewPayrollData}
        {isLoading}
        {canInitiate}
        {canApprove}
        on:initiate={processPayroll}
        on:approval={approvalPayroll}
      />
      {#if needsAdminApproval}
        <div class="admin-approval-container">
          <div
            class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-center justify-between shadow-md"
          >
            <div class="flex items-center space-x-5">
              <div class="bg-yellow-100 p-3 rounded-full">
                <AlertTriangle class="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">
                  Admin Action Required
                </h3>
                <p class="text-gray-600">
                  All payroll records are currently in Draft status and need
                  your attention.
                </p>
              </div>
            </div>
            <div class="flex space-x-4">
              <button
                on:click={handleAdminApproval}
                class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md"
              >
                <Check class="h-5 w-5" />
                <span>Approve for Processing</span>
              </button>
              <button
                on:click={handleCancelDraft}
                class="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2 shadow-md"
              >
                <X class="h-5 w-5" />
                <span>Cancel Draft</span>
              </button>
            </div>
          </div>
        </div>
      {/if}
    {:else if activeTab === "payslips"}
      <PayslipProcess
        {month}
        {year}
        {isPayslipGenerated}
        {payslips}
        on:payslip-generated={generatePayslip}
        on:payslip-sent={sendPayslip}
      />
    {/if}
  </Tabs>
  <!-- Modal to display payroll initiation data -->
  {#if showModal && payrollInitiateResponse}
    <Modal
      title="Payroll Initiation Summary"
      show
      onClose={() => (showModal = false)}
    >
      <div class="p-6 space-y-6">
        <div class="bg-blue-50 rounded-xl p-5 border border-blue-100">
          <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <DollarSign class="h-8 w-8 mr-3 text-blue-600" />
            Payroll Summary
          </h2>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <p class="text-sm text-gray-500 mb-1">Total Records</p>
              <p class="text-xl font-semibold text-gray-800">
                {payrollInitiateResponse.totalRecords}
              </p>
            </div>

            <div class="bg-white p-4 rounded-lg shadow-sm">
              <p class="text-sm text-gray-500 mb-1">Total Employees</p>
              <p class="text-xl font-semibold text-gray-800">
                {payrollInitiateResponse.totalEmployees}
              </p>
            </div>

            <div class="bg-white p-4 rounded-lg shadow-sm">
              <p class="text-sm text-gray-500 mb-1">Active Employees</p>
              <p class="text-xl font-semibold text-gray-800">
                {payrollInitiateResponse.totalActiveEmployees}
              </p>
            </div>

            <div class="bg-white p-4 rounded-lg shadow-sm">
              <p class="text-sm text-gray-500 mb-1">Status</p>
              <p class="text-xl font-semibold text-gray-800">
                {payrollInitiateResponse.status}
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-green-50 p-4 rounded-lg border border-green-100">
            <p class="text-sm text-gray-600 mb-1">Total Gross Salary</p>
            <p class="text-2xl font-bold text-green-700">
              {formatCurrency(payrollInitiateResponse.totalGrossSalary)}
            </p>
          </div>

          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p class="text-sm text-gray-600 mb-1">Total Net Salary</p>
            <p class="text-2xl font-bold text-blue-700">
              {formatCurrency(payrollInitiateResponse.totalNetSalary)}
            </p>
          </div>

          <div class="bg-red-50 p-4 rounded-lg border border-red-100">
            <p class="text-sm text-gray-600 mb-1">Total Deductions</p>
            <p class="text-2xl font-bold text-red-700">
              {formatCurrency(payrollInitiateResponse.totalDeductions)}
            </p>
          </div>
        </div>

        <div class="actions flex justify-end space-x-4">
          <button
            on:click={handleDecline}
            class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
          >
            <XCircle class="h-5 w-5 mr-2" />
            Decline
          </button>
          <button
            on:click={handleProceed}
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <CheckCircle class="h-5 w-5 mr-2" />
            Proceed
          </button>
        </div>
      </div>
    </Modal>
  {/if}

  <!-- Confirmation Dialog for Proceed -->
  {#if showConfirmDialog}
    <Modal
      title="Confirm Proceed"
      show
      onClose={() => (showConfirmDialog = false)}
    >
      <div class="p-6 text-center space-y-6">
        <div class="bg-yellow-50 p-5 rounded-xl border border-yellow-100">
          <AlertTriangle class="h-12 w-12 mx-auto mb-4 text-yellow-600" />
          <h2 class="text-2xl font-bold text-gray-800 mb-3">
            Confirm Payroll Proceed
          </h2>
          <p class="text-gray-600">
            All {payrollInitiateResponse.totalActiveEmployees} active employees are
            included in this payroll. Do you want to proceed to Pending Approval?
          </p>
        </div>

        <div class="flex justify-center space-x-4">
          <button
            on:click={async () => {
              await checkPayrollStatus();
              showConfirmDialog = false;
            }}
            class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            No, Cancel
          </button>
          <button
            on:click={proceedToPendingApproval}
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Yes, Proceed
          </button>
        </div>
      </div>
    </Modal>
  {/if}

  {#if isLoading}
    <LoaderNew />
  {/if}
</div>

<style>
  :global(body) {
    @apply m-0 p-0 text-gray-800 bg-gray-50;
  }
  .page {
    @apply p-6 bg-gray-50 min-h-screen;
  }

  /* Header Section Styles */
  .header {
    @apply flex flex-col gap-5 mb-6 bg-white p-6 rounded-xl shadow-md transition-shadow hover:shadow-lg;
  }

  .title-section h1 {
    @apply text-3xl font-semibold text-gray-800 mb-2;
  }

  .subtitle {
    @apply text-gray-600 text-base;
  }

  .actions {
    @apply mt-4 flex space-x-4;
  }

  button {
    @apply px-4 py-2 rounded-md transition-all focus:outline-none focus:ring-2;
  }
</style>
