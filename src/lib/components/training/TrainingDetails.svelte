<script lang="ts">
  import de from 'date-fns/locale/de';
    import { onMount } from 'svelte';
    type TrainingMode = 'online' | 'offline' | 'hybrid';
    type TrainingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

    const trainingDefault = {
        title: 'Leadership Skills',
        description: 'Training 1 description',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        type: 'Training',
        mode: 'offline' as TrainingMode,
        status: 'scheduled' as TrainingStatus,
        trainer: {
            name: 'CV Raman',
            email: 'cv@cv.com',
            phone: '1234567890',
            organization: 'India Govt'
        },
        venue: 'India',
        meetingLink: 'https://meet.google.com/abc-123-xyz',
        maxParticipants: 100,
        currentParticipants: 0
    };
    let training = trainingDefault;
    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getStatusBadgeClass(status: TrainingStatus): string {
        switch (status) {
            case 'scheduled':
                return 'badge-info';
            case 'in_progress':
                return 'badge-warning';
            case 'completed':
                return 'badge-success';
            case 'cancelled':
                return 'badge-error';
            default:
                return 'badge-ghost';
        }
    }
    
</script>

<div class="card bg-base-100">
    <div class="card-body space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Basic Info -->
            <div class="space-y-4">
                <div>
                    <label class="text-sm text-neutral-500">Title</label>
                    <div class="mt-1 font-medium">{training.title}</div>
                </div>

                <div>
                    <label class="text-sm text-neutral-500">Description</label>
                    <div class="mt-1 whitespace-pre-wrap">{training.description}</div>
                </div>

                <div>
                    <label class="text-sm text-neutral-500">Status</label>
                    <div class="mt-1">
                        <span class="badge {getStatusBadgeClass(training.status)}">
                            {training.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <div>
                    <label class="text-sm text-neutral-500">Type</label>
                    <div class="mt-1 font-medium">{training.type}</div>
                </div>

                <div>
                    <label class="text-sm text-neutral-500">Mode</label>
                    <div class="mt-1 font-medium capitalize">{training.mode}</div>
                </div>
            </div>

            <!-- Schedule & Location -->
            <div class="space-y-4">
                <div>
                    <label class="text-sm text-neutral-500">Start Date & Time</label>
                    <div class="mt-1 font-medium">{formatDate(training.startDate)}</div>
                </div>

                <div>
                    <label class="text-sm text-neutral-500">End Date & Time</label>
                    <div class="mt-1 font-medium">{formatDate(training.endDate)}</div>
                </div>

                {#if training.maxParticipants}
                    <div>
                        <label class="text-sm text-neutral-500">Participants</label>
                        <div class="mt-1 font-medium">
                            {training.currentParticipants || 0} / {training.maxParticipants}
                        </div>
                    </div>
                {/if}

                {#if training.mode !== 'online' && training.venue}
                    <div>
                        <label class="text-sm text-neutral-500">Venue</label>
                        <div class="mt-1 font-medium">{training.venue}</div>
                    </div>
                {/if}

                {#if training.mode !== 'offline' && training.meetingLink}
                    <div>
                        <label class="text-sm text-neutral-500">Meeting Link</label>
                        <div class="mt-1">
                            <a 
                                href={training.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                class="link link-primary"
                            >
                                {training.meetingLink}
                            </a>
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Trainer Info -->
        <div class="border-t pt-6">
            <h3 class="text-lg font-semibold mb-4">Trainer Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="text-sm text-neutral-500">Name</label>
                    <div class="mt-1 font-medium">{training.trainer.name}</div>
                </div>

                <div>
                    <label class="text-sm text-neutral-500">Email</label>
                    <div class="mt-1">
                        <a href="mailto:{training.trainer.email}" class="link link-primary">
                            {training.trainer.email}
                        </a>
                    </div>
                </div>

                {#if training.trainer.phone}
                    <div>
                        <label class="text-sm text-neutral-500">Phone</label>
                        <div class="mt-1">
                            <a href="tel:{training.trainer.phone}" class="link link-primary">
                                {training.trainer.phone}
                            </a>
                        </div>
                    </div>
                {/if}

                {#if training.trainer.organization}
                    <div>
                        <label class="text-sm text-neutral-500">Organization</label>
                        <div class="mt-1 font-medium">{training.trainer.organization}</div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .badge {
        @apply px-2 py-1 text-xs font-medium capitalize;
    }
    .badge-info {
        @apply bg-info/10 text-info;
    }
    .badge-warning {
        @apply bg-warning/10 text-warning;
    }
    .badge-success {
        @apply bg-success/10 text-success;
    }
    .badge-error {
        @apply bg-error/10 text-error;
    }
    .badge-ghost {
        @apply bg-base-200 text-base-content;
    }
</style>
