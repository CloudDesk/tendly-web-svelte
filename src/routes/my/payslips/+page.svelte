<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import { Chart, registerables } from "chart.js";
  import { documentsApi } from "$lib/services/api";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import Modal from "$lib/components/common/Modal.svelte";

  Chart.register(...registerables);

  const userId = $auth.user?._id || "";

  let isLoading = false;
  let payslipData: any = null;
  let error: string | null = null;
  let showPreviewModal = false;

  const currentDate = new Date();
  let selectedMonth = currentDate.getMonth() + 1;
  let selectedYear = currentDate.getFullYear();

  const years = [selectedYear, selectedYear - 1, selectedYear - 2];
  const months = [
    { value: 1, name: "January" },
    { value: 2, name: "February" },
    { value: 3, name: "March" },
    { value: 4, name: "April" },
    { value: 5, name: "May" },
    { value: 6, name: "June" },
    { value: 7, name: "July" },
    { value: 8, name: "August" },
    { value: 9, name: "September" },
    { value: 10, name: "October" },
    { value: 11, name: "November" },
    { value: 12, name: "December" },
  ];

  async function fetchPayslip() {
    isLoading = true;
    error = null;

    try {
      const response: any = await documentsApi.getMyPayslips(
        selectedMonth,
        selectedYear,
        userId
      );

      if (response.success && response.data.length > 0) {
        payslipData = response.data[0];
        initCharts();
      } else {
        error = "No payslip found for the selected month and year.";
        payslipData = null;
      }
    } catch (err) {
      error = "Failed to load payslip data. Please try again.";
      console.error("Error fetching payslip:", err);
      payslipData = null;
    } finally {
      isLoading = false;
    }
  }

  let salaryChart: Chart | null = null;

  function initCharts() {
    if (!payslipData) return;

    // Clean up existing chart
    if (salaryChart) salaryChart.destroy();

    setTimeout(() => {
      const donutCtx = document.getElementById(
        "salaryDonutChart"
      ) as HTMLCanvasElement;

      if (donutCtx) {
        const netAmount = payslipData.netSalary || 0;
        const deductionAmount = payslipData.totalDeductions || 0;
        const grossAmount = payslipData.grossSalary || 0;

        salaryChart = new Chart(donutCtx, {
          type: "doughnut",
          data: {
            labels: ["Net Salary", "Deductions"],
            datasets: [
              {
                data: [netAmount, deductionAmount],
                backgroundColor: [
                  "#10b981", // Green for net salary
                  "#ef4444", // Red for deductions
                ],
                borderWidth: 3,
                borderColor: "#ffffff",
                cutout: "60%", // Less cutout for fuller appearance
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                enabled: true,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                titleColor: "white",
                bodyColor: "white",
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderWidth: 1,
                callbacks: {
                  label: function (context) {
                    const label = context.label || "";
                    const value = context.raw;
                    const percentage =
                      grossAmount > 0
                        ? ((Number(value) / grossAmount) * 100).toFixed(1)
                        : "0";
                    return `${label}: ₹${Number(value).toLocaleString("en-IN")} (${percentage}%)`;
                  },
                },
              },
            },
          },
        });
      }
    }, 0);
  }

  function handleSelectionChange() {
    fetchPayslip();
  }

  function previewPayslip() {
    if (payslipData?.payslipUrl) {
      showPreviewModal = true;
    }
  }

  function downloadPayslip() {
    if (payslipData?.payslipUrl) {
      const link = document.createElement("a");
      link.href = payslipData.payslipUrl;
      link.download = `payslip-${selectedMonth}-${selectedYear}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  function formatCurrency(amount: number): string {
    return amount ? `₹${amount.toLocaleString("en-IN")}` : "₹0";
  }

  function getMonthName(monthNum: number): string {
    return months.find((m) => m.value === monthNum)?.name || "Unknown";
  }

  onMount(() => {
    fetchPayslip();
  });
</script>

<IndexPageTemplate
  title="My Payslip"
  subtitle="Your salary details and payment history"
>
  <!-- Enhanced Header with Filters -->
  <div
    class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8"
  >
    <div class="flex flex-col md:flex-row md:items-end gap-4">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">
          Select Pay Period
        </h3>
        <p class="text-sm text-gray-600">
          Choose month and year to view your payslip
        </p>
      </div>

      <div class="flex gap-4">
        <div class="relative">
          <label
            for="month"
            class="block text-sm font-medium text-gray-700 mb-2">Month</label
          >
          <select
            id="month"
            bind:value={selectedMonth}
            on:change={handleSelectionChange}
            class="w-40 rounded-xl border-2 border-gray-200 px-4 py-3 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-all duration-200 hover:border-indigo-300"
          >
            {#each months as month}
              <option value={month.value}>{month.name}</option>
            {/each}
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 top-8 flex items-center px-3 text-gray-500"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M7 10l5 5 5-5H7z"></path>
            </svg>
          </div>
        </div>

        <div class="relative">
          <label for="year" class="block text-sm font-medium text-gray-700 mb-2"
            >Year</label
          >
          <select
            id="year"
            bind:value={selectedYear}
            on:change={handleSelectionChange}
            class="w-32 rounded-xl border-2 border-gray-200 px-4 py-3 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-all duration-200 hover:border-indigo-300"
          >
            {#each years as year}
              <option value={year}>{year}</option>
            {/each}
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 top-8 flex items-center px-3 text-gray-500"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M7 10l5 5 5-5H7z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="flex justify-center items-center h-96">
      <div class="relative">
        <div
          class="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-indigo-600"
        ></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <svg
            class="w-8 h-8 text-indigo-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>
    </div>
  {:else if error}
    <div
      class="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 shadow-sm"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg
            class="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium text-red-800">Payslip Not Found</h3>
          <p class="text-red-600 mt-1">{error}</p>
        </div>
      </div>
    </div>
  {:else if payslipData}
    <!-- Main Payslip Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Salary Overview Card -->
      <div class="lg:col-span-1">
        <div
          class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div
            class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white"
          >
            <h2 class="text-xl font-bold mb-2">Salary Overview</h2>
            <p class="text-indigo-100">
              {getMonthName(selectedMonth)}
              {selectedYear}
            </p>
          </div>

          <div class="p-6">
            <!-- Chart Container -->
            <div class="text-center mb-6">
              <div class="w-48 h-48 mx-auto relative">
                <canvas id="salaryDonutChart"></canvas>
                <div
                  class="absolute inset-0 flex flex-col justify-center items-center"
                >
                  <p class="text-xs text-gray-500 mb-1">Gross Salary</p>
                  <p class="text-xl font-bold text-indigo-600">
                    {formatCurrency(payslipData.grossSalary)}
                  </p>
                  <div class="mt-2 text-center">
                    <div class="flex items-center justify-center gap-4 text-xs">
                      <div class="flex items-center">
                        <div
                          class="w-2 h-2 bg-green-500 rounded-full mr-1"
                        ></div>
                        <span class="text-gray-600">Net</span>
                      </div>
                      <div class="flex items-center">
                        <div class="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                        <span class="text-gray-600">Deductions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Salary Breakdown -->
            <div class="space-y-4">
              <div
                class="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
              >
                <div class="flex items-center">
                  <div class="w-3 h-3 rounded-full bg-indigo-500 mr-3"></div>
                  <span class="text-gray-700 font-medium">Gross Salary</span>
                </div>
                <span class="font-bold text-gray-900"
                  >{formatCurrency(payslipData.grossSalary)}</span
                >
              </div>

              <div
                class="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
              >
                <div class="flex items-center">
                  <div class="w-3 h-3 rounded-full bg-rose-500 mr-3"></div>
                  <span class="text-gray-700 font-medium">Total Deductions</span
                  >
                </div>
                <span class="font-bold text-gray-900"
                  >{formatCurrency(payslipData.totalDeductions)}</span
                >
              </div>

              <div
                class="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-200"
              >
                <span class="text-green-800 font-bold">Take Home Pay</span>
                <span class="font-bold text-xl text-green-600"
                  >{formatCurrency(payslipData.netSalary)}</span
                >
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 mt-6">
              <button
                on:click={previewPayslip}
                class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Preview
              </button>

              <button
                on:click={downloadPayslip}
                class="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Information -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">Payslip Details</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Employee Information -->
            <div
              class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100"
            >
              <h3
                class="text-lg font-semibold text-blue-800 mb-4 flex items-center"
              >
                <svg
                  class="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Employee Information
              </h3>
              <div class="space-y-3">
                {#if payslipData.employeeName}
                  <div class="flex justify-between">
                    <span class="text-gray-600">Name</span>
                    <span class="font-medium text-gray-900"
                      >{payslipData.employeeName}</span
                    >
                  </div>
                {/if}
                {#if payslipData.email}
                  <div class="flex justify-between">
                    <span class="text-gray-600">Email</span>
                    <span class="font-medium text-gray-900"
                      >{payslipData.email}</span
                    >
                  </div>
                {/if}
                <div class="flex justify-between">
                  <span class="text-gray-600">Pay Period</span>
                  <span class="font-medium text-gray-900"
                    >{getMonthName(payslipData.month)} {payslipData.year}</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Status</span>
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"
                  >
                    {payslipData.status || "Processed"}
                  </span>
                </div>
              </div>
            </div>

            <!-- Deductions Breakdown -->
            <div
              class="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-100"
            >
              <h3
                class="text-lg font-semibold text-rose-800 mb-4 flex items-center"
              >
                <svg
                  class="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Deductions
              </h3>
              <div class="space-y-3">
                {#if payslipData.epfEmployee > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-600">EPF Contribution</span>
                    <span class="font-medium text-gray-900"
                      >{formatCurrency(payslipData.epfEmployee)}</span
                    >
                  </div>
                {/if}
                {#if payslipData.professionalTax > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-600">Professional Tax</span>
                    <span class="font-medium text-gray-900"
                      >{formatCurrency(payslipData.professionalTax)}</span
                    >
                  </div>
                {/if}
                {#if payslipData.incomeTax > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-600">Income Tax</span>
                    <span class="font-medium text-gray-900"
                      >{formatCurrency(payslipData.incomeTax)}</span
                    >
                  </div>
                {/if}
                <div class="pt-3 border-t border-rose-200">
                  <div class="flex justify-between font-semibold">
                    <span class="text-rose-800">Total Deductions</span>
                    <span class="text-rose-600"
                      >{formatCurrency(payslipData.totalDeductions)}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          {#if payslipData.bonus > 0 || payslipData.reimbursement > 0}
            <div
              class="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100"
            >
              <h3
                class="text-lg font-semibold text-green-800 mb-4 flex items-center"
              >
                <svg
                  class="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                Additional Benefits
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#if payslipData.bonus > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-600">Bonus</span>
                    <span class="font-medium text-green-600"
                      >{formatCurrency(payslipData.bonus)}</span
                    >
                  </div>
                {/if}
                {#if payslipData.reimbursement > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-600">Reimbursement</span>
                    <span class="font-medium text-green-600"
                      >{formatCurrency(payslipData.reimbursement)}</span
                    >
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- Empty State -->
    <div
      class="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
    >
      <div
        class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center"
      >
        <svg
          class="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 class="text-2xl font-semibold text-gray-800 mb-3">
        No Payslip Available
      </h3>
      <p class="text-gray-600 mb-6 max-w-md mx-auto">
        Select a month and year from the filters above to view your payslip
        details and download options.
      </p>
      <div
        class="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg"
      >
        <svg
          class="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Use the dropdowns above to select a pay period
      </div>
    </div>
  {/if}
</IndexPageTemplate>

<!-- PDF Preview Modal -->
{#if showPreviewModal && payslipData?.payslipUrl}
  <Modal
    title={`Payslip Preview - ${getMonthName(selectedMonth)} ${selectedYear}`}
    show={showPreviewModal}
    onClose={() => (showPreviewModal = false)}
    wide={true}
  >
    <div class="h-[80vh] flex flex-col">
      <!-- PDF Viewer -->
      <div class="flex-1 bg-gray-100 p-2">
        <iframe
          src={payslipData.payslipUrl}
          class="w-full h-full border-0 rounded-lg shadow-sm bg-white"
          title="Payslip Preview"
        ></iframe>
      </div>
    </div>
  </Modal>
{/if}
