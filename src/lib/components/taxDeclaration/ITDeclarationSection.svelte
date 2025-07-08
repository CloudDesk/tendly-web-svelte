<script lang="ts">
  import { onMount } from 'svelte';
  import { documentsApi } from '$lib/services/api';
  import { toast } from '../common/stores/toast.store';
  import { auth } from '$lib/stores/auth';
  import { isJoiningDateInCurrentFY } from '$lib/utils/financialYear';
  import Form12BCreate from './Form12BCreate.svelte';
  import InfoBanner from '../common/InfoBanner.svelte';
  import Form12BTable from './Form12BTable.svelte';

  export let taxDeclaration: any;
  export let isAdmin: boolean = false; // Prop to determine admin or user view

  const user = $auth.user;
  let showFormModal = false;
  let isLoading = false;
  let form12BRecord: any = null;
  let editForm12B: any = null; // For editing existing record

  const currentFYStatus = user?.joiningDate
    ? isJoiningDateInCurrentFY(user.joiningDate)
    : { isValid: false, financialYear: null };

  async function fetchForm12B() {
    if (!currentFYStatus.isValid || !user?._id) return;
    isLoading = true;
    try {
      const response = await documentsApi.getDocuments({
        employeeId: user._id,
        category: 'Tax',
        type: 'Form12B',
        financialYear: currentFYStatus.financialYear ?? undefined
      });
      if (response.success && response.data?.length > 0) {
        form12BRecord = response.data[0];
      } else {
        form12BRecord = null;
      }
    } catch (error) {
      console.error('Failed to fetch Form 12lánápB:', error);
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
    if (documents[0]) {
      formData.append('file', documents[0]); // Single file only
    }

    try {
      const response =  await documentsApi.uploadForm12B(formData);
      if (response.success) {
        toast.success(`Form 12B ${editForm12B ? 'updated' : 'submitted'} successfully`);
        await fetchForm12B(); // Refresh
      } else {
        toast.error(`Form 12B ${editForm12B ? 'update' : 'submission'} failed`);
      }
    } catch (error) {
      console.error(`Form 12B ${editForm12B ? 'update' : 'submission'} error:`, error);
      toast.error(`Form 12B ${editForm12B ? 'update' : 'submission'} failed`);
    } finally {
      showFormModal = false;
      editForm12B = null;
    }
  }

  async function handleTableAction(event: CustomEvent<{ action: string; record: any }>) {
    const { action, record } = event.detail;
    if (action === 'view') {
      window.open(record.filePath, '_blank');
    } else if (action === 'edit' && !isAdmin) {
      editForm12B = record.metadata.form12B;
      showFormModal = true;
    } else if (action === 'delete' && !isAdmin) {
      if (confirm('Are you sure you want to delete this Form 12B?')) {
        try {
          const response = await documentsApi.delete(record._id);
          if (response.success) {
            toast.success('Form 12B deleted successfully');
            await fetchForm12B(); // Refresh
          } else {
            toast.error('Failed to delete Form 12B');
          }
        } catch (error) {
          console.error('Form 12B deletion error:', error);
          toast.error('Failed to delete Form 12B');
        }
      }
    } else if (isAdmin && ['approve', 'resubmit', 'reject'].includes(action)) {
      try {
        const response = await documentsApi.statusUpdateForm12B(record._id, action);
        if (response.success) {
          toast.success(`Form 12B ${action}d successfully`);
          await fetchForm12B(); // Refresh
        } else {
          toast.error(`Failed to ${action} Form 12B`);
        }
      } catch (error) {
        console.error(`Form 12B ${action} error:`, error);
        toast.error(`Failed to ${action} Form 12B`);
      }
    }
  }

  function handleAddForm12B() {
    editForm12B = null;
    showFormModal = true;
  }

  onMount(() => {
    fetchForm12B();
  });
</script>

<div class="bg-white rounded-lg shadow-sm max-w-5xl mx-auto">
  {#if isLoading}
    <div class="text-center py-4">Loading...</div>
  {:else if currentFYStatus.isValid || isAdmin}
    <div class="flex flex-col items-center text-center">
      {#if !form12BRecord}
        {#if !isAdmin}
          <button class="btn btn-primary" on:click={handleAddForm12B}>
            + Add Form 12B
          </button>
        {/if}
      {:else}
        <Form12BTable {form12BRecord} {isAdmin} on:action={handleTableAction} />
        {#if !isAdmin && form12BRecord.metadata.form12B.status === 'ResubmissionRequested'}
          <button
            class="btn btn-primary mt-4"
            on:click={() => {
              editForm12B = form12BRecord.metadata.form12B;
              showFormModal = true;
            }}
          >
            Re-Upload Form 12B
          </button>
        {/if}
      {/if}
    </div>
  {:else}
    <InfoBanner
      type="warning"
      message="You cannot upload Form 12B. Your joining date is not within the current financial year."
    />
  {/if}

  {#if !isAdmin}
    <Form12BCreate
      open={showFormModal}
      {taxDeclaration}
      form12B={editForm12B}
      readonly={false}
      on:submit={handleFormSubmit}
      on:cancel={() => {
        showFormModal = false;
        editForm12B = null;
      }}
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
</style>