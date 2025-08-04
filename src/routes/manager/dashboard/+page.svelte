<script lang="ts">
  import { onMount } from "svelte";
  import { Chart, registerables } from "chart.js";
  import { navigationContext } from "$lib/stores/navigation";
  import { auth } from "$lib/stores/auth";
  import { goto } from "$app/navigation";
  import { 
    Users, 
    CalendarX, 
    Clock, 
    AlertCircle
  } from "lucide-svelte";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import DashboardCard from "$lib/components/common/DashboardCard.svelte";
  import ChartCard from "$lib/components/common/ChartCard.svelte";

  Chart.register(...registerables);

  export let data: { 
    dashboardData: any; 
    error?: string; 
  };

  let attendanceChart: Chart | null = null;
  let attendanceStatusChart: Chart | null = null;

  // Mock data for development - replace with actual API data
  const mockDashboardData = {
    teamOverview: {
      totalEmployees: 24,
      employeesOnLeaveToday: 3,
      pendingApprovals: 7
    },
    attendanceSummary: {
      present: 18,
      onLeave: 3,
      absent: 2,
      unknown: 1,
      total: 24
    },
    attendanceStatus: {
      onTime: 15,
      late: 3,
      earlyExit: 0
    },
    pendingApprovals: {
      leaves: 4,
      regularizations: 2,
      overtime: 1,
      resignations: 0
    }
  };

  const dashboardData = data.dashboardData || mockDashboardData;

  onMount(() => {
    navigationContext.set("manager");
    initializeCharts();
  });

  function initializeCharts() {
    // Attendance Summary Chart (Present, On Leave, Unknown)
    const attendanceCtx = document.getElementById("attendanceChart") as HTMLCanvasElement;
    if (attendanceCtx) {
      if (attendanceChart) attendanceChart.destroy();
      
      attendanceChart = new Chart(attendanceCtx, {
        type: "doughnut",
        data: {
          labels: ["Present", "On Leave", "Absent", "Check-in or Missing-Checkout"],
          datasets: [{
            data: [
              dashboardData.attendanceSummary.present,
              dashboardData.attendanceSummary.onLeave,
              dashboardData.attendanceSummary.absent,
              dashboardData.attendanceSummary.unknown
            ],
            backgroundColor: [
              "#10B981", // Green for present
              "#3B82F6", // Blue for on leave
              "#EF4444", // Red for absent
              "#6B7280"  // Gray for unknown
            ],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                  size: 12,
                  weight: "500"
                }
              }
            },
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              titleColor: "#fff",
              bodyColor: "#fff",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true
            }
          },
          cutout: "65%"
        }
      });
    }

    // Attendance Status Chart (On Time, Late)
    const statusCtx = document.getElementById("attendanceStatusChart") as HTMLCanvasElement;
    if (statusCtx) {
      if (attendanceStatusChart) attendanceStatusChart.destroy();
      
      attendanceStatusChart = new Chart(statusCtx, {
        type: "bar",
        data: {
          labels: ["On Time", "Late", "Early Exit"],
          datasets: [{
            label: "Employees",
            data: [
              dashboardData.attendanceStatus.onTime,
              dashboardData.attendanceStatus.late,
              dashboardData.attendanceStatus.earlyExit
            ],
            backgroundColor: [
              "#10B981", // Green for on time
              "#F59E0B", // Yellow for late
              "#8B5CF6"  // Purple for early exit
            ],
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              titleColor: "#fff",
              bodyColor: "#fff",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderWidth: 1,
              cornerRadius: 8
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: false
              },
              ticks: {
                stepSize: 1,
                font: {
                  size: 12
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 12,
                  weight: "500"
                }
              }
            }
          }
        }
      });
    }
  }

  // Format numbers with proper spacing
  function formatNumber(num: number): string {
    return num.toLocaleString();
  }

  // Calculate percentage
  function calculatePercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  // Handle card clicks
  function handleCardClick(type: string) {
    console.log(`Card clicked: ${type}`);
    
    switch (type) {
      case 'employees':
        goto('/manager/employees');
        break;
      case 'leaves':
        goto('/manager/leaves');
        break;
      case 'approvals':
        goto('/manager/actions');
        break;
      default:
        console.log(`No navigation defined for: ${type}`);
    }
  }
</script>

<IndexPageTemplate
  title="Manager Dashboard"
  subtitle="Monitor your team's performance and manage requests"
>
  {#if data.error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <AlertCircle class="w-5 h-5 text-red-500 mr-2" />
        <span class="text-red-700">{data.error}</span>
      </div>
    </div>
  {/if}

  <!-- Debug Info (Development Only) -->
  {#if import.meta.env.DEV}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <span class="text-blue-700 text-sm">
          <strong>Manager ID:</strong> {$auth.user?._id || 'Not available'} | 
          <strong>Name:</strong> {$auth.user?.name || 'Not available'} | 
          <strong>Role:</strong> {$auth.user?.role || 'Not available'}
        </span>
      </div>
    </div>
  {/if}

  <!-- Header Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <DashboardCard
      title="Total Employees"
      value={formatNumber(dashboardData.teamOverview.totalEmployees)}
      subtitle="Under your management"
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
      title="On Leave Today"
      value={formatNumber(dashboardData.teamOverview.employeesOnLeaveToday)}
      subtitle="{calculatePercentage(dashboardData.teamOverview.employeesOnLeaveToday, dashboardData.teamOverview.totalEmployees)}% of team"
      icon={CalendarX}
      bgColor="bg-orange-500"
      gradientFrom="from-orange-50"
      gradientTo="to-orange-100"
      borderColor="border-orange-200"
      textColor="text-orange-600"
      valueColor="text-orange-900"
      clickable={false}
    />

    <DashboardCard
      title="Pending Approvals"
      value={formatNumber(dashboardData.teamOverview.pendingApprovals)}
      subtitle="Requires your attention"
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
  </div>

  <!-- Charts Section -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <ChartCard
      title="Team Attendance Today"
      subtitle="Current day overview"
      legendItems={[
        { label: "Present", color: "#10B981" },
        { label: "On Leave", color: "#3B82F6" }
      ]}
    >
      <canvas id="attendanceChart"></canvas>
      
      <svelte:fragment slot="footer">
        <div class="mt-4 grid grid-cols-2 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{dashboardData.attendanceSummary.present}</p>
            <p class="text-xs text-gray-500">Present</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-600">{dashboardData.attendanceSummary.onLeave}</p>
            <p class="text-xs text-gray-500">On Leave</p>
          </div>
        </div>
      </svelte:fragment>
    </ChartCard>

    <ChartCard
      title="Attendance Status"
      subtitle="On time vs late arrivals"
      legendItems={[
        { label: "On Time", color: "#10B981" },
        { label: "Late", color: "#F59E0B" }
      ]}
    >
      <canvas id="attendanceStatusChart"></canvas>
      
      <svelte:fragment slot="footer">
        <div class="mt-4 grid grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{dashboardData.attendanceStatus.onTime}</p>
            <p class="text-xs text-gray-500">On Time</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-yellow-600">{dashboardData.attendanceStatus.late}</p>
            <p class="text-xs text-gray-500">Late</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-purple-600">{dashboardData.attendanceStatus.earlyExit}</p>
            <p class="text-xs text-gray-500">Early Exit</p>
          </div>
        </div>
      </svelte:fragment>
    </ChartCard>
  </div>
</IndexPageTemplate>

<style>
  /* Custom styles for better visual appeal */
  .bg-gradient-to-br {
    background: linear-gradient(to bottom right, var(--tw-gradient-stops));
  }
  
  /* Smooth transitions */
  .transition-shadow {
    transition: box-shadow 0.2s ease-in-out;
  }
  
  /* Chart container styling */
  canvas {
    max-height: 100%;
  }
</style>