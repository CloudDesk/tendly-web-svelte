<script lang="ts">
  import { browser } from '$app/environment';


  let biometricId = '';
  let message = '';
  let messageType: 'success' | 'error' | '' = '';

  let base_url = import.meta.env.VITE_API_BASE_URL
  async function handleSwipe() {
    if (!biometricId) return;
    
    try {
      const response = await fetch(`${base_url}/attendance/swipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ biometricId })
      });

      if (!response.ok) {
        throw new Error('Failed to record attendance');
      }

      messageType = 'success';
      message = 'Attendance recorded successfully!';
      biometricId = ''; // Clear the input
    } catch (error) {
      messageType = 'error';
      message = 'Failed to record attendance';
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      message = '';
      messageType = '';
    }, 3000);
  }

  // Auto-focus the input field
  let inputElement: HTMLInputElement;
  $: if (browser && inputElement) {
    inputElement.focus();
  }
</script>

<div class="min-h-screen bg-base-200 flex items-center justify-center">
  <div class="w-96">
    <form 
      on:submit|preventDefault={handleSwipe}
      class="bg-base-100 shadow-sm rounded-box p-6"
    >
      <input
        bind:this={inputElement}
        bind:value={biometricId}
        type="text"
        placeholder="Swipe your card"
        class="input input-bordered w-full"
        autocomplete="off"
      />

      {#if message}
        <div 
          class="mt-4 text-sm {messageType === 'success' ? 'text-success' : 'text-error'}"
        >
          {message}
        </div>
      {/if}
    </form>
  </div>
</div> 