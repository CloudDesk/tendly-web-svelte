<script lang="ts">
    import Form12BCreate from './Form12BCreate.svelte';
    export let taxDeclaration;
    console.log(taxDeclaration, "taxDeclaration");

    let showModal = false;

    function handleFormSubmit(event: CustomEvent<any>) {
        const formData = event.detail;
        // TODO: Emit up or call API via page module
        console.log('Form12B submitted:', formData);
        // showModal = false;
    }
</script>

<div class="tax-declaration bg-white rounded-lg shadow-sm p-6 mb-6 max-w-5xl mx-auto relative">
    <div class="flex justify-end mb-4">
      <button
        class="btn btn-primary"
        on:click={() => showModal = true}
      >
        + New Form 12B
      </button>
    </div>

    
  <Form12BCreate open={showModal} taxDeclaration={taxDeclaration} on:submit={handleFormSubmit} on:cancel={() => showModal = false} />

  <!-- TODO: List of previous Form 12B entries here -->
</div>

<style>
  .btn {
    @apply px-4 py-2 rounded font-medium;
  }
  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700;
  }
</style>