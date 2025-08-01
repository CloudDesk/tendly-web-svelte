<script lang="ts">
  import { onMount } from "svelte";
  import { Chart, registerables } from "chart.js";
  import { navigationContext } from "$lib/stores/navigation";
  import type { DashboardMetrics } from "$lib/services/api/admin-dashboard";
  import { format } from "date-fns";

  export let data: { metrics: DashboardMetrics };

  Chart.register(...registerables);

  let departmentChart: Chart | null = null;
  let attendanceChart: Chart | null = null;
  let resignationChart: Chart | null = null;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  onMount(() => {
    navigationContext.set("admin");
    if (data.metrics) {
      console.log('Initializing charts with metrics:', data.metrics);
      initializeCharts();
    } else {
      console.error('No metrics data available');
    }
  });

  function initializeCharts() {


    // Department Chart
    const deptCtx = document.getElementById("departmentChart") as HTMLCanvasElement;
    if (deptCtx && data.metrics.departmentWiseEmployees) {
      if (departmentChart) departmentChart.destroy();
      
      // Check if we have any department data
      if (data.metrics.departmentWiseEmployees.length === 0) {
        // Show empty state
        const ctx = deptCtx.getContext('2d');
        if (ctx) {
          ctx.font = '16px Arial';
          ctx.fillStyle = '#6B7280';
          ctx.textAlign = 'center';
          ctx.fillText('No department data available', deptCtx.width / 2, deptCtx.height / 2);
        }
        return;
      }

      departmentChart = new Chart(deptCtx, {
        type: "bar",
        data: {
          labels: data.metrics.departmentWiseEmployees.map((d, index) => {
            const name = d.departmentName || `Department ${index + 1}`;
            // Clean up department names - remove "Department " prefix and format nicely
            return name.replace('Department ', '').split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
          }),
          datasets: [{
            label: "Employees",
            data: data.metrics.departmentWiseEmployees.map(d => d.count),
            backgroundColor: "#3b82f6",
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Department-wise Employee Distribution",
              padding: 20,
              font: { size: 16, weight: "bold" }
            },
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { display: false }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // Attendance Chart
    const attendanceCtx = document.getElementById("attendanceChart") as HTMLCanvasElement;
    if (attendanceCtx && data.metrics.todayAttendance) {
      if (attendanceChart) attendanceChart.destroy();

      const present = data.metrics.todayAttendance.present || 0;
      const leave = data.metrics.todayAttendance.leave || 0;
      const total = data.metrics.totalEmployees || 0;
      const absent = total - present - leave;

      // Check if we have any meaningful attendance data
      if (total === 0) {
        // Show empty state
        const ctx = attendanceCtx.getContext('2d');
        if (ctx) {
          ctx.font = '16px Arial';
          ctx.fillStyle = '#6B7280';
          ctx.textAlign = 'center';
          ctx.fillText('No attendance data available', attendanceCtx.width / 2, attendanceCtx.height / 2);
        }
        return;
      }

      attendanceChart = new Chart(attendanceCtx, {
        type: "doughnut",
        data: {
          labels: [`Present (${present})`, `On Leave (${leave})`, `Absent (${absent})`],
          datasets: [{
            data: [present, leave, absent],
            backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Today's Attendance",
              padding: 20,
              font: { size: 16, weight: "bold" }
            },
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                  size: 12,
                },
              },
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          cutout: "70%"
        }
      });
    }

    // Resignation Chart
    const resignationCtx = document.getElementById("resignationChart") as HTMLCanvasElement;
    if (resignationCtx && data.metrics.resignationStatus) {
      if (resignationChart) resignationChart.destroy();

      // Check if we have any resignation data
      if (data.metrics.resignationStatus.length === 0) {
        // Show empty state
        const ctx = resignationCtx.getContext('2d');
        if (ctx) {
          ctx.font = '16px Arial';
          ctx.fillStyle = '#6B7280';
          ctx.textAlign = 'center';
          ctx.fillText('No resignation data available', resignationCtx.width / 2, resignationCtx.height / 2);
        }
        return;
      }

      resignationChart = new Chart(resignationCtx, {
        type: "line",
        data: {
          labels: data.metrics.resignationStatus.map(r => r.month),
          datasets: [
            {
              label: "Pending",
              data: data.metrics.resignationStatus.map(r => r.pending),
              borderColor: "#f59e0b",
              backgroundColor: "#f59e0b20",
              fill: true
            },
            {
              label: "Approved",
              data: data.metrics.resignationStatus.map(r => r.approved),
              borderColor: "#22c55e",
              backgroundColor: "#22c55e20",
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Resignation Trends",
              padding: 20,
              font: { size: 16, weight: "bold" }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { display: false }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }
  }


</script>

<div class="p-6 bg-gray-50 min-h-screen">
  <div class="max-w-7xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

    {#if data?.metrics}
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Total Employees -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm font-medium">Total Employees</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{data.metrics.totalEmployees}</p>
              {#if data.metrics.totalEmployees === 0}
                <p class="text-sm text-gray-500 mt-1">No employees found</p>
              {/if}
            </div>
            <div class="bg-blue-50 p-3 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Pending Approvals -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm font-medium">Pending Approvals</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{data.metrics.pendingApprovals.total || 0}</p>
              <div class="flex gap-4 mt-2">
                <span class="text-xs text-gray-500">Leaves: {data.metrics.pendingApprovals.leaves || 0}</span>
                <span class="text-xs text-gray-500">Regularizations: {data.metrics.pendingApprovals.regularizations || 0}</span>
              </div>
              {#if data.metrics.pendingApprovals.total === 0}
                <p class="text-sm text-gray-500 mt-1">No pending approvals</p>
              {/if}
            </div>
            <div class="bg-yellow-50 p-3 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Payroll Processed -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm font-medium">Payroll Processed</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.metrics.payrollProcessed.amount || 0)}</p>
              <p class="text-sm text-gray-500 mt-1">For {data.metrics.payrollProcessed.count || 0} employees</p>
              {#if data.metrics.payrollProcessed.amount === 0}
                <p class="text-sm text-gray-500 mt-1">No payroll processed</p>
              {/if}
            </div>
            <div class="bg-green-50 p-3 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Department Distribution -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="h-[400px]">
            <canvas id="departmentChart"></canvas>
          </div>
        </div>

        <!-- Today's Attendance -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="h-[400px]">
            <canvas id="attendanceChart"></canvas>
          </div>
        </div>

        <!-- Upcoming Holidays -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Upcoming Holidays</h3>
          <div class="space-y-4">
            {#each data.metrics.upcomingHolidays as holiday}
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p class="font-medium text-gray-900">{holiday.name}</p>
                  {#if holiday.description}
                    <p class="text-sm text-gray-500">{holiday.description}</p>
                  {/if}
                </div>
                <p class="text-sm font-medium text-gray-600">
                  {format(new Date(holiday.date), 'MMM dd, yyyy')}
                </p>
              </div>
            {/each}
          </div>
        </div>

        <!-- Resignation Trends -->
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="h-[400px]">
            <canvas id="resignationChart"></canvas>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(canvas) {
    max-width: 100% !important;
    height: 100% !important;
  }
</style>
