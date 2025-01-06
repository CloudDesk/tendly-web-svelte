<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { trainingsApi } from '$lib/services/api';
    import Tabs from '$lib/components/common/Tabs.svelte';
    import TrainingDetails from '$lib/components/training/TrainingDetails.svelte';
    import TrainingAttendance from '$lib/components/training/TrainingAttendance.svelte';
    import TrainingMaterials from '$lib/components/training/TrainingMaterials.svelte';

    const trainingId = $page.params.id;
    let loading = true;
    let error: string | null = null;
    let training: any = null;

    const tabs = [
        { id: 'info', label: 'Training Info' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'materials', label: 'Materials' }
    ];

    onMount(async () => {
        try {
            const response = await trainingsApi.getById(trainingId);
            training = response.data;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    });
</script>

<div class="space-y-6">
    {#if loading}
        <div class="loading">Loading training details...</div>
    {:else if error}
        <div class="alert alert-error">{error}</div>
    {:else if training}
        <header class="flex justify-between items-center">
            <h2 class="text-2xl font-bold">{training.title}</h2>
            <div class="flex gap-2">
                <button class="btn btn-outline btn-sm">Edit</button>
                <button class="btn btn-error btn-sm">Cancel Training</button>
            </div>
        </header>

        <Tabs {tabs} urlParam="tab" let:activeTab>
            {#if activeTab === 'info'}
                <TrainingDetails {training} />
            {:else if activeTab === 'attendance'}
                <TrainingAttendance 
                    trainingId={training._id} 
                    startDate={training.startDate}
                />
            {:else if activeTab === 'materials'}
                <TrainingMaterials trainingId={training._id} />
            {/if}
        </Tabs>
    {/if}
</div>

<style>
    .loading {
        @apply flex justify-center items-center p-8 text-neutral-500;
    }
</style>
