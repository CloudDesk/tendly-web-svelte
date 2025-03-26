<script lang="ts">
  import LoaderNew from "$lib/components/common/LoaderNew.svelte";
  import Modal from "$lib/components/common/Modal.svelte";
  import { toast } from "$lib/components/common/stores/toast.store";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import PayrollProcess from "$lib/components/payroll/payrollProcess.svelte";
  import { payrollApi } from "$lib/services/api/payroll";
  import { getMonthFormats } from "$lib/utils/monthFormats";
  import { onMount } from "svelte";

  let today = new Date();
  let year = today.getFullYear();
  let month = getMonthFormats(today.getMonth());
  let reviewPayrollData: any;
  let showReviewPayroll: boolean = false;
  let disableAction: boolean = false;

  let isLoading = false;

  const getPayrolls = async () => {
    try {
      let result: any = await payrollApi.payrollApprovalSummary(
        today.getMonth(),
        year
      );
      console.log(result, "result getpayrolls");
      if (result.success) {
        reviewPayrollData = result.data;
        showReviewPayroll = true;
      }
    } catch (error) {
      console.log(error, "error getPayrolls");
    }
  };
  onMount(() => {
    getPayrolls();
  });
  // Action handlers
  const processPayroll = async () => {
    console.log("processPayroll", today);

    const formattedDate = `${year}-${month.numeric}`;
    console.log("Formatted Date:", formattedDate);
    isLoading = true;
    try {
      let result = await payrollApi.payrollInitiate({
        monthYear: formattedDate,
      });
      console.log(result);
    } catch (error) {
      console.log(error);
    } finally {
      await getPayrolls();
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
        "Approve"
      );
      console.log(result, "Result approvalPayroll");
      if (result.success) {
        disableAction = true;
      }
      toast.success(result.data?.message);
    } catch (error) {
      console.log(error, "error approvalPayroll");
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
        {showReviewPayroll}
        {isLoading}
        {disableAction}
        on:initiate={processPayroll}
        on:approval={approvalPayroll}
      />
    {/if}
  </Tabs>
  {#if isLoading}
    <LoaderNew />
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
  } */
 -->

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    color: #333;
    background: #f6f7fb;
  }

  .page {
    padding: 24px;
    background: #f6f7fb;
    min-height: 100vh;
  }

  /* Header Section Styles */
  .header {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 24px;
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  .title-section h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: #2d3748;
  }

  .subtitle {
    margin: 8px 0 0;
    color: #718096;
    font-size: 15px;
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
  }
</style>
