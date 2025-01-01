<script lang="ts">
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import "../app.css";

  $: isAuthPage = $page.url.pathname.startsWith('/login');
</script>

{#if isAuthPage}
  <slot />
{:else}
  <div class="app-layout">
    <nav class="sidebar">
      <div class="brand">
        <h1>HRMS</h1>
      </div>
      
      <div class="nav-links">
        <a 
          href="/" 
          class="nav-link" 
          class:active={$page.url.pathname === '/'}
        >
          <span class="icon">📊</span>
          Dashboard
        </a>
        <a 
          href="/employees" 
          class="nav-link" 
          class:active={$page.url.pathname.startsWith('/employees')}
        >
          <span class="icon">👥</span>
          Employees
        </a>
        <!-- Other nav links -->
      </div>

      <div class="user-section">
        <div class="user-info">
          <span class="avatar">{$auth.user?.name?.[0] || '?'}</span>
          <span class="name">{$auth.user?.name || 'User'}</span>
        </div>
        <button class="btn-logout" on:click={() => auth.logout()}>
          Logout
        </button>
      </div>
    </nav>

    <main>
      <slot />
    </main>
  </div>
{/if}

<style>
  /* Add modern styling for the layout */
  .app-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    min-height: 100vh;
  }

  .sidebar {
    background: white;
    border-right: 1px solid #e5e7eb;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
  }

  .brand {
    padding: 1rem;
    margin-bottom: 2rem;
  }

  .brand h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a1a;
  }

  .nav-links {
    flex: 1;
  }

  .nav-link {
    display: flex;
    align-items: center;
    padding: 0.875rem 1rem;
    color: #4b5563;
    text-decoration: none;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    transition: all 0.2s;
  }

  .nav-link:hover {
    background: #f3f4f6;
  }

  .nav-link.active {
    background: #667eea;
    color: white;
  }

  .icon {
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }

  .user-section {
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }

  .avatar {
    width: 40px;
    height: 40px;
    background: #667eea;
    color: white;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-weight: 500;
    margin-right: 0.75rem;
  }

  .name {
    font-weight: 500;
    color: #1a1a1a;
  }

  .btn-logout {
    width: 100%;
    padding: 0.75rem;
    background: #f3f4f6;
    border: none;
    border-radius: 0.5rem;
    color: #4b5563;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-logout:hover {
    background: #e5e7eb;
  }

  main {
    background: #f9fafb;
    padding: 2rem;
  }
</style> 