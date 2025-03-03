<!-- InvestmentProofUploader.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { formatCurrency } from "$lib/utils/currency";

  export let declarations: any[] = [];
  export let sections: any[] = [];

  const dispatch = createEventDispatcher();

  let uploadedFiles: { [key: string]: File } = {};
  let uploadErrors: { [key: string]: string } = {};

  function handleFileSelect(section: string, subsection: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const key = `${section}_${subsection}`;

    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        uploadErrors[key] = "File size exceeds 5MB limit";
        return;
      }
      uploadedFiles[key] = file;
      delete uploadErrors[key];
    }
  }

  function handleSubmit() {
    dispatch("upload", { files: uploadedFiles });
    uploadedFiles = {};
    uploadErrors = {};
  }

  function reset() {
    uploadedFiles = {};
    uploadErrors = {};
  }
</script>

<div class="uploader-content">
  {#each sections as section}
    <div class="section">
      <h3>{section.title}</h3>
      {#each section.subsections as subsection}
        {@const key = `${section.id}_${subsection.id}`}
        {@const declaration = declarations.find(
          (d) => d.section === section.id && d.subSection === subsection.id
        )}
        {#if declaration?.declaredAmount > 0}
          <div class="upload-row">
            <div class="subsection-info">
              <span class="name">{subsection.name}</span>
              <span class="amount"
                >{formatCurrency(declaration.declaredAmount)}</span
              >
            </div>
            <div class="upload-control">
              <input
                type="file"
                accept="application/pdf"
                on:change={(e) =>
                  handleFileSelect(section.id, subsection.id, e)}
                class="file-input"
              />
              {#if uploadedFiles[key]}
                <span class="file-name">{uploadedFiles[key].name}</span>
              {/if}
              {#if uploadErrors[key]}
                <span class="error">{uploadErrors[key]}</span>
              {/if}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/each}

  <div class="uploader-footer">
    <button
      class="submit-btn"
      on:click={handleSubmit}
      disabled={Object.keys(uploadedFiles).length === 0}
    >
      Upload Files
    </button>
  </div>
</div>

<style>
  .uploader-content {
    padding: 1rem;
  }

  .section {
    margin-bottom: 1.5rem;
  }

  .upload-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .subsection-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .amount {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .upload-control {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .error {
    color: #dc2626;
    font-size: 0.75rem;
  }

  .file-name {
    color: #059669;
    font-size: 0.875rem;
  }

  .uploader-footer {
    padding: 1rem 0;
    display: flex;
    justify-content: flex-end;
  }

  .submit-btn {
    padding: 0.5rem 1rem;
    background-color: #059669;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .submit-btn:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }
</style>
