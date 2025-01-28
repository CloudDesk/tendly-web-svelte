<script lang="ts">
  import type { User } from '$lib/types';

  interface OrgNode extends User {
    children: OrgNode[];
    isExpanded: boolean;
  }

  export let node: OrgNode;

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  function getRoleColor(role: string): string {
    switch (role) {
      case 'ceo':
        return 'from-blue-800 to-blue-900';
      case 'admin':
        return 'from-blue-700 to-blue-800';
      case 'manager':
        return 'from-blue-500 to-blue-600';
      case 'staff':
        return 'from-blue-400 to-blue-500';
      default:
        return 'from-blue-500 to-blue-600';
    }
  }

  function toggleNode(node: OrgNode): void {
    node.isExpanded = !node.isExpanded;
  }
</script>

<div class="node-wrapper">
  <div class="node-container" on:click={() => toggleNode(node)}>
    <!-- Hexagon frame with image/initials -->
    <div class="hexagon-frame">
      <div class="hexagon-content">
        {#if node.image}
          <img src={node.image} alt={node.name} class="profile-image" />
        {:else}
          <div class="initials-fallback">
            {getInitials(node.name)}
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Cloud-shaped card -->
    <div class="profile-card bg-gradient-to-b {getRoleColor(node.role)}">
      <div class="card-content">
        <h3 class="name">{node.name}</h3>
        <p class="role">{node.role.toUpperCase()}</p>
      </div>
    </div>
  </div>

  {#if node.children && node.children.length > 0 && node.isExpanded}
    <div class="children-container">
      {#each node.children as child}
        <svelte:self node={child} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .node-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    min-width: min-content;
  }

  .node-container {
    position: relative;
    width: 200px;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  @media (max-width: 640px) {
    .node-container {
      width: 160px;
    }
  }

  .node-container:hover {
    transform: translateY(-2px);
  }

  .hexagon-frame {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 0 auto;
    z-index: 10;
    /* Position hexagon to overlap card center */
    margin-bottom: -50px;
  }

  @media (max-width: 640px) {
    .hexagon-frame {
      width: 80px;
      height: 80px;
      margin-bottom: -40px;
    }
  }

  .hexagon-content {
    width: 100%;
    height: 100%;
    position: relative;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    background: white;
    padding: 3px;
  }

  .profile-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  }

  .initials-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e5e7eb;
    font-size: 1.5rem;
    font-weight: bold;
    color: #4b5563;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  }

  .profile-card {
    position: relative;
    /* Reduced padding top to account for larger hexagon */
    padding: 3.5rem 1.25rem 1.25rem;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06);
    min-height: 100px; /* Ensure minimum height for content */
  }

  @media (max-width: 640px) {
    .profile-card {
      padding: 3rem 1rem 1rem;
      min-height: 80px;
    }
  }

  .profile-card::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 0;
    right: 0;
    height: 30px;
    background: inherit;
    filter: blur(10px);
    opacity: 0.7;
    z-index: -1;
  }

  .card-content {
    text-align: center;
    color: white;
  }

  .name {
    font-weight: 600;
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
    word-break: break-word;
  }

  @media (max-width: 640px) {
    .name {
      font-size: 1rem;
    }
  }

  .role {
    font-size: 0.875rem;
    opacity: 0.9;
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .role {
      font-size: 0.75rem;
    }
  }

  .children-container {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
    position: relative;
    flex-wrap: wrap;
  }

  @media (max-width: 640px) {
    .children-container {
      gap: 0.5rem;
      margin-top: 1.5rem;
    }
  }

  .children-container::before {
    content: '';
    position: absolute;
    top: -2rem;
    left: 50%;
    width: 2px;
    height: 2rem;
    background-color: #93c5fd;
  }

  @media (max-width: 640px) {
    .children-container::before {
      top: -1.5rem;
      height: 1.5rem;
    }
  }
</style>