<script lang="ts">
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import PayrollInitiate from "$lib/components/payroll/payrollInitiate.svelte";
  import PayrollReview from "$lib/components/payroll/payrollReview.svelte";
  import PayslipGenerate from "$lib/components/payroll/payslipGenerate.svelte";
  import PayslipSend from "$lib/components/payroll/payslipSend.svelte";
  let tabs = [
    { id: "initiate", label: "Payroll Initiate" },
    { id: "review", label: "Payroll Review" },
    { id: "generate", label: "Payslip Generate" },
    { id: "send", label: "Send Payslips" },
  ];
</script>

<IndexPageTemplate
  title="Payroll"
  subtitle="Centralized Payroll Management for All Employees"
>
  <Tabs {tabs} let:activeTab>
    {#if activeTab === "initiate"}
      <PayrollInitiate />
    {:else if activeTab === "review"}
      <PayrollReview />
{:else if activeTab ==="generate"}
<PayslipGenerate/>
{:else if activeTab ==="send"}
<PayslipSend/>

    {/if}
  </Tabs>
</IndexPageTemplate>
<!-- <script lang="ts">
  import { toast } from "$lib/components/common/stores/toast.store";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import PayrollProcess from "$lib/components/payroll/payrollProcess.svelte";
  import { payrollApi } from "$lib/services/api";
  import { formatCurrency } from "$lib/utils/currency";
  import { getMonthFormats } from "$lib/utils/monthFormats";
  import { onMount } from "svelte";
  import { Check, X, AlertTriangle } from "lucide-svelte";
  import PayslipProcess from "$lib/components/payroll/payslipProcess.svelte";
  import { payslipApi } from "$lib/services/api";
  import PayslipHistory from "$lib/components/payroll/payslipHistory.svelte";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";

  let today = new Date();
  let year = today.getFullYear();
  let month = getMonthFormats(today.getMonth());
  let reviewPayrollData: any = null;

  let payrollInitiateResponse: any = null;
  let showModal = false;
  let showConfirmDialog = false;
  let needsAdminApproval: boolean = false;
  let canApprove: boolean = false;
  let canInitiate: boolean = false;
  let isLoading = false;
  let isPayslipGenerated: boolean = false;
  let isPayrollApproved: boolean = false;
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
    .split("T")[0];
  let endDate = new Date().toISOString().split("T")[0];
  let page = 1;
  let limit = 10;

  // Loading states for each action
  let loadingStates = {
    payrollInitiate: false,
    payrollApproval: false,
    adminApproval: false,
    cancelDraft: false,
    payslipGenerate: false,
    payslipSend: false
  };

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

  const validateFlowState = () => {
    console.log("=== FLOW STATE DEBUG ===");
    console.log("canInitiate:", canInitiate);
    console.log("canApprove:", canApprove);
    console.log("isPayrollApproved:", isPayrollApproved);
    console.log("isPayslipGenerated:", isPayslipGenerated);
    console.log("needsAdminApproval:", needsAdminApproval);
    console.log("========================");
  };

  const getPayrolls = async () => {
    try {
      let result: any = await payrollApi.payrollSummary(
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

        if (
          payrollSummary.statusBreakdown &&
          typeof payrollSummary.totalRecords === "number"
        ) {
          let totalRecords = payrollSummary.totalRecords;
          let draftCount = payrollSummary.statusBreakdown.Draft || 0;
          let cancelledCount = payrollSummary.statusBreakdown.Cancelled || 0;
          let failedCount = payrollSummary.statusBreakdown.Failed || 0;

          let nonProcessedCount = draftCount + cancelledCount + failedCount;
          
          if (totalRecords === 0) {
            console.log("All records are zero, proceeding to next checks.");
          } else if (totalRecords === draftCount) {
            needsAdminApproval = true;
            return;
          } else if (
            totalRecords === draftCount + cancelledCount &&
            draftCount > 0
          ) {
            needsAdminApproval = true;
            return;
          } else if (totalRecords === cancelledCount && draftCount === 0) {
            console.log(
              "All records are Cancelled, proceeding to next checks."
            );
          } else if (
            totalRecords === payrollSummary.statusBreakdown.Processing
          ) {
            console.log("Processing records found, proceeding to next checks.");
            isPayrollApproved = true;
          } else {
            console.log("Proceeding as conditions don't restrict the process.");
          }
        }
      }

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
    } catch (error) {
      console.log(error, "error checkPayrollStatus");
    }
  };

  const checkPayslipGeneration = async () => {
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
    }
  };

  // Refresh all data after major state changes
  const refreshAllData = async () => {
    await Promise.all([
      getPayrolls(),
      checkPayrollStatus(),
      checkPayslipGeneration()
    ]);
  };

  // Action handlers
  const processPayroll = async () => {
    console.log("processPayroll", today);
    console.log(year, month, "year month");
    const formattedDate = `${year}-${month.numeric}`;
    console.log("Formatted Date:", formattedDate);
    
    loadingStates.payrollInitiate = true;
    try {
      let result: any = await payrollApi.payrollInitiate({
        monthYear: formattedDate,
      });
      console.log(result);
      if (result.success) {
        payrollInitiateResponse = result.data;
        showModal = true;
        // Immediately refresh data to get the latest state
        await refreshAllData();
        toast.success("Payroll initiated successfully");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error in Payroll initiate");
    } finally {
      loadingStates.payrollInitiate = false;
    }
  };

  const approvalPayroll = async () => {
    console.log("approvalPayroll");
    loadingStates.payrollApproval = true;
    try {
      let result: any = await payrollApi.updateStatus(
        Number(month.numeric),
        year,
        "Processing"
      );
      console.log(result, "Result approvalPayroll");
      if (result.success) {
        isPayrollApproved = true;
        toast.success(result.data?.message || "Payroll approved successfully");
        // Refresh data to get the latest state
        await refreshAllData();
      }
    } catch (error) {
      console.log(error, "error approvalPayroll");
      toast.error("Failed to approve payroll");
    } finally {
      loadingStates.payrollApproval = false;
    }
  };

  const handleAdminApproval = async () => {
    loadingStates.adminApproval = true;
    try {
      const result: any = await payrollApi.updateStatus(
        Number(month.numeric),
        year,
        "Pending Approval"
      );
      console.log(result, "Admin approval result");
      if (result.success) {
        toast.success("Payroll approved for further processing");
        needsAdminApproval = false;
        isPayrollApproved = true;
        // Refresh data to get the latest state
        await refreshAllData();
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to approve payroll");
    } finally {
      loadingStates.adminApproval = false;
    }
  };

  const handleCancelDraft = async () => {
    loadingStates.cancelDraft = true;
    try {
      const result = await payrollApi.updateStatus(
        Number(month.numeric),
        year,
        "Cancelled"
      );
      console.log(result, "Cancel draft result");
      toast.success("Draft payroll cancelled");
      needsAdminApproval = false;
      // Refresh data to get the latest state
      await refreshAllData();
    } catch (error) {
      console.log(error);
      toast.error("Failed to cancel payroll");
    } finally {
      loadingStates.cancelDraft = false;
    }
  };

  const generatePayslip = async () => {
    loadingStates.payslipGenerate = true;
    try {
      let result: any = await payslipApi.bulkGenerate({
        month: Number(month.numeric),
        year,
      });
      if (result.success) {
        isPayslipGenerated = true;
        toast.success("Payslips generated successfully");
        // Refresh payslip data immediately
        await checkPayslipGeneration();
      } else {
        toast.error(result?.message || "Failed to generate payslips");
      }
    } catch (error) {
      console.log(error, "error generatePayslip");
      toast.error("Failed to generate payslips");
    } finally {
      loadingStates.payslipGenerate = false;
    }
  };

  const sendPayslip = async (event: CustomEvent) => {
    console.log("sendPayslip", event.detail);
    loadingStates.payslipSend = true;
    const { month: eventMonth, year: eventYear, recipients } = event.detail;
    let obj = {
      year: eventYear,
      month: Number(month.numeric),
      recipients,
    };
    try {
      let result: any = await payslipApi.sendPayslips(obj);
      console.log(result, "sendPayslip");
      if (result.success) {
        toast.success("Payslips sent successfully");
        // Immediately refresh payslip data to show updated status
        await checkPayslipGeneration();
      } else {
        toast.error(result?.message || "Failed to send payslips");
      }
    } catch (error) {
      console.log("error", error);
      toast.error("Failed to send payslips");
    } finally {
      loadingStates.payslipSend = false;
    }
  };

  const tabs = [
    { id: "processing", label: "Payroll Processing" },
    { id: "payslips", label: "Payslips" },
    { id: "history", label: "History" },
    { id: "templates", label: "Templates" },
    { id: "trends", label: "Trends" },
  ];

  // Reactive statements for debugging
  $: payslips;
  $: isPayslipGenerated;
  console.log(isPayslipGenerated, "isPayslipGenerated");
  console.log(payslips, "payslip");

  onMount(() => {
    refreshAllData();
    validateFlowState();
  });

  // Reactive statement to track state changes
  $: {
    if (isPayrollApproved || isPayslipGenerated || canInitiate || canApprove) {
      validateFlowState();
    }
  }
</script>

<IndexPageTemplate
  title="Payroll"
  subtitle="Centralized Payroll Management for All Employees"
>
  <Tabs {tabs} let:activeTab >
    {#if activeTab === "processing"}
      <PayrollProcess
        {month}
        {year}
        payrollData={reviewPayrollData}
        isLoading={loadingStates.payrollInitiate || loadingStates.payrollApproval}
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
                disabled={loadingStates.adminApproval}
                class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if loadingStates.adminApproval}
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {:else}
                  <Check class="h-5 w-5" />
                {/if}
                <span>Approve for Processing</span>
              </button>
              <button
                on:click={handleCancelDraft}
                disabled={loadingStates.cancelDraft}
                class="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if loadingStates.cancelDraft}
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {:else}
                  <X class="h-5 w-5" />
                {/if}
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
        {isPayrollApproved}
        {isPayslipGenerated}
        {payslips}
        isGenerating={loadingStates.payslipGenerate}
        isSending={loadingStates.payslipSend}
        on:payslip-generated={generatePayslip}
        on:payslip-sent={sendPayslip}
      />
    {:else if activeTab === "history"}
    {/if}
  </Tabs>
</IndexPageTemplate> -->
<!-- 
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
-->
