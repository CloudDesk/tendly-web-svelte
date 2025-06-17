<script lang="ts">
  import { onMount } from "svelte";
  import { CreditCard, FileText, ArrowRight } from "lucide-svelte";
  import { auth } from "$lib/stores/auth";
  import { payslipApi } from "$lib/services/api";
  import { goto } from "$app/navigation";
  import { onDestroy } from 'svelte';

  $: user = $auth.user;

  let payslipData: any = null;
  let isLoading = false;
  let error: string | null = null;
  let chartCanvas: HTMLCanvasElement;


  onMount(fetchLatestPayslip);

  async function fetchLatestPayslip() {
    if (!user) return;

    isLoading = true;
    error = null;

    const now = new Date();
    const selectedMonth = now.getMonth();
    const selectedYear = now.getFullYear();

    try {
      const response: any = await payslipApi.getPayslipMe(
        selectedMonth,
        selectedYear,
        user._id
      );
      if (response.success && response.data.payslips.length > 0) {
        payslipData = response.data.payslips[0];
        if (chartCanvas) {
          initializeChart();
        }
      } else {
        error = "No payslip found for last month.";
        payslipData = null;
      }
    } catch (err) {
      console.error("Error fetching payslip:", err);
      error = "Failed to load payslip data.";
    } finally {
      isLoading = false;
    }
  }

  function downloadPayslip() {
    if (payslipData?.payslipUrl) {
      window.open(payslipData.payslipUrl, "_blank");
    }
  }

  function goToPayslipPage() {
    goto("my/payslips");
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];


</script>

<div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-semibold text-gray-800 flex items-center">
      <CreditCard class="inline mr-2 text-blue-600" size={20} />
      Payslip Summary
    </h2>
    {#if payslipData}
      <span class="bg-blue-100 text-blue-800 text-sm py-1 px-3 rounded-full font-medium">
        {monthNames[payslipData.month - 1]} {payslipData.year}
      </span>
    {/if}
  </div>

  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else if error}
    <div class="text-center py-8">
      <p class="text-sm text-red-500">{error}</p>
    </div>
  {:else if payslipData}
      <!-- Details Section -->
      <div class="space-y-4">
        <div class="bg-white rounded-lg p-4 border border-gray-100">
          <h3 class="text-sm font-medium text-gray-500 mb-3">Salary Breakdown</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Basic Salary</span>
              <span class="font-semibold text-gray-800">₹{payslipData.basic.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">HRA</span>
              <span class="font-semibold text-gray-800">₹{payslipData.hra.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Other Allowance</span>
              <span class="font-semibold text-gray-800">₹{payslipData.otherAllowance.toLocaleString()}</span>
            </div>
            <div class="border-t border-gray-100 pt-3 mt-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Gross Salary</span>
                <span class="font-bold text-blue-600">₹{payslipData.grossSalary.toLocaleString()}</span>
              </div>
              <div class="flex justify-between items-center mt-2">
                <span class="text-gray-600">Total Deductions</span>
                <span class="font-bold text-red-600">₹{payslipData.totalDeductions.toLocaleString()}</span>
              </div>
              <div class="flex justify-between items-center mt-2">
                <span class="text-gray-600">Net Salary</span>
                <span class="font-bold text-green-600">₹{payslipData.netSalary.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col space-y-3">
          <button
            on:click={downloadPayslip}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-colors duration-200"
          >
            <FileText size={16} class="mr-2" />
            Download Payslip
          </button>
          <a
            href="/payslip"
            class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center transition-colors duration-200"
          >
            View Salary History
            <ArrowRight size={16} class="ml-1" />
          </a>
        </div>
      </div>
  {/if}
</div>

<style>
  /* Add any custom styles here */
</style>