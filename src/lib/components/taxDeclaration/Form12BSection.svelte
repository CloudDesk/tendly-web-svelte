<script lang="ts">
  import { onMount } from 'svelte';
  import { documentsApi, employeesApi } from '$lib/services/api';
  import { toast } from '../common/stores/toast.store';
  import { auth } from '$lib/stores/auth';
  import { isJoiningDateInCurrentFY } from '$lib/utils/financialYear';
  import Form12BCreate from './Form12BCreate.svelte';
  import InfoBanner from '../common/InfoBanner.svelte';
  import Form12BTable from './Form12BTable.svelte';
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
  function formatDate(dateStr: string) {
      return format(new Date(dateStr), 'dd MMM yyyy');
    }

  const columns =[
    {key:"name",
      label:"Previous Employer",
      render:(doc:IDocument)=>`
      <div class="full-name">${doc.metadata?.form12B?.previousEmployer.name}</div>
      `
    },
    {key:"pan",
      label:"PAN",
      render:(doc:IDocument)=>`
      <div class="full-name">${doc.metadata?.form12B?.previousEmployer.pan}</div>
      `
    },
    {key:"tan",
      label:"TAN",
      render:(doc:IDocument)=>`
      <div class="full-name">${doc.metadata?.form12B?.previousEmployer.tan ?? '-'}</div>
      `
    },
    {key:"tdsDeducted",
      label:"TDS Deducted",
      render:(doc:IDocument)=>`
      <div class="full-name">${doc.metadata?.form12B?.tdsDeducted}</div>
      `
    },
    {key:"employermentPeriod",
      label:"Employment Period",
      render:(doc:IDocument)=>`
      <div class="full-name">
       ${formatDate(form12BRecord.metadata.form12B.employmentPeriod.startDate)} -<br />
            ${formatDate(form12BRecord.metadata.form12B.employmentPeriod.endDate)}
            </div>
      `
    }
    ,{key:"status",
      label:"Status",
      render:(doc:IDocument)=>`
      <div class="full-name">${doc.metadata?.form12B?.status}</div>
      `
    },
    {
      key: "_id",
      label: "Actions",
      render: (doc: IDocument) => `
        <div class="actions">
          <button class="btn-action view" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-action edit" title="Edit">
            <i class="fas fa-pencil"></i>
          </button>
        </div>
      `,
    },
  ]


  // Replaces internal role check
  const isAdminMode = mode === 'admin';

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
    } catch (error) {
      toast.error('Failed to fetch Form 12B');
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
    } catch (error) {
      toast.error('Form 12B submission failed');
    } finally {
      showFormModal = false;
    }
  }

  function handleTableAction(event: CustomEvent<{ action: string }>) {
    const { action } = event.detail;
    if (action === 'edit' || action === 'view') {
      modalMode = 'view';
      showFormModal = true;
    }  else if (action === 'delete' && !isAdminMode) {
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
    } catch (e) {
      toast.error('Delete failed');
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
    } catch (e) {
      toast.error('Approval failed');
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
        toast.error('Failed to load employee details');
      }
    } catch (e) {
      toast.error('Error fetching employee details');
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
        <Form12BTable
          form12BRecord={form12BRecord}
          isAdmin={isAdminMode}
          on:action={handleTableAction}
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
  }/>
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
</style>
