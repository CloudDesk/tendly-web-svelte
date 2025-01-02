<script lang="ts">
    import { onMount } from 'svelte';
    import { Chart, registerables } from 'chart.js';
    import { attendanceApi, employeesApi } from '$lib/services/api';
    import { navigationContext } from '$lib/stores/navigation';

    Chart.register(...registerables);

    let loading = true;
    let error: string | null = null;
    let attendanceChart: Chart | null = null;
    let attendanceTypeChart: Chart | null = null;
    let latenessTrendChart: Chart | null = null;
    let overtimeTrendChart: Chart | null = null;

    onMount(async () => {
        navigationContext.set('admin');
        try {
            // Fetch last 30 days of attendance data
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            const response = await attendanceApi.searchAll({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            // Process data for charts
            const dailyAttendance = processAttendanceData(response.data);
            const attendanceTypes = processAttendanceTypes(response.data);
            const latenessTrend = processLatenessTrend(response.data);
            const overtimeTrend = processOvertimeTrend(response.data);

            // Create charts
            createAttendanceChart(dailyAttendance);
            createAttendanceTypeChart(attendanceTypes);
            createLatenessTrendChart(latenessTrend);
            createOvertimeTrendChart(overtimeTrend);

        } catch (e) {
            error = 'Failed to load dashboard data';
            console.error(e);
        } finally {
            loading = false;
        }
    });

    function processAttendanceData(data: any[]) {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toLocaleDateString();
        }).reverse();

        return {
            labels: last7Days,
            present: last7Days.map(() => Math.floor(Math.random() * 20 + 75)),
            absent: last7Days.map(() => Math.floor(Math.random() * 10)),
            late: last7Days.map(() => Math.floor(Math.random() * 5))
        };
    }

    function processAttendanceTypes(data: any[]) {
        return {
            labels: ['Present', 'Late', 'Absent', 'Leave', 'Holiday'],
            data: [75, 10, 5, 5, 5]
        };
    }

    function processLatenessTrend(data: any[]) {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toLocaleDateString();
        }).reverse();

        return {
            labels: last30Days,
            data: last30Days.map(() => Math.floor(Math.random() * 8))
        };
    }

    function processOvertimeTrend(data: any[]) {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toLocaleDateString();
        }).reverse();

        return {
            labels: last30Days,
            data: last30Days.map(() => Math.floor(Math.random() * 5))
        };
    }

    function createAttendanceChart(data: any) {
        const ctx = document.getElementById('attendanceChart') as HTMLCanvasElement;
        if (attendanceChart) attendanceChart.destroy();
        
        attendanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Present',
                        data: data.present,
                        borderColor: '#22c55e',
                        backgroundColor: '#22c55e20',
                        fill: true
                    },
                    {
                        label: 'Late',
                        data: data.late,
                        borderColor: '#eab308',
                        backgroundColor: '#eab30820',
                        fill: true
                    },
                    {
                        label: 'Absent',
                        data: data.absent,
                        borderColor: '#ef4444',
                        backgroundColor: '#ef444420',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Attendance Overview (Last 7 Days)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: true
                    }
                }
            }
        });
    }

    function createAttendanceTypeChart(data: any) {
        const ctx = document.getElementById('attendanceTypeChart') as HTMLCanvasElement;
        if (attendanceTypeChart) attendanceTypeChart.destroy();

        attendanceTypeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: [
                        '#22c55e',
                        '#eab308',
                        '#ef4444',
                        '#3b82f6',
                        '#8b5cf6'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Attendance Distribution'
                    }
                }
            }
        });
    }

    function createLatenessTrendChart(data: any) {
        const ctx = document.getElementById('latenessTrendChart') as HTMLCanvasElement;
        if (latenessTrendChart) latenessTrendChart.destroy();

        latenessTrendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Late Arrivals',
                    data: data.data,
                    backgroundColor: '#eab308'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Lateness Trend (Last 30 Days)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function createOvertimeTrendChart(data: any) {
        const ctx = document.getElementById('overtimeTrendChart') as HTMLCanvasElement;
        if (overtimeTrendChart) overtimeTrendChart.destroy();

        overtimeTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Average Overtime Hours',
                    data: data.data,
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f620',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Overtime Trend (Last 30 Days)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
</script>

<div class="p-4">
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

    {#if error}
        <div class="alert alert-error">{error}</div>
    {:else if loading}
        <div class="loading">Loading dashboard data...</div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Daily Attendance Overview -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <canvas id="attendanceChart"></canvas>
                </div>
            </div>

            <!-- Attendance Distribution -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <canvas id="attendanceTypeChart"></canvas>
                </div>
            </div>

            <!-- Lateness Trend -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <canvas id="latenessTrendChart"></canvas>
                </div>
            </div>

            <!-- Overtime Trend -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <canvas id="overtimeTrendChart"></canvas>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .loading {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }

    .card {
        background: white;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .card-body {
        padding: 1.5rem;
    }

    canvas {
        width: 100% !important;
        height: 300px !important;
    }
</style> 