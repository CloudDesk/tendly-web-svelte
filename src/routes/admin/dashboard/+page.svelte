<script lang="ts">
  import { onMount } from "svelte";
  import { Chart, registerables } from "chart.js";
  import { navigationContext } from "$lib/stores/navigation";
  import type { DashboardMetrics } from "$lib/services/api/admin-dashboard";
  import { format } from "date-fns";
  import { goto } from "$app/navigation";
  import { 
    Users, 
    Clock, 
    IndianRupee
  } from "lucide-svelte";
  import DashboardCard from "$lib/components/common/DashboardCard.svelte";

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

  // Format numbers with proper spacing
  function formatNumber(num: number): string {
    return num.toLocaleString();
  }

  // Handle card clicks
  function handleCardClick(type: string) {
    console.log(`Card clicked: ${type}`);
    
    switch (type) {
      case 'employees':
        goto('/admin/employees');
        break;
      case 'approvals':
        // TODO: Navigate to approvals page when available
        console.log('Approvals navigation not implemented yet');
        break;
      case 'payroll':
        goto('/admin/payroll');
        break;
      default:
        console.log(`Navigation for ${type} not implemented`);
    }
  }

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
      <!-- Header Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          title="Total Employees"
          value={formatNumber(data.metrics.totalEmployees)}
          subtitle="Across all departments"
          icon={Users}
          bgColor="bg-blue-500"
          gradientFrom="from-blue-50"
          gradientTo="to-blue-100"
          borderColor="border-blue-200"
          textColor="text-blue-600"
          valueColor="text-blue-900"
          clickable={true}
          on:click={() => handleCardClick('employees')}
        />

        <DashboardCard
          title="Pending Approvals"
          value={formatNumber(data.metrics.pendingApprovals.total || 0)}
          subtitle="Leaves: {data.metrics.pendingApprovals.leaves || 0} | Regularizations: {data.metrics.pendingApprovals.regularizations || 0}"
          icon={Clock}
          bgColor="bg-purple-500"
          gradientFrom="from-purple-50"
          gradientTo="to-purple-100"
          borderColor="border-purple-200"
          textColor="text-purple-600"
          valueColor="text-purple-900"
          clickable={true}
          on:click={() => handleCardClick('approvals')}
        />

        <DashboardCard
          title="Payroll Processed"
          value="₹{formatNumber(data.metrics.payrollProcessed.amount || 0)}"
          subtitle="For {data.metrics.payrollProcessed.count || 0} employees"
          icon={IndianRupee}
          bgColor="bg-green-500"
          gradientFrom="from-green-50"
          gradientTo="to-green-100"
          borderColor="border-green-200"
          textColor="text-green-600"
          valueColor="text-green-900"
          clickable={true}
          on:click={() => handleCardClick('payroll')}
        />
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
