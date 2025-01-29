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
    <div class="card-wrapper">
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
    width: 100%;
    max-width: 100vw;
    padding: 0.5rem;
  }

  .node-container {
    width: 100%;
    max-width: 300px;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .card-wrapper {
    position: relative;
    width: 100%;
    padding-top: 2rem;
  }

  .node-container:hover {
    transform: translateY(-2px);
  }

  .hexagon-frame {
    position: absolute;
    width: 80px;
    height: 80px;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    z-index: 10;
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
    font-size: 1.25rem;
    font-weight: bold;
    color: #4b5563;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  }

  .profile-card {
    position: relative;
    padding: 3rem 1.5rem 1.5rem;
    border-radius: 28px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06);
    min-height: 120px;
  }

  .profile-card::before,
  .profile-card::after {
    content: '';
    position: absolute;
    background: inherit;
    border-radius: 50%;
  }

  .profile-card::before {
    width: 40%;
    height: 40px;
    top: -20px;
    left: 5%;
    filter: blur(8px);
    opacity: 0.7;
  }

  .profile-card::after {
    width: 30%;
    height: 30px;
    top: -15px;
    right: 5%;
    filter: blur(8px);
    opacity: 0.7;
  }

  .card-content {
    text-align: center;
    color: white;
    padding-top: 0.5rem;
  }

  .name {
    font-weight: 600;
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    word-break: break-word;
  }

  .role {
    font-size: 0.875rem;
    opacity: 0.9;
    font-weight: 500;
  }

  .children-container {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 2.5rem;
    position: relative;
    flex-wrap: wrap;
    width: 100%;
  }

  .children-container::before {
    content: '';
    position: absolute;
    top: -2.5rem;
    left: 50%;
    width: 2px;
    height: 2.5rem;
    background-color: #93c5fd;
  }

  @media (max-width: 640px) {
    .node-container {
      max-width: 260px;
    }

    .hexagon-frame {
      width: 60px;
      height: 60px;
    }

    .profile-card {
      padding: 2.5rem 1.25rem 1.25rem;
      min-height: 100px;
      border-radius: 24px;
    }

    .name {
      font-size: 1.125rem;
    }

    .role {
      font-size: 0.75rem;
    }

    .children-container {
      gap: 1rem;
      margin-top: 2rem;
    }

    .children-container::before {
      top: -2rem;
      height: 2rem;
    }
  }
</style>