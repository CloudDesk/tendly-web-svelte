<script lang="ts">
    import { onMount } from 'svelte';
    import { employeesApi } from '$lib/services/api';
    import type { User } from '$lib/types';
    import Modal from '$lib/components/common/Modal.svelte';
    import { lovs } from '$lib/stores/lovs';

    export let employeeId: string;
    
    let user: User | null = null;
    let loading = true;
    let error: string | null = null;
    let showEditModal = false;
    let managerSearchTerm = '';
    let managerSearchResults: User[] = [];
    let managerSearchLoading = false;

    type EditingUser = Partial<User> & {
        joiningDate?: string;
        dateOfBirth?: string;
    };

    let editingUser: EditingUser = {};
    
    type Field = {
        key: keyof User;
        label: string;
        inputType: 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'manager-lookup' | 'select';
        required: boolean;
        options?: Array<{label: string, value: string}>;
        lovType?: string;
        hideInView?: boolean;
    };

    let fields: Field[] = [
        { key: 'email', label: 'Email', inputType: 'email', required: true },
        { key: 'roleId', label: 'Role', inputType: 'select', required: true, options: [], lovType: 'UserRole' },
        { key: 'joiningDate', label: 'Joining Date', inputType: 'date', required: true },
        { key: 'phone', label: 'Phone', inputType: 'tel', required: false },
        { key: 'location', label: 'Location', inputType: 'text', required: false },
        { key: 'emergencyContact', label: 'Emergency Contact', inputType: 'tel', required: false },
        { key: 'address', label: 'Address', inputType: 'textarea', required: false },
        { key: 'bloodGroup', label: 'Blood Group', inputType: 'text', required: false },
        { key: 'dateOfBirth', label: 'Date of Birth', inputType: 'date', required: false },
        { key: 'managerId', label: 'Manager', inputType: 'manager-lookup', required: false }
    ];

    // Subscribe to LOV store changes
    let lovValues: {[key: string]: Array<{label: string, value: string}>} = {};
    lovs.subscribe(values => {
        lovValues = values;
        // Update fields with LOV values
        fields = fields.map(field => {
            if (field.lovType && lovValues[field.lovType]) {
                return { ...field, options: [...lovValues[field.lovType]] };
            }
            return { ...field, options: field.options || [] };
        });
    });

    onMount(async () => {
        try {
            loading = true;
            const response = await employeesApi.getById(employeeId);
            user = response.data;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    });

    function handleEdit() {
        if (user) {
            // Format date fields to YYYY-MM-DD for input[type="date"]
            editingUser = {
                ...user,
                joiningDate: user.joiningDate ? new Date(user.joiningDate).toISOString().split('T')[0] : undefined,
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : undefined
            };
            managerSearchTerm = user.managerName || '';
            showEditModal = true;
        }
    }

    async function handleSearchManager(term: string) {
        if (term.length < 2) {
            managerSearchResults = [];
            return;
        }
        try {
            managerSearchLoading = true;
            const response = await employeesApi.search(term);
            managerSearchResults = response.data.filter((u: User) => u._id !== employeeId);
        } catch (err) {
            console.error('Failed to search managers:', err);
            managerSearchResults = [];
        } finally {
            managerSearchLoading = false;
        }
    }

    function handleSelectManager(manager: User) {
        editingUser = {
            ...editingUser,
            managerId: manager._id,
            managerName: manager.name
        };
        managerSearchTerm = manager.name;
        managerSearchResults = [];
    }

    async function handleSubmit() {
        try {
            loading = true;
            // Convert dates back to ISO format for API
            const userData: Partial<User> = {
                ...editingUser,
                joiningDate: editingUser.joiningDate ? new Date(editingUser.joiningDate).toISOString() : undefined,
                dateOfBirth: editingUser.dateOfBirth ? new Date(editingUser.dateOfBirth).toISOString() : undefined
            };
            await employeesApi.update(employeeId, userData);
            const updated = await employeesApi.getById(employeeId);
            user = updated.data;
            showEditModal = false;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    let debouncedSearch: NodeJS.Timeout;
    $: {
        clearTimeout(debouncedSearch);
        debouncedSearch = setTimeout(() => {
            handleSearchManager(managerSearchTerm);
        }, 300);
    }

    function formatDate(dateStr: any): string {
        if (!dateStr || typeof dateStr !== 'string') return '';
        return new Date(dateStr).toLocaleDateString();
    }

    // Helper to avoid TypeScript index errors
    function safeAccess<T extends keyof User>(key: T): string | undefined {
        if (!user) return undefined;
        const value = (user as User)[key];
        return value ? String(value) : undefined;
    }

    function getDisplayValue(field: Field, value: any): string {
        if (!value) return '';
        
        if (field.key === 'managerId' && user?.managerName) {
            return user.managerName;
        }
        
        if (field.inputType === 'select' && Array.isArray(field.options)) {
            const option = field.options.find(opt => opt.value === value);
            return option ? option.label : String(value);
        }

        if (field.inputType === 'date') {
            return formatDate(value);
        }

        return String(value);
    }
</script>

<div class="space-y-6">
    <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">Employee Details</h3>
        <button class="btn btn-primary btn-sm" on:click={handleEdit}>
            Edit Details
        </button>
    </div>

    {#if error}
        <div class="alert alert-error">{error}</div>
    {:else if loading}
        <div class="loading">Loading employee details...</div>
    {:else if user}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each fields as field}
                {#if !field.hideInView}
                    <div class="card bg-base-100">
                        <div class="card-body">
                            <h3 class="text-sm font-medium text-neutral-500">{field.label}</h3>
                            <p class="mt-1 text-base">
                                {getDisplayValue(field, safeAccess(field.key))}
                            </p>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</div>

<Modal
    show={showEditModal}
    title="Edit Employee Details"
    onClose={() => (showEditModal = false)}
>
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each fields as field}
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">{field.label}</span>
                        {#if field.required}
                            <span class="text-error">*</span>
                        {/if}
                    </label>

                    {#if field.inputType === 'textarea'}
                        <textarea
                            class="textarea textarea-bordered h-24"
                            bind:value={editingUser[field.key]}
                            required={field.required}
                        ></textarea>
                    {:else if field.inputType === 'manager-lookup'}
                        <div class="relative">
                            <input
                                type="text"
                                class="input input-bordered w-full"
                                placeholder="Search manager..."
                                bind:value={managerSearchTerm}
                            />
                            {#if managerSearchResults.length > 0}
                                <div class="manager-search-results absolute z-10 w-full mt-1 bg-base-100 rounded-md shadow-lg">
                                    <ul class="py-1">
                                        {#each managerSearchResults as manager}
                                            <li>
                                                <button
                                                    type="button"
                                                    class="w-full px-4 py-2 text-left hover:bg-base-200"
                                                    on:click={() => handleSelectManager(manager)}
                                                >
                                                    {manager.name}
                                                </button>
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}
                        </div>
                    {:else if field.inputType === 'select'}
                        <select
                            class="select select-bordered w-full"
                            bind:value={editingUser[field.key]}
                            required={field.required}
                        >
                            <option value="">Select {field.label}</option>
                            {#each field.options || [] as option}
                                <option value={option.value}>{option.label}</option>
                            {/each}
                        </select>
                    {:else if field.inputType === 'date'}
                        <input
                            type="date"
                            class="input input-bordered"
                            bind:value={editingUser[field.key]}
                            required={field.required}
                        />
                    {:else if field.inputType === 'email'}
                        <input
                            type="email"
                            class="input input-bordered"
                            bind:value={editingUser[field.key]}
                            required={field.required}
                        />
                    {:else if field.inputType === 'tel'}
                        <input
                            type="tel"
                            class="input input-bordered"
                            bind:value={editingUser[field.key]}
                            required={field.required}
                        />
                    {:else}
                        <input
                            type="text"
                            class="input input-bordered"
                            bind:value={editingUser[field.key]}
                            required={field.required}
                        />
                    {/if}
                </div>
            {/each}
        </div>

        <div class="flex justify-end gap-2">
            <button 
                type="button" 
                class="btn btn-ghost" 
                on:click={() => (showEditModal = false)}
            >
                Cancel
            </button>
            <button 
                type="submit" 
                class="btn btn-primary"
                disabled={loading}
            >
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    </form>
</Modal>

<style>
    .loading {
        @apply flex justify-center items-center p-8 text-neutral-500;
    }
</style>