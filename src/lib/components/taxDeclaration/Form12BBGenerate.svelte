<script lang="ts">
    import { onMount } from "svelte";
    import InfoBanner from "../common/InfoBanner.svelte";
    import ConfirmDialog from "../common/ConfirmDialog.svelte";
    import Loader from "../common/Loader.svelte";
    import { toast } from "../common/stores/toast.store";
    import { auth } from "$lib/stores/auth";
    import { documentsApi, employeesApi } from "$lib/services/api";
    import Table from "../common/Table.svelte";
    import type { IDocument } from "$lib/services/api";
    import type { DialogConfig } from "$lib/types";
    import {
        getFYOptionsFromJoiningDate,
        getCurrentFinancialYear,
    } from "$lib/utils/financialYear";

    export let taxDeclaration: any;
    export let mode: "admin" | "own" = "own";
    export let employeeId: string | null = null;
    export let employee: any = null;

    console.log(employee, "form12BB emp");
    let currentEmployee: any = null;
    let form12bbData: any[] = [];
    let isLoading = false;
    let isInitialLoading = true;
    let isUpdatingPreview = false;
    let showConfirmDialog = false;
    let selectedFY: string = "";
    let fyOptions: string[] = [];
    let pendingCheckboxChange: {
        item: any;
        key: string;
        checked: boolean;
        originalChecked: boolean;
        id: string;
    } | null = null;

    // Force reactive update with timestamp-based key for Table re-render
    $: tableData = form12bbData;
    let tableKey = Date.now();
    let dialogConfig: DialogConfig = {
        title: "",
        message: "",
        type: "info",
        confirmText: "Confirm",
        cancelText: "Cancel",
    };

    const columns = [
        {
            key: "financialYear",
            label: "Financial Year",
            render: (doc: IDocument) =>
                doc.metadata?.form12BB?.financialYear || "-",
        },
        {
            key: "totalIncome",
            label: "Total Income",
            render: (doc: IDocument) =>
                `₹${doc.metadata?.form12BB?.totalIncome?.toLocaleString() || "0"}`,
        },
        {
            key: "taxPayable",
            label: "Tax Payable",
            render: (doc: IDocument) =>
                `₹${doc.metadata?.form12BB?.taxPayable?.toLocaleString() || "0"}`,
        },
        {
            key: "tdsPaid",
            label: "TDS Paid",
            render: (doc: IDocument) =>
                `₹${doc.metadata?.form12BB?.tdsPaid?.toLocaleString() || "0"}`,
        }, // Add checkbox column only for admin
        ...(mode === "admin"
            ? [
                  {
                      key: "isPreviewEnabled",
                      label: "Preview Enabled",
                      type: "checkbox" as const,
                      render: (doc: IDocument) =>
                          doc.metadata?.form12BB?.isPreviewEnabled || false,
                  },
              ]
            : []),

        {
            key: "actions",
            label: "Actions",
            render: (doc: IDocument) => {
                const isPreviewEnabled =
                    mode === "admin" ||
                    !doc.metadata?.form12BB?.isPreviewEnabled;
                return `
            <div class="flex items-center justify-end gap-6">

              ${
                  isPreviewEnabled
                      ? `
                <button class="text-blue-600 hover:text-blue-800" data-action="preview" data-id="${doc._id}" title="Preview">
                  <i class="fas fa-eye"></i>
                </button>
              `
                      : ""
              }
            </div>
          `;
            },
        },
    ];

    async function loadEmployee() {
        if (mode === "admin" && employeeId) {
            try {
                const res = await employeesApi.getById(employeeId);
                if (res.success) {
                    currentEmployee = res.data;
                }
            } catch (err) {
                toast.error("Failed to load employee");
            }
        } else if (mode === "admin" && employee) {
            currentEmployee = employee;
        } else {
            currentEmployee = $auth.user;
        }

        // Generate FY options based on employee joining date
        if (currentEmployee?.joiningDate) {
            console.log("joiningDate", currentEmployee.joiningDate);
            fyOptions = getFYOptionsFromJoiningDate(
                currentEmployee.joiningDate,
            );
            console.log("fyOptions", fyOptions);
            // Set default selected FY to current FY if available in options
            const currentFY = getCurrentFinancialYear();
            if (fyOptions.includes(currentFY)) {
                selectedFY = currentFY;
            } else if (fyOptions.length > 0) {
                selectedFY = fyOptions[0];
            }
        } else {
            let fy = getCurrentFinancialYear();
            fyOptions = [fy];
        }
    }

    async function fetchForm12BB() {
        if (!currentEmployee?._id || !selectedFY) return;
        try {
            const res = await documentsApi.getDocuments({
                employeeId: currentEmployee._id,
                category: "Tax",
                type: "Form12BB",
                access: "global",
                financialYear: selectedFY,
            });
            console.log(res, "Res fetch form12BB");

            if (res.success && res.data) {
                form12bbData = Array.isArray(res.data) ? res.data : [res.data];
            } else {
                form12bbData = [];
            }
            // Force reactive update
            tableData = [...form12bbData];
            // Update key to force Table re-render
            tableKey = Date.now();
        } catch (e) {
            toast.error("Failed to fetch Form 12BB");
            form12bbData = [];
            tableData = [];
            // Update key to force Table re-render
            tableKey = Date.now();
        }
    }

    async function handleGenerate() {
        if (!currentEmployee || !taxDeclaration?._id) return;

        try {
            isLoading = true;
            const res = await documentsApi.generateForm12BB({
                employeeId: currentEmployee._id,
                taxDeclarationId: taxDeclaration._id,
                financialYear: selectedFY,
            });

            if (res.success) {
                toast.success("Form 12BB generated successfully");
                await fetchForm12BB(); // Refresh the table data
            } else {
                toast.error("Failed to generate Form 12BB");
            }
        } catch (err) {
            toast.error("Error while generating Form 12BB");
        } finally {
            isLoading = false;
        }
    }

    function handleTableAction(event: CustomEvent) {
        const { action, id } = event.detail;
        console.log("handleTableAction", action, id);

        const record = form12bbData.find((doc) => doc._id === id);
        if (!record) return;

        if (action === "preview") {
            if (record.filePath) {
                window.open(record.filePath, "_blank");
            } else {
                toast.error("File not available");
            }
        } else if (action === "toggle-status" && mode === "admin") {
            handleStatusToggle(record);
        }
    }

    async function handleStatusToggle(record: IDocument) {
        console.log("handleStatusToggle", record);
        /* try {
        const newStatus = !record.metadata?.form12BB?.isLocked;
        // TODO: Implement status toggle API call
        const res = await documentsApi.updateForm12BBStatus(record._id, {
          isLocked: newStatus
        });

        if (res.success) {
          toast.success(`Document ${newStatus ? 'locked' : 'unlocked'} successfully`);
          await fetchForm12BB(); // Refresh the table
        } else {
          toast.error('Failed to update status');
        }
      } catch (err) {
        toast.error('Failed to update status');
      }
        */
    }

    async function handleCheckboxChange(event: CustomEvent) {
        const { item, key, checked, id } = event.detail;
        console.log("Checkbox changed:", item, key, checked, id);

        if (key === "isPreviewEnabled") {
            // Store the original state before change
            const originalChecked =
                item.metadata?.form12BB?.isPreviewEnabled || false;

            // Store the pending change with original state
            pendingCheckboxChange = { item, key, checked, originalChecked, id };

            // Configure confirmation dialog
            dialogConfig = {
                title: "Confirm Preview Status Change",
                message: `Are you sure you want to ${checked ? "enable" : "disable"} preview for this Form 12BB?`,
                type: "warning",
                confirmText: checked ? "Yes, Enable" : "Yes, Disable",
                cancelText: "Cancel",
            };

            // Show confirmation dialog
            showConfirmDialog = true;
        }
    }

    async function handleConfirmCheckboxChange() {
        if (!pendingCheckboxChange) return;

        const { item, key, checked, id } = pendingCheckboxChange;

        try {
            isUpdatingPreview = true;

            // Make API call to update the preview enabled status
            const res = await documentsApi.updateForm12BBPreviewStatus(id, {
                isPreviewEnabled: checked,
            });

            if (res.success) {
                toast.success(
                    `Preview ${checked ? "enabled" : "disabled"} successfully`,
                );
            } else {
                toast.error("Failed to update preview status");
            }
        } catch (err) {
            toast.error("Error updating preview status");
        } finally {
            // Always fetch fresh data after any action
            await fetchForm12BB();
            isUpdatingPreview = false;
            pendingCheckboxChange = null;
            // Update key to force Table re-render
            tableKey = Date.now();
        }
    }

    async function handleCancelCheckboxChange() {
        try {
            isUpdatingPreview = true;
            // Fetch fresh data to ensure correct state
            await fetchForm12BB();
        } catch (err) {
            toast.error("Error refreshing data");
        } finally {
            isUpdatingPreview = false;
            pendingCheckboxChange = null;
            // Update key to force Table re-render
            tableKey = Date.now();
        }
    }

    onMount(async () => {
        try {
            isInitialLoading = true;
            await loadEmployee();
            await fetchForm12BB();
        } catch (err) {
            toast.error("Error loading data");
        } finally {
            isInitialLoading = false;
            // Update key to force Table re-render
            tableKey = Date.now();
        }
    });

    $: if (selectedFY && currentEmployee?._id) {
        isInitialLoading = true;
        fetchForm12BB().finally(() => {
            isInitialLoading = false;
            // Update key to force Table re-render
            tableKey = Date.now();
        });
    }

    function handleFYChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        selectedFY = target.value;
    }
</script>

<div class="bg-white rounded-lg shadow-sm max-w-5xl mx-auto p-4">
    {#if isInitialLoading}
        <div class="flex justify-center py-8">
            <Loader
                variant="spinner"
                size="lg"
                text="Loading Form 12BB data..."
            />
        </div>
    {:else if isLoading}
        <div class="flex justify-center py-8">
            <Loader
                variant="spinner"
                size="md"
                text="Generating Form 12BB..."
            />
        </div>
    {:else if selectedFY}
        <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <label for="fy-select" class="text-gray-600 font-medium"
                        >Financial Year:</label
                    >
                    <select
                        id="fy-select"
                        bind:value={selectedFY}
                        on:change={handleFYChange}
                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {#each fyOptions as fy}
                            <option value={fy}>{fy}</option>
                        {/each}
                    </select>
                </div>
                {#if mode === "admin"}
                    <button class="btn btn-primary" on:click={handleGenerate}>
                        {form12bbData.length > 0
                            ? "Re-generate Form 12BB"
                            : "Generate Form 12BB"}
                    </button>
                {/if}
            </div>

            {#if form12bbData.length > 0}
                <div class="relative">
                    {#if isUpdatingPreview}
                        <div
                            class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10"
                        >
                            <Loader
                                variant="spinner"
                                size="md"
                                text="Updating preview status..."
                            />
                        </div>
                    {/if}
                    {#key tableKey}
                        <Table
                            {columns}
                            data={tableData}
                            on:action={handleTableAction}
                            on:checkbox-change={handleCheckboxChange}
                            searchable={false}
                            meta={null}
                        />
                    {/key}
                </div>
            {:else}
                <InfoBanner
                    type="warning"
                    message={mode === "admin"
                        ? "No Form 12BB generated yet. Click 'Generate Form 12BB' to create one."
                        : "Form 12BB is not available for the selected financial year."}
                />
            {/if}
        </div>
    {:else}
        <InfoBanner
            type="warning"
            message={fyOptions.length > 0
                ? "Please select a financial year to view or generate Form 12BB."
                : "No financial years available for this employee."}
        />
    {/if}
</div>

<!-- Confirmation Dialog -->
<ConfirmDialog
    bind:show={showConfirmDialog}
    config={dialogConfig}
    on:confirm={handleConfirmCheckboxChange}
    on:cancel={handleCancelCheckboxChange}
/>

{#if isUpdatingPreview && showConfirmDialog}
    <Loader
        fullScreen={true}
        variant="spinner"
        text="Updating preview status..."
    />
{/if}

<svelte:head>
    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
    />
</svelte:head>

<style>
    .btn {
        @apply px-4 py-2 rounded font-medium;
    }

    .btn-primary {
        @apply bg-blue-600 text-white hover:bg-blue-700;
    }

    :global(.fas.fa-eye) {
        @apply w-4 h-4;
    }
</style>
