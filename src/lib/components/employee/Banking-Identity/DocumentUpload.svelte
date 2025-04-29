<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Upload, Eye, Trash2, Loader2 } from "lucide-svelte";

  export let documentUrl: string | undefined = undefined;
  export let loading: Record<string, boolean> = {};
  export let onUpload: (file: File) => void;
  export let fieldId: string = "document";
  export let allowDelete: boolean = true;

  const dispatch = createEventDispatcher();
  let fileInput: HTMLInputElement;

  function handleFileSelect() {
    fileInput.click();
  }

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      onUpload(target.files[0]);
    }
  }

  function viewDocument() {
    if (documentUrl) {
      window.open(documentUrl, "_blank");
    }
  }

  function deleteDocument() {
    dispatch("delete");
  }
</script>

<div class="flex items-center space-x-2">
  <input
    type="file"
    id={`file-${fieldId}`}
    accept="application/pdf,image/*"
    class="hidden"
    bind:this={fileInput}
    on:change={handleFileChange}
  />

  {#if documentUrl}
    <div class="flex space-x-2">
      <button
        type="button"
        class="btn btn-sm btn-outline"
        on:click={viewDocument}
        title="View Document"
      >
        <Eye size={16} />
      </button>

      {#if allowDelete}
        <button
          type="button"
          class="btn btn-sm btn-outline btn-error"
          on:click={deleteDocument}
          title="Delete Document"
        >
          <Trash2 size={16} />
        </button>
      {/if}

      <button
        type="button"
        class="btn btn-sm btn-outline"
        on:click={handleFileSelect}
        disabled={loading[fieldId]}
        title="Replace Document"
      >
        {#if loading[fieldId]}
          <Loader2 size={16} class="animate-spin" />
        {:else}
          <Upload size={16} />
        {/if}
      </button>
    </div>
  {:else}
    <button
      type="button"
      class="btn btn-sm btn-outline"
      on:click={handleFileSelect}
      disabled={loading[fieldId]}
    >
      {#if loading[fieldId]}
        <Loader2 size={16} class="animate-spin" />
        <span>Uploading...</span>
      {:else}
        <Upload size={16} />
        <span>Upload</span>
      {/if}
    </button>
  {/if}
</div>
