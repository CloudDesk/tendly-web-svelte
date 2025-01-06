<script lang="ts">
    import { onMount } from 'svelte';
    import { trainingMaterialsApi } from '$lib/services/api';
    import Modal from '$lib/components/common/Modal.svelte';

    export let trainingId: string;
    
    let loading = true;
    let error: string | null = null;
    let showAddModal = false;
    let uploadProgress = 0;

    type Material = {
        _id: string;
        title: string;
        description: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        uploadedBy: {
            _id: string;
            name: string;
        };
        uploadedAt: string;
    };

    let materials: Material[] = [];
    let newMaterial = {
        title: '',
        description: '',
        file: null as File | null
    };

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function getFileIcon(fileType: string): string {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('image')) return '🖼️';
        if (fileType.includes('video')) return '🎥';
        if (fileType.includes('audio')) return '🎵';
        if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
        return '📎';
    }

    async function loadMaterials() {
        try {
            loading = true;
            const response = await trainingMaterialsApi.getByTraining(trainingId);
            materials = response.data;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            newMaterial.file = input.files[0];
        }
    }

    async function handleUpload() {
        if (!newMaterial.file) return;

        try {
            loading = true;
            const formData = new FormData();
            formData.append('title', newMaterial.title);
            formData.append('description', newMaterial.description);
            formData.append('file', newMaterial.file);

            await trainingMaterialsApi.upload(trainingId, formData, (progress) => {
                uploadProgress = progress;
            });

            // Reset form
            newMaterial = {
                title: '',
                description: '',
                file: null
            };
            showAddModal = false;
            uploadProgress = 0;

            // Reload materials
            await loadMaterials();
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function handleDelete(materialId: string) {
        if (!confirm('Are you sure you want to delete this material?')) return;

        try {
            loading = true;
            await trainingMaterialsApi.delete(trainingId, materialId);
            await loadMaterials();
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    onMount(loadMaterials);
</script>

<div class="space-y-6">
    <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">Training Materials</h3>
        <button class="btn btn-primary btn-sm" on:click={() => showAddModal = true}>
            Upload Material
        </button>
    </div>

    {#if loading && !materials.length}
        <div class="loading">Loading materials...</div>
    {:else if error}
        <div class="alert alert-error">{error}</div>
    {:else if materials.length === 0}
        <div class="text-center py-8 text-neutral-500">
            No materials uploaded yet
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each materials as material}
                <div class="card bg-base-100">
                    <div class="card-body">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="card-title flex items-center gap-2">
                                    <span class="text-2xl">{getFileIcon(material.fileType)}</span>
                                    {material.title}
                                </h4>
                                <p class="text-sm text-neutral-500 mt-1">
                                    {material.description}
                                </p>
                            </div>
                            <button 
                                class="btn btn-ghost btn-sm btn-square"
                                on:click={() => handleDelete(material._id)}
                            >
                                ❌
                            </button>
                        </div>
                        
                        <div class="text-sm text-neutral-500 space-y-1 mt-4">
                            <div>Size: {formatFileSize(material.fileSize)}</div>
                            <div>Uploaded by: {material.uploadedBy.name}</div>
                            <div>
                                {new Date(material.uploadedAt).toLocaleDateString()}
                            </div>
                        </div>

                        <div class="card-actions justify-end mt-4">
                            <a 
                                href={material.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                class="btn btn-primary btn-sm"
                            >
                                Download
                            </a>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<Modal
    show={showAddModal}
    title="Upload Material"
    onClose={() => {
        showAddModal = false;
        newMaterial = {
            title: '',
            description: '',
            file: null
        };
        uploadProgress = 0;
    }}
>
    <form on:submit|preventDefault={handleUpload} class="space-y-4">
        <div class="form-control">
            <label class="label">Title</label>
            <input
                type="text"
                class="input input-bordered"
                bind:value={newMaterial.title}
                required
            />
        </div>

        <div class="form-control">
            <label class="label">Description</label>
            <textarea
                class="textarea textarea-bordered"
                bind:value={newMaterial.description}
                rows="3"
            ></textarea>
        </div>

        <div class="form-control">
            <label class="label">File</label>
            <input
                type="file"
                class="file-input file-input-bordered w-full"
                on:change={handleFileSelect}
                required
            />
        </div>

        {#if uploadProgress > 0 && uploadProgress < 100}
            <div class="w-full bg-base-200 rounded-full h-2.5">
                <div
                    class="bg-primary h-2.5 rounded-full"
                    style="width: {uploadProgress}%"
                ></div>
            </div>
        {/if}

        <div class="flex justify-end gap-2">
            <button 
                type="button" 
                class="btn btn-ghost"
                on:click={() => {
                    showAddModal = false;
                    newMaterial = {
                        title: '',
                        description: '',
                        file: null
                    };
                    uploadProgress = 0;
                }}
            >
                Cancel
            </button>
            <button 
                type="submit" 
                class="btn btn-primary"
                disabled={loading || !newMaterial.file}
            >
                {loading ? 'Uploading...' : 'Upload'}
            </button>
        </div>
    </form>
</Modal>

<style>
    .loading {
        @apply flex justify-center items-center p-8 text-neutral-500;
    }
</style> 