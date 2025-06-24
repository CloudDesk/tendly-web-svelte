<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/common/Button.svelte';
  import FileUpload from '$lib/components/common/FileUpload.svelte';

  export let loading = false;

  const dispatch = createEventDispatcher();

  let title = '';
  let issuingAuthority = '';
  let issueDate = '';
  let expiryDate = '';
  let skillName = '';
  let proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' = 'Beginner';
  let category: 'Technical' | 'Soft' = 'Technical';
  let file: File | null = null;
  let fileError = '';

  function handleSubmit() {
    fileError = '';
    if (!file) {
      fileError = 'A certificate file is required.';
      return;
    }

    dispatch('submit', {
      file,
      certificateData: {
        title,
        issuingAuthority,
        issueDate,
        expiryDate: expiryDate || undefined,
        skillDetails: {
          skillName,
          proficiencyLevel,
          category,
        },
      }
    });
  }

  function handleFileSelect(event: CustomEvent) {
      if(event.detail.files.length > 0) {
          file = event.detail.files[0];
          fileError = '';
      }
  }

</script>

<style>
  .input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
  }
  .select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    background-color: white;
  }
</style>

<form on:submit|preventDefault={handleSubmit}>
  <div class="space-y-4">
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700">Certificate Title</label>
      <input type="text" id="title" bind:value={title} required class="input" />
    </div>
    <div>
      <label for="issuingAuthority" class="block text-sm font-medium text-gray-700">Issuing Authority</label>
      <input type="text" id="issuingAuthority" bind:value={issuingAuthority} required class="input" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="issueDate" class="block text-sm font-medium text-gray-700">Issue Date</label>
        <input type="date" id="issueDate" bind:value={issueDate} required class="input" />
      </div>
      <div>
        <label for="expiryDate" class="block text-sm font-medium text-gray-700">Expiry Date (Optional)</label>
        <input type="date" id="expiryDate" bind:value={expiryDate} class="input" />
      </div>
    </div>
    <hr/>
    <h3 class="text-lg font-medium">Skill Details</h3>
    <div>
      <label for="skillName" class="block text-sm font-medium text-gray-700">Skill Name</label>
      <input type="text" id="skillName" bind:value={skillName} required class="input" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
          <label for="proficiencyLevel" class="block text-sm font-medium text-gray-700">Proficiency Level</label>
          <select id="proficiencyLevel" bind:value={proficiencyLevel} class="select">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
          </select>
      </div>
       <div>
          <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
          <select id="category" bind:value={category} class="select">
              <option value="Technical">Technical</option>
              <option value="Soft">Soft</option>
          </select>
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Certificate File</label>
      <FileUpload 
      maxFiles={1}
      maxSize={2 * 1024 * 1024}
      multiple={false}
      confirmBeforeUpload={false}
      on:upload={handleFileSelect} accept="application/pdf,image/*" />
      {#if file}
        <p class="text-sm text-gray-500 mt-2">Selected: {file.name}</p>
      {/if}
      {#if fileError}
        <p class="text-sm text-red-600 mt-2">{fileError}</p>
      {/if}
    </div>
  </div>
  <div class="mt-6 flex justify-end gap-4">
    <Button type="button" variant="outline" on:click={() => dispatch('cancel')}>Cancel</Button>
    <Button type="submit" variant="primary" {loading}>
      {#if loading}Submitting...{:else}Submit{/if}
    </Button>
  </div>
</form> 