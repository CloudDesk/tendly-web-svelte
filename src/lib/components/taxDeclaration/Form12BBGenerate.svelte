<script lang="ts">
    import { onMount } from 'svelte';
    import InfoBanner from '../common/InfoBanner.svelte';
    import { toast } from '../common/stores/toast.store';
    import { auth } from '$lib/stores/auth';
    import { documentsApi, employeesApi } from '$lib/services/api';
    import Table from '../common/Table.svelte';
    import type { IDocument } from '$lib/services/api';

    export let taxDeclaration: any;
    export let mode: 'admin' | 'own' = 'own';
    export let employeeId: string | null = null;
    export let selectedFY: string;

    let currentEmployee: any = null;
    let form12bbData: any[] = [];
    let isLoading = false;

    const columns = [
      {
        key: "financialYear",
        label: "Financial Year",
        render: (doc: IDocument) => doc.metadata?.form12BB?.financialYear || '-'
      },
      {
        key: "totalIncome",
        label: "Total Income",
        render: (doc: IDocument) => `₹${doc.metadata?.form12BB?.totalIncome?.toLocaleString() || '0'}`
      },
      {
        key: "taxPayable",
        label: "Tax Payable",
        render: (doc: IDocument) => `₹${doc.metadata?.form12BB?.taxPayable?.toLocaleString() || '0'}`
      },
      {
        key: "tdsPaid",
        label: "TDS Paid",
        render: (doc: IDocument) => `₹${doc.metadata?.form12BB?.tdsPaid?.toLocaleString() || '0'}`
      },
      {
        key: "actions",
        label: "Actions",
        render: (doc: IDocument) => {
          const isPreviewEnabled = mode === 'admin' || !doc.metadata?.form12BB?.isLocked;
          const showStatusToggle = mode === 'admin';
          const isLocked = doc.metadata?.form12BB?.isLocked;
          
          return `
            <div class="flex items-center justify-end gap-6">
              ${showStatusToggle ? `
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">${isLocked ? 'Locked' : 'Unlocked'}</span>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" ${isLocked ? 'checked' : ''} data-action="toggle-status" data-id="${doc._id}">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ` : ''}
              ${isPreviewEnabled ? `
                <button class="text-blue-600 hover:text-blue-800" data-action="preview" data-id="${doc._id}" title="Preview">
                  <i class="fas fa-eye"></i>
                </button>
              ` : ''}
            </div>
          `;
        }
      }
    ];

    async function loadEmployee() {
      if (mode === 'admin' && employeeId) {
        try {
          const res = await employeesApi.getById(employeeId);
          if (res.success) {
            currentEmployee = res.data;
          }
        } catch (err) {
          toast.error('Failed to load employee');
        }
      } else {
        currentEmployee = $auth.user;
      }
    }

    async function fetchForm12BB() {
      if (!currentEmployee?._id || !selectedFY) return;
      try {
        const res = await documentsApi.getDocuments({
          employeeId: currentEmployee._id,
          category: 'Tax',
          type: 'Form12BB',
          access: 'global',
          financialYear: selectedFY
        });
        console.log(res, "Res fetch form12BB");

        if (res.success && res.data) {
          form12bbData = Array.isArray(res.data) ? res.data : [res.data];
        } else {
          form12bbData = [];
        }
      } catch (e) {
        toast.error('Failed to fetch Form 12BB');
        form12bbData = [];
      }
    }

    async function handleGenerate() {
      if (!currentEmployee || !taxDeclaration?._id) return;

      try {
        isLoading = true;
        const res = await documentsApi.generateForm12BB({
          employeeId: currentEmployee._id,
          taxDeclarationId: taxDeclaration._id,
          financialYear: selectedFY
        });

        if (res.success) {
          toast.success('Form 12BB generated successfully');
          await fetchForm12BB(); // Refresh the table data
        } else {
          toast.error('Failed to generate Form 12BB');
        }
      } catch (err) {
        toast.error('Error while generating Form 12BB');
      } finally {
        isLoading = false;
      }
    }

    function handleTableAction(event: CustomEvent) {
      const { action, id } = event.detail;
      console.log("handleTableAction", action, id);
      
      const record = form12bbData.find(doc => doc._id === id);
      if (!record) return;

      if (action === 'preview') {
        if (record.filePath) {
          window.open(record.filePath, '_blank');
        } else {
          toast.error('File not available');
        }
      } else if (action === 'toggle-status' && mode === 'admin') {
        handleStatusToggle(record);
      }
    }

    async function handleStatusToggle(record: IDocument) {
      try {
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
    }

    onMount(async () => {
      await loadEmployee();
      await fetchForm12BB();
    });

    $: if (selectedFY && currentEmployee?._id) {
      fetchForm12BB();
    }
</script>

<div class="bg-white rounded-lg shadow-sm max-w-5xl mx-auto p-4">
  {#if isLoading}
    <div class="text-center py-4">Loading...</div>
  {:else if selectedFY}
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <div class="text-gray-600">Selected FY: {selectedFY}</div>
        {#if mode === 'admin'}
          <button class="btn btn-primary" on:click={handleGenerate}>
            {form12bbData.length > 0 ? 'Re-generate Form 12BB' : 'Generate Form 12BB'}
          </button>
        {/if}
      </div>

      {#if form12bbData.length > 0}
        <Table
          columns={columns}
          data={form12bbData}
          on:action={handleTableAction}
          searchable={false}
          meta={null}
        />
      {:else}
        <InfoBanner
          type="warning"
          message={mode === 'admin' 
            ? "No Form 12BB generated yet. Click 'Generate Form 12BB' to create one."
            : "Form 12BB is not available for the selected financial year."}
        />
      {/if}
    </div>
  {:else}
    <InfoBanner
      type="warning"
      message="Please select a financial year to view or generate Form 12BB."
    />
  {/if}
</div>

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

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
  />
</svelte:head>
  