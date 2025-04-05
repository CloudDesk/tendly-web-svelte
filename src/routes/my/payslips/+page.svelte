<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import { Chart, registerables } from "chart.js";
  import { payslipApi } from "$lib/services/api/payslip";

  Chart.register(...registerables);

  const userId = $auth.user?._id || "";
  console.log("User ID:", userId);

  let isLoading = false;
  let payslipData: any = null;
  let error: string | null = null;

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
      const response: any = await payslipApi.getPayslipMe(
        selectedMonth,
        selectedYear,
        userId
      );
      console.log("Response:", response);
      if (response.success && response.data.payslips.length > 0) {
        payslipData = response.data.payslips[0];
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
  let breakdownChart: Chart | null = null;

  function initCharts() {
    if (!payslipData) return;

    // Clean up existing charts
    if (salaryChart) salaryChart.destroy();
    if (breakdownChart) breakdownChart.destroy();

    setTimeout(() => {
      // Create the salary donut chart
      const donutCtx = document.getElementById(
        "salaryDonutChart"
      ) as HTMLCanvasElement;

      if (donutCtx) {
        salaryChart = new Chart(donutCtx, {
          type: "doughnut",
          data: {
            labels: ["Net Pay", "Deductions"],
            datasets: [
              {
                data: [payslipData.netSalary, payslipData.totalDeductions],
                backgroundColor: ["#aed6f1", "#aeb6bf"],
                borderWidth: 0,
                cutout: "75%",
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
                callbacks: {
                  label: function (context) {
                    const label = context.label || "";
                    const value = context.raw;
                    const percentage = (
                      (Number(value) / payslipData.grossSalary) *
                      100
                    ).toFixed(1);
                    return `${label}: ₹${Number(value).toFixed(2)} (${percentage}%)`;
                  },
                },
              },
            },
          },
        });
      }

      const breakdownCtx = document.getElementById(
        "earningsBreakdownChart"
      ) as HTMLCanvasElement;

      if (breakdownCtx) {
        const labels = ["Basic", "HRA", "Other Allowances"];
        const data = [
          payslipData.basic,
          payslipData.hra,
          payslipData.otherAllowance +
            (payslipData.da || 0) +
            (payslipData.overtimePay || 0) +
            (payslipData.bonus || 0),
        ];

        breakdownChart = new Chart(breakdownCtx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Amount (₹)",
                data: data,
                backgroundColor: ["#85c1e9", "#5dade2", "#d6eaf8"],
                borderRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  display: true,
                  color: "rgba(0, 0, 0, 0.05)",
                },
              },
              x: {
                grid: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
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

  function downloadPayslip() {
    if (payslipData && payslipData.payslipUrl) {
      window.open(payslipData.payslipUrl, "_blank");
    }
  }

  onMount(() => {
    fetchPayslip();
  });
</script>

<div class="bg-gray-50 min-h-screen">
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
    >
      <div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">My Payslip</h1>
      </div>

      <div class="mt-4 md:mt-0 flex flex-wrap items-end gap-3">
        <div class="relative">
          <label
            for="month"
            class="block text-sm font-medium text-gray-700 mb-1">Month</label
          >
          <select
            id="month"
            bind:value={selectedMonth}
            on:change={handleSelectionChange}
            class="w-40 rounded-lg border border-gray-300 px-4 py-2.5 bg-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
          >
            {#each months as month}
              <option value={month.value}>{month.name}</option>
            {/each}
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-2 text-gray-700"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M7 10l5 5 5-5H7z"></path>
            </svg>
          </div>
        </div>

        <div class="relative">
          <label for="year" class="block text-sm font-medium text-gray-700 mb-1"
            >Year</label
          >
          <select
            id="year"
            bind:value={selectedYear}
            on:change={handleSelectionChange}
            class="w-32 rounded-lg border border-gray-300 px-4 py-2.5 bg-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
          >
            {#each years as year}
              <option value={year}>{year}</option>
            {/each}
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-2 text-gray-700"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M7 10l5 5 5-5H7z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <div
          class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"
        ></div>
      </div>
    {:else if error}
      <div
        class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md mb-6 flex items-start"
      >
        <svg
          class="h-6 w-6 mr-3 flex-shrink-0"
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
        <span>{error}</span>
      </div>
    {:else if payslipData}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-2xl shadow-md p-6 md:col-span-1">
          <div class="flex items-center mb-4">
            <h2 class="text-xl font-bold text-gray-800">Salary Summary</h2>
          </div>

          <div class="text-center my-8">
            <div class="w-48 h-48 mx-auto relative">
              <canvas id="salaryDonutChart"></canvas>
              <div
                class="absolute inset-0 flex flex-col justify-center items-center"
              >
                <p class="text-sm text-gray-500">Net Salary</p>
                <p class="text-2xl font-bold text-green-400">
                  ₹{payslipData.netSalary.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p class="text-xs text-gray-500">
                  {months.find((m) => m.value === selectedMonth)?.name}, {selectedYear}
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-4 mt-4">
            <div class="flex justify-between items-center py-2">
              <span class="flex items-center">
                <span class="w-3 h-3 rounded-full bg-indigo-600 mr-2"></span>
                <span class="text-gray-600">Gross Salary</span>
              </span>
              <span class="font-semibold"
                >₹{payslipData.grossSalary.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}</span
              >
            </div>

            <div class="flex justify-between items-center py-2">
              <span class="flex items-center">
                <span class="w-3 h-3 rounded-full bg-rose-500 mr-2"></span>
                <span class="text-gray-600">Deductions</span>
              </span>
              <span class="font-semibold"
                >₹{payslipData.totalDeductions.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}</span
              >
            </div>

            <div
              class="flex justify-between items-center py-2 border-t border-gray-100 pt-3"
            >
              <span class="font-medium text-gray-800">Take Home</span>
              <span class="font-bold text-lg text-indigo-600"
                >₹{payslipData.netSalary.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}</span
              >
            </div>
          </div>

          <button
            on:click={downloadPayslip}
            class="mt-6 bg-blue-500 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition duration-150 flex items-center justify-center gap-2 w-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
            Download Payslip
          </button>
        </div>
        <div class="bg-white rounded-2xl shadow-md p-6 md:col-span-2">
          <div class="flex items-center mb-6">
            <h2 class="text-xl font-bold text-gray-800">Earnings Breakdown</h2>
          </div>

          <div class="h-64 mb-6">
            <canvas id="earningsBreakdownChart"></canvas>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div class="bg-indigo-50 rounded-xl p-4">
              <h3 class="text-sm font-medium text-indigo-700 mb-3">
                Employee Details
              </h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Name</span>
                  <span class="font-medium">{payslipData.employeeName}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Email</span>
                  <span class="font-medium">{payslipData.email}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Pay Period</span>
                  <span class="font-medium">
                    {months.find((m) => m.value === payslipData.month)?.name}
                    {payslipData.year}
                  </span>
                </div>
              </div>
            </div>

            <div class="bg-rose-50 rounded-xl p-4">
              <h3 class="text-sm font-medium text-rose-700 mb-3">
                Deduction Summary
              </h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">EPF</span>
                  <span class="font-medium"
                    >₹{payslipData.epfEmployee.toFixed(2)}</span
                  >
                </div>
                {#if payslipData.professionalTax > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-600">Professional Tax</span>
                    <span class="font-medium"
                      >₹{payslipData.professionalTax.toFixed(2)}</span
                    >
                  </div>
                {/if}
                {#if payslipData.incomeTax > 0}
                  <div class="flex justify-between">
                    <span class="text-gray-600">Income Tax</span>
                    <span class="font-medium"
                      >₹{payslipData.incomeTax.toFixed(2)}</span
                    >
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-md p-6">
        <div class="flex items-center mb-6">
          <h2 class="text-xl font-bold text-gray-800">Detailed Breakdown</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div class="flex items-center mb-4">
              <span class="w-2 h-6 bg-indigo-600 rounded-sm mr-3"></span>
              <h3 class="text-lg font-semibold text-gray-800">Earnings</h3>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between py-2 border-b border-gray-100">
                <span class="text-gray-600">Basic Salary</span>
                <span class="font-medium">₹{payslipData.basic.toFixed(2)}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-100">
                <span class="text-gray-600">HRA</span>
                <span class="font-medium">₹{payslipData.hra.toFixed(2)}</span>
              </div>
              {#if payslipData.da > 0}
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-600">Dearness Allowance</span>
                  <span class="font-medium">₹{payslipData.da.toFixed(2)}</span>
                </div>
              {/if}
              <div class="flex justify-between py-2 border-b border-gray-100">
                <span class="text-gray-600">Other Allowance</span>
                <span class="font-medium"
                  >₹{payslipData.otherAllowance.toFixed(2)}</span
                >
              </div>
              {#if payslipData.overtimePay > 0}
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-600">Overtime Pay</span>
                  <span class="font-medium"
                    >₹{payslipData.overtimePay.toFixed(2)}</span
                  >
                </div>
              {/if}
              {#if payslipData.bonus > 0}
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-600">Bonus</span>
                  <span class="font-medium"
                    >₹{payslipData.bonus.toFixed(2)}</span
                  >
                </div>
              {/if}
              {#if payslipData.reimbursement > 0}
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-600">Reimbursement</span>
                  <span class="font-medium"
                    >₹{payslipData.reimbursement.toFixed(2)}</span
                  >
                </div>
              {/if}
              <div
                class="flex justify-between py-3 bg-indigo-50 rounded-lg px-3 mt-2"
              >
                <span class="font-medium text-gray-800">Gross Salary</span>
                <span class="font-bold text-indigo-600"
                  >₹{payslipData.grossSalary.toFixed(2)}</span
                >
              </div>
            </div>
          </div>

          <div>
            <div class="flex items-center mb-4">
              <span class="w-2 h-6 bg-rose-500 rounded-sm mr-3"></span>
              <h3 class="text-lg font-semibold text-gray-800">Deductions</h3>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between py-2 border-b border-gray-100">
                <span class="text-gray-600">EPF Employee Contribution</span>
                <span class="font-medium"
                  >₹{payslipData.epfEmployee.toFixed(2)}</span
                >
              </div>
              {#if payslipData.professionalTax > 0}
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-600">Professional Tax</span>
                  <span class="font-medium"
                    >₹{payslipData.professionalTax.toFixed(2)}</span
                  >
                </div>
              {/if}
              {#if payslipData.incomeTax > 0}
                <div class="flex justify-between py-2 border-b border-gray-100">
                  <span class="text-gray-600">Income Tax</span>
                  <span class="font-medium"
                    >₹{payslipData.incomeTax.toFixed(2)}</span
                  >
                </div>
              {/if}

              <div
                class="flex justify-between py-3 bg-rose-50 rounded-lg px-3 mt-2"
              >
                <span class="font-medium text-gray-800">Total Deductions</span>
                <span class="font-bold text-rose-600"
                  >₹{payslipData.totalDeductions.toFixed(2)}</span
                >
              </div>
            </div>

            <div
              class="flex justify-between py-4 mt-6 border-t-2 border-gray-200 text-lg"
            >
              <span class="font-bold text-gray-800">Net Salary</span>
              <span class="font-bold text-green-600"
                >₹{payslipData.netSalary.toFixed(2)}</span
              >
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div class="bg-white rounded-2xl shadow-md p-10 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 text-gray-400 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 class="text-xl font-medium text-gray-700 mb-2">
          No Payslip Selected
        </h3>
        <p class="text-gray-500 mb-6">
          Select a month and year to view your payslip details
        </p>
      </div>
    {/if}
  </div>
</div>
