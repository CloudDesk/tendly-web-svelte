<script lang="ts">
    import { onMount } from 'svelte';
    import InfoBanner from '../common/InfoBanner.svelte';
    import { toast } from '../common/stores/toast.store';
    import { auth } from '$lib/stores/auth';
    import {  documentsApi, employeesApi } from '$lib/services/api';
  
    export let taxDeclaration: any;
    export let mode: 'admin' | 'own' = 'own';
    export let employeeId: string | null = null;
    export let selectedFY: string; // YYYY-YY format (e.g., "2024-25")
  
    let currentEmployee: any = null;
    let form12bbData: any = null;
    let isLoading = false;

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
            employeeId :  currentEmployee._id,
            category:'Tax',
            type:'Form12BB',
            access:'global',
            financialYear:selectedFY
        }
        )
        console.log(res,"Res fetch form12BB")

        // const res = {success:true,data:null}
        if (res.success && res.data) {
          form12bbData = res.data;
        } else {
          form12bbData = null;
        }
      } catch (e) {
        toast.error('Failed to fetch Form 12BB');
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
          form12bbData = res.data;
        } else {
          toast.error('Failed to generate Form 12BB');
        }
      } catch (err) {
        toast.error('Error while generating Form 12BB');
      } finally {
        isLoading = false;
      }
    }
  
    function downloadForm12BB() {
      if (form12bbData?.fileUrl) {
        window.open(form12bbData.fileUrl, '_blank');
      } else {
        toast.error('File not available');
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
      {#if mode === 'admin'}
        <div class="flex flex-col items-end text-center gap-2">
          <div class="text-gray-600 mb-2">Selected FY: {selectedFY}</div>
          
          {#if form12bbData}
            <div class="text-green-700 font-medium">Form 12BB already generated for this FY.</div>
            <button class="btn btn-primary" on:click={handleGenerate}>Re-generate Form 12BB</button>
          {:else}
            <button class="btn btn-primary" on:click={handleGenerate}>Generate Form 12BB</button>
          {/if}
        </div>
      {:else if mode === 'own'}
        <div class="flex flex-col items-center text-center gap-2">
          <div class="text-gray-600 mb-2">Selected FY: {selectedFY}</div>
          {#if form12bbData?.fileUrl}
            <div class="text-green-700 font-medium">Form 12BB is available for this FY.</div>
            <button class="btn btn-primary" on:click={downloadForm12BB}>View Form 12BB</button>
          {:else}
            <InfoBanner
              type="warning"
              message="Form 12BB is not available for the selected financial year."
            />
          {/if}
        </div>
      {/if}
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
  </style>
  