<script lang="ts">
    import { onMount } from 'svelte';
    import { employeesApi } from '$lib/services/api';
    import type { User } from '$lib/types/user';

    export let trainingId: string;
    export let startDate: string;
     
    
    let loading = true;
    let error: string | null = null;
    let employees: User[] = [];
    let selectedDate = new Date().toISOString().split('T')[0];
    let attendanceStatus: Record<string, boolean> = {};

    // Generate dates from training start till today
    const getDatesArray = (startDate: string): string[] => {
        const dates: string[] = [];
        if(!startDate) {
            let currentDate = new Date();
            currentDate.setDate(currentDate.getDate() - 7); 
            startDate = currentDate.toISOString().split('T')[0];
        }
            
        const start = new Date(startDate);
        const today = new Date();
        
        for (let date = start; date <= today; date.setDate(date.getDate() + 1)) {
            dates.push(date.toISOString().split('T')[0]);
        }
        console.log(dates);
        return dates;
    };

    const dates = getDatesArray(startDate);

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    async function loadEmployees() {
        try {
            loading = true;
            const response = await employeesApi.list({ limit: 100 });
            console.log(response);
            employees = response.data as unknown as User[];
            
            // Initialize attendance status
            employees.forEach(emp => {
                attendanceStatus[emp._id] = false;
            });
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    function handleAttendanceChange(employeeId: string, value: boolean) {
        attendanceStatus[employeeId] = value;
    }

    onMount(loadEmployees);
</script>

<div class="space-y-6">
    <!-- Date Tabs -->
    <div class="tabs-container">
        <div class="tabs tabs-boxed flex overflow-x-auto">
            {#each dates as date}
                <button 
                    class="tab whitespace-nowrap {selectedDate === date ? 'tab-active' : ''}"
                    on:click={() => selectedDate = date}
                >
                    {formatDate(date)}
                </button>
            {/each}
        </div>
    </div>

    <!-- Attendance List -->
    {#if loading}
        <div class="loading">Loading employees...</div>
    {:else if error}
        <div class="alert alert-error">{error}</div>
    {:else}
        <div class="overflow-x-auto">
            <table class="table w-full">
                <thead>
                    <tr>
                        <th>Employee Name</th>
                        <th>Role</th>
                        <th>Attendance</th>
                    </tr>
                </thead>
                <tbody>
                    {#each employees as employee}
                        <tr>
                            <td>{employee.name}</td>
                            <td>{employee.roleId}</td>
                            <td>
                                <label class="label cursor-pointer justify-start gap-2">
                                    <input 
                                        type="checkbox"
                                        class="toggle toggle-success"
                                        checked={attendanceStatus[employee._id]}
                                        on:change={(e) => handleAttendanceChange(employee._id, e.currentTarget.checked)}
                                    />
                                    <span class="label-text">
                                        {attendanceStatus[employee._id] ? 'Present' : 'Absent'}
                                    </span>
                                </label>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<!-- <style>
    .tabs-container {
        @apply -mx-6 px-6 py-2 bg-base-200 border-y border-base-300;
    }

    .tabs {
        @apply -mx-1 pb-1;
        scrollbar-width: none;
    }

    .tabs::-webkit-scrollbar {
        display: none;
    }

    .tab {
        @apply min-w-fit;
    }

    .loading {
        @apply flex justify-center items-center p-8 text-neutral-500;
    }
</style>  -->