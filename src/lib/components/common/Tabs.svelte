<script lang="ts">
  export let tabs: { id: string; label: string }[];
  export let activeTab: string;
</script>

<div class="tabs">
  {#each tabs as tab}
    <button
      class="tab-button"
      class:active={activeTab === tab.id}
      on:click={() => activeTab = tab.id}
    >
      {tab.label}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 1.5rem;
    gap: 0.5rem;
  }

  .tab-button {
    padding: 0.75rem 1.5rem;
    border: none;
    background: none;
    color: #6b7280;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }

  .tab-button:hover {
    color: var(--primary-color);
  }

  .tab-button.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
  }
</style> 