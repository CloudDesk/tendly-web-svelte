<script lang="ts">
  import { onMount } from "svelte";
  import { CreditCard, FileText, ArrowRight } from "lucide-svelte";
  import { auth } from "$lib/stores/auth";
  import { documentsApi } from "$lib/services/api";
  import { goto } from "$app/navigation";

  $: user = $auth.user;

  let payslipDoc: any = null;
  let isLoading = false;
  let error: string | null = null;

  onMount(fetchLatestPayslip);

  async function fetchLatestPayslip() {
    if (!user) return;
    isLoading = true;
    error = null;
    const now = new Date();
    const selectedMonth = now.getMonth()  // JS months are 0-based, API is 1-based
    const selectedYear = now.getFullYear();
    try {
      const response: any = await documentsApi.getMyPayslips(
        selectedMonth,
        selectedYear,
        user._id
      );
      if (response.success && response.data.length > 0) {
        // Find the latest payslip (prefer current month, else most recent)
        payslipDoc = response.data[0];
      } else {
        error = "No payslip found for this month.";
        payslipDoc = null;
      }
    } catch (err) {
      console.error("Error fetching payslip:", err);
      error = "Failed to load payslip data.";
    } finally {
      isLoading = false;
    }
  }

  function viewPayslip() {
    if (payslipDoc?.payslipUrl) {
      window.open(payslipDoc.payslipUrl, "_blank");
    } else if (payslipDoc?.month && payslipDoc?.year) {
      goto(`/my/payslips?month=${payslipDoc.month}&year=${payslipDoc.year}`);
    }
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
    {#if payslipDoc}
      <span class="bg-blue-100 text-blue-800 text-sm py-1 px-3 rounded-full font-medium">
        {monthNames[(payslipDoc.month ?? 1) - 1]} {payslipDoc.year}
      </span>
    {/if}
  </div>

  {#if isLoading}
    <div class="flex justify-center items-center h-40">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  {:else if error}
    <div class="text-center py-8">
      <p class="text-sm text-red-500">{error}</p>
    </div>
  {:else if payslipDoc}
    <div class="space-y-4">
      <div class="bg-white rounded-lg p-4 border border-gray-100">
        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Net Salary</span>
            <span class="font-bold text-green-600 text-lg">
              ₹{payslipDoc.netSalary?.toLocaleString()}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Gross Salary</span>
            <span class="font-semibold text-gray-800">
              ₹{payslipDoc.grossSalary?.toLocaleString()}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Total Deductions</span>
            <span class="font-semibold text-red-600">
              ₹{payslipDoc.totalDeductions?.toLocaleString()}
            </span>
          </div>
          {#if payslipDoc.epfEmployee}
            <div class="flex justify-between items-center">
              <span class="text-gray-600">EPF (Employee)</span>
              <span class="font-semibold text-gray-800">
                ₹{payslipDoc.epfEmployee?.toLocaleString()}
              </span>
            </div>
          {/if}
          {#if payslipDoc.incomeTax}
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Income Tax</span>
              <span class="font-semibold text-gray-800">
                ₹{payslipDoc.incomeTax?.toLocaleString()}
              </span>
            </div>
          {/if}
          {#if payslipDoc.bonus}
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Bonus</span>
              <span class="font-semibold text-gray-800">
                ₹{payslipDoc.bonus?.toLocaleString()}
              </span>
            </div>
          {/if}
          {#if payslipDoc.reimbursement}
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Reimbursement</span>
              <span class="font-semibold text-gray-800">
                ₹{payslipDoc.reimbursement?.toLocaleString()}
              </span>
            </div>
          {/if}
        </div>
      </div>
      <div class="flex flex-col space-y-3">
        <button
          on:click={viewPayslip}
          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-colors duration-200"
        >
          <FileText size={16} class="mr-2" />
          View Payslip
        </button>
        <a
          href="/my/payslips"
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
