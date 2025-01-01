<script lang="ts">
    import { onMount } from 'svelte';
    import { api } from '$lib/services/api';

    export let employeeId: string;
    let loading = true;
    let error: string | null = null;

    type AttendanceSummary = {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      records: Array<{
        date: string;
        checkIn: string;
        checkOut: string;
        isLate: boolean;
        status: 'present' | 'absent' | 'holiday' | 'weekend'
      }>;
    };

    let attendanceSummary: AttendanceSummary | null = null;
    
    // Set default date range to current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let startDate: string = firstDayOfMonth.toISOString().split('T')[0];
    let endDate: string = today.toISOString().split('T')[0];

    const toUTCString = (dateStr: string) => {
        // Create date object in local timezone
        const date = new Date(dateStr);
        // Set time to start of day (midnight) in local timezone
        date.setHours(0, 0, 0, 0);
        // Convert to UTC ISO string
        return date.toISOString();
    };

    const toEndOfDayUTCString = (dateStr: string) => {
        // Create date object in local timezone
        const date = new Date(dateStr);
        // Set time to end of day in local timezone
        date.setHours(23, 59, 59, 999);
        // Convert to UTC ISO string
        return date.toISOString();
    };

    async function fetchAttendance() {
        loading = true;
        try {
            const attendanceResponse = await api.attendance.search({ 
                userIds: [employeeId],
                startDate: toUTCString(startDate),
                endDate: toEndOfDayUTCString(endDate)
            });
            attendanceSummary = attendanceResponse.data;
            console.log(attendanceSummary);
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
        <div class="error">{error}</div>
    {:else if attendanceSummary}
        <div class="summary">
            <div class="stat">
                <span class="label">Total Days</span>
                <span class="value">{attendanceSummary.totalDays}</span>
            </div>
            <div class="stat">
                <span class="label">Present</span>
                <span class="value">{attendanceSummary.presentDays}</span>
            </div>
            <div class="stat">
                <span class="label">Absent</span>
                <span class="value">{attendanceSummary.absentDays}</span>
            </div>
            <div class="stat">
                <span class="label">Late</span>
                <span class="value">{attendanceSummary.lateDays}</span>
            </div>
        </div>

        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {#each attendanceSummary.records as record}
                    <tr class:late={record.isLate}>
                        <td>{record.shiftDay}</td>
                        <td>{record.firstSwipe}</td>
                        <td>{record.lastSwipe}</td>
                        <td>{record.status}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
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
        width: 100%;
        border-collapse: collapse;
    }

    .attendance-table th,
    .attendance-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
    }

    .attendance-table th {
        background: #f9fafb;
        font-weight: 500;
        color: #374151;
    }

    .late {
        background: #fff1f2;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }

    .error {
        text-align: center;
        padding: 1rem;
        color: #991b1b;
        background: #fee2e2;
        border-radius: 0.5rem;
    }
</style>