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

  const user = $auth.user;
  let showFormModal = false;
  let isLoading = false;
  let form12BRecord: any = null;

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
        financialYear: currentFYStatus.financialYear??undefined
      });
console.log(response,"Response fetchForm12B ")
      if (response.success && response.data?.length > 0) {
        form12BRecord = response.data[0];
      } else {
        form12BRecord = null;
      }
    } catch (error) {
      console.error('Failed to fetch Form 12B:', error);
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
    formData.append('file', documents[0]); // single file only

    try {
      const response = await documentsApi.uploadForm12B(formData);
      if (response.success) {
        toast.success('Form 12B submitted successfully');
        await fetchForm12B(); // refresh
      } else {
        toast.error('Form 12B submission failed');
      }
    } catch (error) {
      console.error('Form 12B submission error:', error);
      toast.error('Form 12B submission failed');
    } finally {
      showFormModal = false;
    }
  }



 

  onMount(() => {
    fetchForm12B();
  });
</script>

<div class="bg-white rounded-lg shadow-sm max-w-5xl mx-auto">
  {#if currentFYStatus.isValid}
    <div class="flex flex-col items-center text-center">

      {#if !form12BRecord}
        <button class="btn btn-primary" on:click={() => (showFormModal = true)}>
          + Add Form 12B
        </button>
      {:else}
        <Form12BTable form12BRecord />

        {#if form12BRecord.metadata.form12B.status === 'ResubmissionRequested'}
          <button
            class="btn btn-primary mt-4"
            on:click={() => (showFormModal = true)}
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

  <Form12BCreate
    open={showFormModal}
    taxDeclaration={taxDeclaration}
    on:submit={handleFormSubmit}
    on:cancel={() => (showFormModal = false)}
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
