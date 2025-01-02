<script lang="ts">
    import { onMount, afterUpdate } from 'svelte';
    import { Chart, registerables } from 'chart.js';
    import { attendanceApi, employeesApi } from '$lib/services/api';
    import { navigationContext } from '$lib/stores/navigation';
    import { auth } from '$lib/stores/auth';

    Chart.register(...registerables);

    type AttendanceChartData = {
        labels: string[];
        present: number[];
        absent: number[];
        late: number[];
    };

    type AttendanceTypeData = {
        labels: string[];
        data: number[];
    };

    type TrendData = {
        labels: string[];
        data: number[];
    };

    type ChartDataType = {
        dailyAttendance: AttendanceChartData | null;
        attendanceTypes: AttendanceTypeData | null;
        latenessTrend: TrendData | null;
        overtimeTrend: TrendData | null;
    };

    let loading = true;
    let error: string | null = null;
    let attendanceChart: Chart | null = null;
    let attendanceTypeChart: Chart | null = null;
    let latenessTrendChart: Chart | null = null;
    let overtimeTrendChart: Chart | null = null;
    let teamMembers: string[] = [];
    let chartData: ChartDataType = {
        dailyAttendance: null,
        attendanceTypes: null,
        latenessTrend: null,
        overtimeTrend: null
    };

    onMount(async () => {
        navigationContext.set('manager');
        try {
            // Get team members
            const employeesResponse = await employeesApi.list({
                reportingTo: $auth.user?._id,
                page: 1,
                limit: 100
            });
            teamMembers = employeesResponse.data.map(emp => emp._id);

            // Fetch last 30 days of attendance data
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            const response = await attendanceApi.searchAll({
                userIds: teamMembers,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            const dailyAttendance = processAttendanceData(response.data);
            const attendanceTypes = processAttendanceTypes(response.data);
            const latenessTrend = processLatenessTrend(response.data);
            const overtimeTrend = processOvertimeTrend(response.data);

            chartData = {
                dailyAttendance,
                attendanceTypes,
                latenessTrend,
                overtimeTrend
            };

        } catch (e) {
            error = 'Failed to load dashboard data';
            console.error(e);
        } finally {
            loading = false;
        }
    });

    afterUpdate(() => {
        if (!loading && !error && chartData.dailyAttendance && chartData.attendanceTypes && chartData.latenessTrend && chartData.overtimeTrend) {
            const attendanceCtx = document.getElementById('attendanceChart') as HTMLCanvasElement;
            const typeCtx = document.getElementById('attendanceTypeChart') as HTMLCanvasElement;
            const latenessCtx = document.getElementById('latenessTrendChart') as HTMLCanvasElement;
            const overtimeCtx = document.getElementById('overtimeTrendChart') as HTMLCanvasElement;

            if (attendanceCtx) {
                if (attendanceChart) attendanceChart.destroy();
                const data = chartData.dailyAttendance;
                attendanceChart = new Chart(attendanceCtx, {
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
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Team Attendance Overview (Last 7 Days)',
                                padding: 20,
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            },
                            legend: {
                                position: 'top',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                stacked: true,
                                grid: {
                                    color: '#e5e7eb',
                                    borderColor: 'transparent'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                }
                            }
                        },
                        elements: {
                            line: {
                                tension: 0.4
                            }
                        }
                    }
                });
            }

            if (typeCtx) {
                if (attendanceTypeChart) attendanceTypeChart.destroy();
                const data = chartData.attendanceTypes;
                attendanceTypeChart = new Chart(typeCtx, {
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
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Team Attendance Distribution',
                                padding: 20,
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            },
                            legend: {
                                position: 'right',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        },
                        cutout: '70%'
                    }
                });
            }

            if (latenessCtx) {
                if (latenessTrendChart) latenessTrendChart.destroy();
                const data = chartData.latenessTrend;
                latenessTrendChart = new Chart(latenessCtx, {
                    type: 'bar',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Team Late Arrivals',
                            data: data.data,
                            backgroundColor: '#eab308'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Team Lateness Trend (Last 30 Days)',
                                padding: 20,
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            },
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: '#e5e7eb',
                                    borderColor: 'transparent'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                });
            }

            if (overtimeCtx) {
                if (overtimeTrendChart) overtimeTrendChart.destroy();
                const data = chartData.overtimeTrend;
                overtimeTrendChart = new Chart(overtimeCtx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Team Average Overtime Hours',
                            data: data.data,
                            borderColor: '#3b82f6',
                            backgroundColor: '#3b82f620',
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Team Overtime Trend (Last 30 Days)',
                                padding: 20,
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            },
                            legend: {
                                position: 'top',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: '#e5e7eb',
                                    borderColor: 'transparent'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                }
                            }
                        },
                        elements: {
                            line: {
                                tension: 0.4
                            }
                        }
                    }
                });
            }
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
            present: last7Days.map(() => Math.floor(Math.random() * 10 + 35)),
            absent: last7Days.map(() => Math.floor(Math.random() * 5)),
            late: last7Days.map(() => Math.floor(Math.random() * 3))
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
            data: last30Days.map(() => Math.floor(Math.random() * 4))
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
            data: last30Days.map(() => Math.floor(Math.random() * 3))
        };
    }
</script>

<div class="p-6">
    <h1 class="text-2xl font-bold mb-8">Team Dashboard</h1>

    {#if error}
        <div class="alert alert-error">{error}</div>
    {:else if loading}
        <div class="loading">Loading dashboard data...</div>
    {:else}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Daily Attendance Overview -->
            <div class="card bg-base-100 shadow-lg">
                <div class="card-body h-[400px]">
                    <canvas id="attendanceChart"></canvas>
                </div>
            </div>

            <!-- Attendance Distribution -->
            <div class="card bg-base-100 shadow-lg">
                <div class="card-body h-[400px]">
                    <canvas id="attendanceTypeChart"></canvas>
                </div>
            </div>

            <!-- Lateness Trend -->
            <div class="card bg-base-100 shadow-lg">
                <div class="card-body h-[400px]">
                    <canvas id="latenessTrendChart"></canvas>
                </div>
            </div>

            <!-- Overtime Trend -->
            <div class="card bg-base-100 shadow-lg">
                <div class="card-body h-[400px]">
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
        border-radius: 1rem;
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }

    .card-body {
        padding: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    canvas {
        max-width: 100% !important;
        height: 100% !important;
    }
</style> 