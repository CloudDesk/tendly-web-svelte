<script lang="ts">
  import { toast } from "$lib/components/common/stores/toast.store";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import PayrollProcess from "$lib/components/payroll/payrollProcess.svelte";
  import { payrollApi } from "$lib/services/api/payroll";
  import { formatCurrency } from "$lib/utils/currency";
  import { getMonthFormats } from "$lib/utils/monthFormats";
  import { onMount } from "svelte";
  import {
    Check,
    X,
    AlertTriangle,
    DollarSign,
    FileText,
    Users,
    TrendingUp,
    Calendar,
    Download,
    Mail,
  } from "lucide-svelte";
  import PayslipProcess from "$lib/components/payroll/payslipProcess.svelte";
  import { payslipApi } from "$lib/services/api/payslip";
  import PayslipHistory from "$lib/components/payroll/payslipHistory.svelte";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";

  let today = new Date();
  let year = today.getFullYear();
  let month = getMonthFormats(today.getMonth() - 1);
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
    status: string;
    emailSent: boolean;
    lastEmailSentAt: string;
  }[] = [];
  let startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0]; // Default to the first day of the current month
  let endDate = new Date().toISOString().split("T")[0]; // Default to today
  let page = 1;
  let limit = 10;

  const handleFilterChange = (event: CustomEvent) => {
    const {
      startDate: newStartDate,
      endDate: newEndDate,
      page: newPage,
    } = event.detail;
    startDate = newStartDate || startDate;
    endDate = newEndDate || endDate;
    page = newPage || page;
  };
  const getPayrolls = async () => {
    try {
      let result: any = await payrollApi.payrollApprovalSummary(
        today.getMonth() - 1,
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
    isLoading = true;
    const { month, year, recipients } = event.detail;
    let obj = {
      year,
      month: Number(month.numeric),
      recipients,
    };
    try {
      let result: any = await payslipApi.sendPayslips(obj);
      console.log(result, "sendPayslip");
      if (result.success) {
        await checkPayslipGeneration();
        toast.success("Payslip send");
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      isLoading = false;
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

  const dashboardStats = [
    {
      title: "Total Employees",
      value: reviewPayrollData?.totalEmployees || 0,
      icon: Users,
      color: "blue",
    },
    {
      title: "Gross Payroll",
      value: formatCurrency(reviewPayrollData?.totalGrossSalary || 0),
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Net Payroll",
      value: formatCurrency(reviewPayrollData?.totalNetSalary || 0),
      icon: TrendingUp,
      color: "indigo",
    },
    {
      title: "Processing Month",
      value: `${month.name} ${year}`,
      icon: Calendar,
      color: "purple",
    },
  ];

  const quickActions = [
    {
      title: "Generate Payslips",
      icon: FileText,
      action: generatePayslip,
      disabled: !isPayslipGenerated,
    },
    {
      title: "Download Reports",
      icon: Download,
      action: () => {},
      disabled: false,
    },
    {
      title: "Send Payslips",
      icon: Mail,
      action: () => {},
      disabled: !isPayslipGenerated,
    },
  ];

  onMount(() => {
    getPayrolls();
    checkPayrollStatus();
    checkPayslipGeneration();
  });
</script>

<IndexPageTemplate
  title="Payroll"
  subtitle="Centralized Payroll Management for All Employees"
>
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
    {:else if activeTab === "history"}
      <PayslipHistory
        {startDate}
        {endDate}
        {page}
        {limit}
        on:filterChange={handleFilterChange}
      />
    {/if}
  </Tabs>
</IndexPageTemplate>
