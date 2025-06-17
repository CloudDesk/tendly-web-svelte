<script lang="ts">
  import { onMount } from "svelte";
  import { payslipApi } from "$lib/services/api";
  import Table from "$lib/components/common/Table.svelte";

  export let startDate: string;
  export let endDate: string;
  export let page: number;
  export let limit: number;

  let payslipHistory = [];
  let totalRecords = 0;
  let isLoading = false;

  const fetchPayslipHistory = async () => {
    isLoading = true;
    try {
      const result = await payslipApi.getPayslipHistory({
        startDate,
        endDate,
        page,
        limit,
      });
      if (result.success) {
        payslipHistory = result.data.records;
        totalRecords = result.data.total;
      }
    } catch (error) {
      console.error("Error fetching payslip history:", error);
    } finally {
      isLoading = false;
    }
  };

  const handleFilterSubmit = () => {
    fetchPayslipHistory();
  };

  const handlePageChange = (newPage: number) => {
    page = newPage;
    fetchPayslipHistory();
  };

  onMount(() => {
    fetchPayslipHistory();
  });
</script>

<div class="payslip-history">
  <div class="filters mb-4">
    <label class="block mb-2">
      Start Date:
      <input
        type="date"
        bind:value={startDate}
        class="border border-gray-300 rounded px-2 py-1"
      />
    </label>
    <label class="block mb-2">
      End Date:
      <input
        type="date"
        bind:value={endDate}
        class="border border-gray-300 rounded px-2 py-1"
      />
    </label>
    <button
      class="bg-blue-600 text-white px-4 py-2 rounded"
      on:click={handleFilterSubmit}
    >
      Apply Filters
    </button>
  </div>

  {#if isLoading}
    <p>Loading...</p>
  {:else if payslipHistory.length > 0}
    <Table
      columns={[
        { key: "employeeName", label: "Employee Name" },
        {
          key: "payslipUrl",
          label: "Payslip",
          render: (row) =>
            `<a href="${row.payslipUrl}" target="_blank" class="text-blue-600 hover:underline">View Payslip</a>`,
        },
        { key: "status", label: "Status" },
      ]}
      data={payslipHistory}
      pagination={{
        total: totalRecords,
        currentPage: page,
        pageSize: limit,
        onPageChange: handlePageChange,
      }}
    />
  {:else}
    <p>No payslip history found for the selected date range.</p>
  {/if}
</div>

<style>
  .filters {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .filters label {
    display: flex;
    flex-direction: column;
  }
</style>
