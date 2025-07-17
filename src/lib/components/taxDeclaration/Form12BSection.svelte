<script lang="ts">
  import { onMount } from 'svelte';
  import { documentsApi, employeesApi } from '$lib/services/api';
  import { toast } from '../common/stores/toast.store';
  import { auth } from '$lib/stores/auth';
  import { isJoiningDateInCurrentFY } from '$lib/utils/financialYear';
  import Form12BCreate from './Form12BCreate.svelte';
  import InfoBanner from '../common/InfoBanner.svelte';
  import Table from '../common/Table.svelte';
  import type { IDocument } from '$lib/services/api';
  import { format } from 'date-fns';

  export let taxDeclaration: any;
  export let mode: 'admin'| 'own' = 'own';  
  export let employeeId: string | null = null;

  let currentEmployee: any = null;
  const user = $auth.user;
  let showFormModal = false;
  let isLoading = false;
  let form12BRecord: any = null;

  // Modal state
  let modalMode: 'add' | 'view'  = 'add';
  let approvalStatus: 'Verified' | 'Rejected' | 'ResubmissionRequested' | '' = '';
  let approvalComments: string = '';

  function formatDate(dateStr: string | Date | undefined): string {
    if (!dateStr) return '-';
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      return format(date, 'dd MMM yyyy');
    } catch {
      return '-';
    }
  }

  const columns = [
    {
      key: "previousEmployer",
      label: "Previous Employer",
      render: (doc: IDocument) => doc.metadata?.form12B?.previousEmployer.name || '-'
    },
    {
      key: "pan",
      label: "PAN",
      render: (doc: IDocument) => doc.metadata?.form12B?.previousEmployer.pan || '-'
    },
    {
      key: "tan",
      label: "TAN",
      render: (doc: IDocument) => doc.metadata?.form12B?.previousEmployer.tan || '-'
    },
    {
      key: "tdsDeducted",
      label: "TDS Deducted",
      render: (doc: IDocument) => `₹${doc.metadata?.form12B?.tdsDeducted?.toLocaleString() || '0'}`
    },
    {
      key: "employmentPeriod",
      label: "Employment Period",
      render: (doc: IDocument) => {
        const startDate = doc.metadata?.form12B?.employmentPeriod?.startDate;
        const endDate = doc.metadata?.form12B?.employmentPeriod?.endDate;
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
      }
    },
    {
      key: "status",
      label: "Status",
      render: (doc: IDocument) => doc.metadata?.form12B?.status || '-'
    },
    {
      key: "actions",
      label: "Actions",
      render: (doc: IDocument) => {
        const isVerified = doc.metadata?.form12B?.status === 'Verified';
        const isLocked = doc.metadata?.form12B?.isLocked;
        const showDelete = mode === 'admin' && !isVerified && !isLocked;
        
        return `
          <div class="flex items-center justify-center gap-4">
            <button class="text-blue-600 hover:text-blue-800t" data-action="view" data-id="${doc._id}">
              <i class="fas fa-eye"></i>
            </button>
            ${showDelete ? `
              <button class="text-red-600 hover:text-red-800" data-action="delete" data-id="${doc._id}">
                <i class="fas fa-trash"></i>
              </button>
            ` : ''}
          </div>
        `;
      }
    }
  ];

  // Replaces internal role check
  const isAdminMode = mode === 'admin';
  console.log("isAdminMode", isAdminMode);
  let currentFYStatus = user?.joiningDate
    ? isJoiningDateInCurrentFY(user.joiningDate)
    : { isValid: false, financialYear: null };

  async function fetchForm12B() {
    if (!currentFYStatus.isValid || !user?._id) return;
    isLoading = true;
    try {
      const response = await documentsApi.getDocuments({
        employeeId: currentEmployee._id,
        category: 'Tax',
        type: 'Form12B',
        financialYear: currentFYStatus.financialYear ?? undefined,
        access:mode ==='admin'?'global':'own'
      });
      console.log(response,"response fetchForm12B")
      if (response.success && response.data?.length > 0) {
        form12BRecord = response.data[0];
      } else {
        form12BRecord = null;
      }
    } catch (error:any) {
      toast.error(error.message || 'Failed to fetch Form 12B');
    } finally {
      isLoading = false;
    }
  }

  async function handleFormSubmit(event: CustomEvent<any>) {
    const { documents, ...formDataFields } = event.detail;
    const payload = {
      ...formDataFields,
      taxDeclarationId: taxDeclaration._id
    };

    const formData = new FormData();
    formData.append('documentData', JSON.stringify(payload));
    formData.append('file', documents[0]);

    try {
      const response = await documentsApi.uploadForm12B(formData);
      if (response.success) {
        toast.success('Form 12B submitted successfully');
        await fetchForm12B();
      } else {
        toast.error('Form 12B submission failed');
      }
    } catch (error:any) {
      toast.error(error.message || 'Form 12B submission failed');
    } finally {
      showFormModal = false;
    }
  }

  function handleTableAction(event: CustomEvent) {
    const { action, id } = event.detail;
    console.log("handleTableAction", action, id);
    if (action === 'view') {
      modalMode = 'view';
      showFormModal = true;
    } else if (action === 'delete' && isAdminMode) {
      console.log("delete", id);
      handleDelete();
    }
  }

  async function handleDelete() {
    if (!form12BRecord?._id) return;
    if (!confirm('Are you sure you want to delete this Form 12B record?')) return;
    try {
      const response = await documentsApi.delete(form12BRecord._id);
      if (response.success) {
        toast.success('Form 12B deleted');
        await fetchForm12B();
      } else {
        toast.error('Delete failed');
      }
    } catch (e:any) {
      toast.error(e.message || 'Delete failed');
    }
  }

  async function handleApproval(event: CustomEvent<{ status: string; comments: string }>) {
    const { status, comments } = event.detail;
    if (!form12BRecord?._id) return;
    try {
      const response = await documentsApi.statusUpdateForm12B(form12BRecord._id, JSON.stringify({ status, comments }));
      if (response.success) {
        toast.success('Form 12B status updated');
        await fetchForm12B();
      } else {
        toast.error('Approval failed');
      }
    } catch (e:any) {
      toast.error(e.message || 'Approval failed');
    } finally {
      showFormModal = false;
    }
  }
  async function loadCurrentEmployee() {
    console.log("loadCurrentEmployee",mode,employeeId)
  if (mode === 'admin' && employeeId) {
    try {
      const res = await employeesApi.getById(employeeId);
      if (res.success && res.data) {
        currentEmployee = res.data;
      } else {
        toast.error(  'Failed to load employee details');
      }
    } catch (e:any) {
      toast.error(e.message || 'Error fetching employee details');
    }
  } else {
    currentEmployee = $auth.user;
  }
  const joiningDate = currentEmployee?.joiningDate;
  console.log(joiningDate,"joiningDate")
  let status;
  if (joiningDate) {
    status = isJoiningDateInCurrentFY(joiningDate);
  } else {
    status = { isValid: false, financialYear: null };
  }
  console.log(status,"status")
  currentFYStatus = status;

  await fetchForm12B();
  }
  onMount(() => {
    loadCurrentEmployee()
  });
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
  />
</svelte:head>


<div class="bg-white rounded-lg shadow-sm max-w-5xl mx-auto">
  {#if isLoading}
    <div class="text-center py-4">Loading...</div>
  {:else if currentFYStatus.isValid}
    <div class="flex flex-col items-center text-center">
      {#if !form12BRecord}
        {#if mode === 'own'}
          <button class="btn btn-primary" on:click={() => { showFormModal = true; modalMode = 'add'; }}>
            + Add Form 12B
          </button>
        {/if}
      {:else}
        <Table
          columns={columns}
          data={[form12BRecord]}
          on:action={handleTableAction}
          searchable={false}
          meta={null}
        />
        {#if form12BRecord.metadata.form12B.status === 'ResubmissionRequested' && mode === 'own'}
          <button class="btn btn-primary mt-4" on:click={() => { showFormModal = true; modalMode = 'add'; }}>
            Re-Upload Form 12B
          </button>
        {/if}
      {/if}
    </div>
  {:else}
    <InfoBanner
      type="warning"
      message={
        mode === 'admin'
          ? 'This employee is not eligible for Form 12B. Their joining date is outside the current financial year.'
          : 'You cannot upload Form 12B. Your joining date is not within the current financial year.'
      }
    />
  {/if}

  <Form12BCreate
    open={showFormModal}
    taxDeclaration={taxDeclaration}
    form12BRecord={modalMode === 'add' ? null : form12BRecord}
    readonly={modalMode === 'view'}
    isAdmin={isAdminMode}
    approvalMode={mode === 'admin'}
    approvalStatus={approvalStatus}
    approvalComments={approvalComments}
    filePath={form12BRecord?.filePath}
    fileName={form12BRecord?.fileName}
    on:submit={handleFormSubmit}
    on:cancel={() => (showFormModal = false)}
    on:approval={handleApproval}
  />
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

  :global(.fas.fa-trash) {
    @apply w-4 h-4;
  }
</style>
