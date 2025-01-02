<script lang="ts">
    import { onMount } from 'svelte';
    import { trainingAttendanceApi } from '$lib/services/api';

    export let employeeId: string | null = null;
    export let employeeIds: string[] = [];
    export let mode: 'single' | 'multi' = 'single';

    let loading = true;
    let error: string | null = null;

    type TrainingAttendanceRecord = {
      trainingDay: string;
      trainingCode: string;
      status: 'present' | 'absent' | 'missing_checkout' | 'holiday' | 'weekend';
      overtime: string;
      shortTime: string;
      firstSwipe: string;
      lastSwipe: string;
      attendanceStatus: string[];
    };

    type TrainingAttendanceSummary = {
      totalDays: number;
      lateDays: number;
      presentDays: number;
      regularisedDays: number;
      leaveDays: number;
    };

    type TrainingAttendanceResponse = {
      userId: string;
      userName: string;
      records: TrainingAttendanceRecord[];
      summary: TrainingAttendanceSummary;
    };

    let trainingAttendanceData: TrainingAttendanceResponse[] = [];
    
    // Set default date range to current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let startDate: string = firstDayOfMonth.toISOString().split('T')[0];
    let endDate: string = today.toISOString().split('T')[0];

    const toUTCString = (dateStr: string) => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    };

    const toEndOfDayUTCString = (dateStr: string) => {
        const date = new Date(dateStr);
        date.setHours(23, 59, 59, 999);
        return date.toISOString();
    };

    const getDatesInRange = (startDate: string, endDate: string) => {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    }
    let datesInRange: string[] = [];
    async function fetchAttendance() {
        loading = true;
        datesInRange = getDatesInRange(startDate, endDate);
        try {
            if(mode === 'single') {
                const response = await trainingAttendanceApi.search({
                    userIds: [employeeId || ''],
                    startDate: toUTCString(startDate),
                    endDate: toEndOfDayUTCString(endDate)
                });
                trainingAttendanceData = response.data;
                return;
            }else{
                const response = await trainingAttendanceApi.searchAll({ 
                    startDate: toUTCString(startDate),
                    endDate: toEndOfDayUTCString(endDate)
                });
                trainingAttendanceData = response.data;
                return;
            }
            
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
    onMount(fetchAttendance);
</script>

<div class="attendance-section">
    <div class="date-picker">
        <label for="start-date">Start Date:</label>
        <input type="date" id="start-date" bind:value={startDate} on:change={fetchAttendance} />
        <label for="end-date">End Date:</label>
        <input type="date" id="end-date" bind:value={endDate} on:change={fetchAttendance} />
    </div>

    {#if loading}
        <div class="loading">Loading attendance data...</div>
    {:else if error}
        <div class="alert alert-error">{error}</div>
    {:else if trainingAttendanceData.length > 0}
            {#if mode === 'single'}
        {#each trainingAttendanceData as data}

                <div class="mb-8">
                    <div class="summary">
                        <div class="stat">
                            <span class="label">Total Days</span>
                        <span class="value">{data.summary.totalDays}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Present</span>
                        <span class="value">{data.summary.presentDays}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Late</span>
                        <span class="value">{data.summary.lateDays}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Regularised</span>
                        <span class="value">{data.summary.regularisedDays}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Leave</span>
                        <span class="value">{data.summary.leaveDays}</span>
                    </div>
                </div>

                <table class="attendance-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Shift</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Status</th>
                            <th>Over/Short Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.records as record}
                            <tr class:late={record.attendanceStatus.includes('Late')}>
                                <td>{new Date(record.trainingDay).toLocaleDateString()}</td>
                                <td>{record.trainingCode}</td>
                                <td>{new Date(record.firstSwipe).toLocaleTimeString()}</td>
                                <td>{record.lastSwipe !== record.firstSwipe ? new Date(record.lastSwipe).toLocaleTimeString() : '-'}</td>
                                <td>
                                    <div class="flex flex-col gap-1">
                                        <span class="capitalize">{record.status.replace('_', ' ')}</span>
                                        {#if record.attendanceStatus.length > 0}
                                            <span class="text-xs text-error">{record.attendanceStatus.join(', ')}</span>
                                        {/if}
                                    </div>
                                </td>
                                <td>
                                    {#if record.overtime !== '0:00:00'}
                                        <span class="text-success">+{record.overtime}</span>
                                    {:else if record.shortTime !== '0:00:00'}
                                        <span class="text-error">-{record.shortTime}</span>
                                    {:else}
                                        -
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/each}

            {:else}
                <div class="mb-8">
                    <div class="table-container">
                        <table class="attendance-table">
                            <thead>
                                <tr>
                                    <th class="sticky-col">Name</th>
                                    {#each datesInRange as dt}
                                        <th>{new Date(dt).toLocaleDateString()}</th>
                                    {/each}
                                </tr>
                            </thead>
                            <tbody>
                                {#each trainingAttendanceData as data}
                                    <tr>
                                        <td class="sticky-col">{data.userName}</td>
                                        {#each datesInRange as dt}
                                            {@const record = data.records.find(r => r.trainingDay.substring(0, 10) === dt.substring(0, 10))}
                                            <td>
                                                <div class="relative group">
                                                    <div class="attendance-card {record ? record.status : 'empty'} {record?.attendanceStatus?.includes('Late') ? 'late' : ''}">
                                                        {#if record}
                                                            <div class="training-code">{record.trainingCode}</div>
                                                            {#if record.attendanceStatus.length > 0}
                                                                <div class="status-badges">
                                                                    {#each record.attendanceStatus as status}
                                                                        <span class="badge badge-sm">{status}</span>
                                                                    {/each}
                                                                </div>
                                                            {/if}
                                                            {#if record.overtime !== '0:00:00'}
                                                                <span class="text-xs text-success">+{record.overtime}</span>
                                                            {:else if record.shortTime !== '0:00:00'}
                                                                <span class="text-xs text-error">-{record.shortTime}</span>
                                                            {/if}
                                                            <div class="tooltip">
                                                                <div class="text-xs">
                                                                    <div>In: {new Date(record.firstSwipe).toLocaleTimeString()}</div>
                                                                    <div>Out: {new Date(record.lastSwipe).toLocaleTimeString()}</div>
                                                                </div>
                                                            </div>
                                                        {:else}
                                                            -
                                                        {/if}
                                                    </div>
                                                </div>
                                            </td>
                                        {/each}
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            {/if}
    {:else}
        <div class="alert alert-info">No attendance records found for the selected period.</div>
    {/if}
</div>

<style>
    .attendance-section {
        padding: 1rem;
    }

    .date-picker {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        align-items: center;
    }

    .date-picker label {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .date-picker input {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
    }

    .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat {
        background: #f3f4f6;
        padding: 1rem;
        border-radius: 0.5rem;
        text-align: center;
    }

    .stat .label {
        display: block;
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
    }

    .stat .value {
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
    }

    .attendance-table {
        max-width: 100%;
        border-collapse: collapse;
    }

    .attendance-table th,
    .attendance-table td {
        padding: 0.75rem 0.5rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
        min-width: 100%;
    }

    .attendance-table th {
        background: #f9fafb;
        font-weight: 500;
        color: #374151;
        white-space: nowrap;
        padding: 0.75rem;
        font-size: 0.875rem;
    }

    .attendance-table th.sticky-col,
    .attendance-table td.sticky-col {
        min-width: 150px;
        max-width: 150px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-left: 1rem;
    }

    .late {
        background: #fff1f2;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }

    .attendance-card {
        padding: 0.25rem;
        border-radius: 0.25rem;
        height: 3.5rem;
        width: 110px;
        max-width: 110px;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        margin: 0 auto;
        margin-left: 20px;
    }

    .attendance-card.present {
        background-color: #dcfce7;
        border: 1px solid #86efac;
    }

    .attendance-card.absent {
        background-color: #fee2e2;
        border: 1px solid #fca5a5;
    }

    .attendance-card.missing_checkout {
        background-color: #fef3c7;
        border: 1px solid #fcd34d;
    }

    .attendance-card.holiday {
        background-color: #e0f2fe;
        border: 1px solid #7dd3fc;
    }

    .attendance-card.weekend {
        background-color: #f3f4f6;
        border: 1px solid #d1d5db;
    }

    .attendance-card.empty {
        background-color: #f9fafb;
        color: #9ca3af;
        border: 1px dashed #e5e7eb;
    }

    .attendance-card.late {
        border: 2px solid #f87171;
    }

    .status-badges {
        position: absolute;
        top: 1px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.125rem;
        width: 95%;
        padding: 0 0.125rem;
    }

    .badge {
        padding: 0.5rem;
        border-radius: 0.25rem;
        background-color: rgba(0, 0, 0, 0.1);
        font-size: 0.875rem;
        line-height: 1;
        white-space: nowrap;
    }

    .attendance-card > .text-xs {
        font-size: 0.625rem;
    }

    .tooltip {
        display: none;
        position: absolute;
        background-color: #1f2937;
        color: white;
        padding: 0.5rem;
        border-radius: 0.25rem;
        z-index: 50;
        white-space: nowrap;
        top: -100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 0.25rem;
    }

    .attendance-card:hover .tooltip {
        display: block;
    }

    .tooltip::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 0.25rem;
        border-style: solid;
        border-color: transparent transparent #1f2937 transparent;
    }

    .table-container {
        width: 75vw;
        margin: 0 auto;
        overflow-x: auto;
        position: relative;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
    }

    .sticky-col {
        position: sticky;
        left: 0;
        background: #fff;
        z-index: 10;
        border-right: 2px solid #e5e7eb;
    }

    .attendance-table th.sticky-col {
        background: #f9fafb;
    }

    /* Add smooth scrolling */
    .table-container {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
    }

    /* Style the scrollbar */
    .table-container::-webkit-scrollbar {
        height: 8px;
    }

    .table-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    .table-container::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
    }

    .table-container::-webkit-scrollbar-thumb:hover {
        background: #666;
    }

    .training-code {
        position: absolute;
        left: -20px;
        top: 50%;
        transform: translateY(-50%) rotate(-90deg);
        font-size: 0.625rem;
        white-space: nowrap;
        color: #4b5563;
        background: rgba(255, 255, 255, 0.9);
        padding: 2px 4px;
        border-radius: 4px;
        border: 1px solid #e5e7eb;
    }
</style>