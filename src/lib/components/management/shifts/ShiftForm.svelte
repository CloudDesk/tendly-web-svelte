<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Shift } from '$lib/types';
  import { shiftsApi } from '$lib/services/api/';

  export let shift: Partial<Shift> = {};
  
  const dispatch = createEventDispatcher();
  let loading = false;
  let error: string | null = null;

  async function handleSubmit() {
    try {
      loading = true;
      if (shift._id) {
        await shiftsApi.update(shift._id, shift);
      } else {
        await shiftsApi.create(shift as Omit<Shift, '_id'>);
      }
      dispatch('submit');
    } catch (err) {
      error = 'Failed to save shift';
      console.error(err);
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  {#if error}
    <div class="alert alert-error">{error}</div>
  {/if}

  <div class="form-control">
    <label class="label">Name</label>
    <input 
      type="text" 
      class="input input-bordered" 
      bind:value={shift.name}
      required
    />
  </div>

  <div class="form-control">
    <label class="label">Code</label>
    <input 
      type="text" 
      class="input input-bordered" 
      bind:value={shift.code}
      required
    />
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div class="form-control">
      <label class="label">Start Time</label>
      <input 
        type="time" 
        class="input input-bordered" 
        bind:value={shift.startTime}
        required
      />
    </div>

    <div class="form-control">
      <label class="label">End Time</label>
      <input 
        type="time" 
        class="input input-bordered" 
        bind:value={shift.endTime}
        required
      />
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div class="form-control">
      <label class="label">Shift Window Start</label>
      <input 
        type="time" 
        class="input input-bordered" 
        bind:value={shift.shiftWindowStart}
        required
      />
    </div>

    <div class="form-control">
      <label class="label">Shift Window End</label>
      <input 
        type="time" 
        class="input input-bordered" 
        bind:value={shift.shiftWindowEnd}
        required
      />
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div class="form-control">
      <label class="label">Valid From</label>
      <input 
        type="date" 
        class="input input-bordered" 
        bind:value={shift.validFrom}
        required
      />
    </div>

    <div class="form-control">
      <label class="label">Valid Till</label>
      <input 
        type="date" 
        class="input input-bordered" 
        bind:value={shift.validTill}
      />
    </div>
  </div>

  <div class="form-control">
    <label class="label">Grace Time (minutes)</label>
    <input 
      type="number" 
      class="input input-bordered" 
      bind:value={shift.graceTimeInMinutes}
      min="0"
      max="60"
    />
  </div>

  <div class="flex justify-end gap-2">
    <button 
      type="button" 
      class="btn btn-ghost"
      on:click={() => dispatch('close')}
    >Cancel</button>
    <button 
      type="submit" 
      class="btn btn-primary"
      disabled={loading}
    >
      {loading ? 'Saving...' : 'Save'}
    </button>
  </div>
</form>