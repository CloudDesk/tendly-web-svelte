<script lang="ts">
    import { onMount } from 'svelte';
    import { api } from '$lib/services/api';
    import type { User } from '$lib/types';

    export let employeeId: string;
    let user: User | null = null;
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            const response = await api.employees.getById(employeeId);
            user = response.data;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    });
</script>

<div class="details-section">
    {#if loading}
        <div class="loading">Loading employee details...</div>
    {:else if error}
        <div class="error">{error}</div>
    {:else if user}
        <div class="details-grid">
            <div class="detail-item">
                <span class="label">Email</span>
                <span class="value">{user.email}</span>
            </div>
            <div class="detail-item">
                <span class="label">Department</span>
                <span class="value">{user.departmentId}</span>
            </div>
            <div class="detail-item">
                <span class="label">Joining Date</span>
                <span class="value">{user.joiningDate}</span>
            </div>
            {#if user.phone}
                <div class="detail-item">
                    <span class="label">Phone</span>
                    <span class="value">{user.phone}</span>
                </div>
            {/if}
            {#if user.location}
                <div class="detail-item">
                    <span class="label">Location</span>
                    <span class="value">{user.location}</span>
                </div>
            {/if}
            {#if user.emergencyContact}
                <div class="detail-item">
                    <span class="label">Emergency Contact</span>
                    <span class="value">{user.emergencyContact}</span>
                </div>
            {/if}
            {#if user.address}
                <div class="detail-item">
                    <span class="label">Address</span>
                    <span class="value">{user.address}</span>
                </div>
            {/if}
            {#if user.bloodGroup}
                <div class="detail-item">
                    <span class="label">Blood Group</span>
                    <span class="value">{user.bloodGroup}</span>
                </div>
            {/if}
            {#if user.dateOfBirth}
                <div class="detail-item">
                    <span class="label">Date of Birth</span>
                    <span class="value">{user.dateOfBirth}</span>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .details-section {
        padding: 1rem;
    }

    .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .detail-item {
        background: #f9fafb;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }

    .label {
        display: block;
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
    }

    .value {
        font-size: 1rem;
        color: #111827;
        font-weight: 500;
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