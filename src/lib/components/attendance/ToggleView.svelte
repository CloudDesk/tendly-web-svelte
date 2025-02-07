<!-- ToggleView.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {Grid,List,ChartScatter} from 'lucide-svelte';
 
  export let viewMode: 'calendar' | 'list' |'heat';
  const dispatch = createEventDispatcher();

  function setViewMode(mode: 'calendar' | 'list'|'heat') {
    viewMode = mode;
    dispatch('viewModeChange', mode);
  }
</script>

<div class="toggle-view" role="group" aria-label="Toggle View">
  <button 
    class="btn" 
    class:active={viewMode === 'calendar'}
    on:click={() => setViewMode('calendar')}
    aria-label="Grid View"
    aria-pressed={viewMode === 'calendar'}
  >
    <div class="icon">
      <Grid />
    </div>
  </button>
  <button 
    class="btn" 
    class:active={viewMode === 'list'}
    on:click={() => setViewMode('list')}
    aria-label="List View"
    aria-pressed={viewMode === 'list'}
  >
    <div class="icon">
      <List />
    </div>
  </button>
  <button 
    class="btn" 
    class:active={viewMode === 'heat'}
    on:click={() => setViewMode('heat')}
    aria-label="Heat Map"
    aria-pressed={viewMode === 'heat'}
  >
    <div class="icon">
      <ChartScatter />
    </div>
  </button>
</div>

<style>
  .toggle-view {
    display: flex;
    gap: 0;
  }
  
  .btn {
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    background-color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn:first-child {
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
  }

  .btn:last-child {
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
    border-left: none;
  }

  .btn:hover {
    background-color: #f8fafc;
  }

  .btn.active {
    background-color: #f1f5f9;
  }

  .icon {
    width: 20px;
    height: 20px;
    color: #64748b;
  }

  .active .icon {
    color: #2563eb;
  }
</style>