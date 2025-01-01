<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import { api } from '$lib/services/api';
  import { fade, fly } from 'svelte/transition';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;
  let redirectTo = '/employees';

  onMount(() => {
    // Get redirect path from cookie if exists
    const cookies = document.cookie.split(';');
    const redirectCookie = cookies.find(c => c.trim().startsWith('redirectTo='));
    if (redirectCookie) {
      redirectTo = redirectCookie.split('=')[1];
      // Clear the redirect cookie
      document.cookie = 'redirectTo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  });

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = '';

    try {
      const response = await api.auth.login(email, password);
      await auth.login(response.data.token, response.data.user);
      goto(redirectTo);
    } catch (e: any) {
      error = e.message || 'Invalid credentials';
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-page" in:fade={{ duration: 300 }}>
  <div class="login-container" in:fly={{ y: 20, duration: 400, delay: 200 }}>
    <div class="login-box">
      <div class="brand">
        <h1>HRMS</h1>
        <p>Next Generation HR Management</p>
      </div>
      
      {#if error}
        <div class="error-alert" role="alert" in:fly={{ y: -10, duration: 300 }}>
          {error}
        </div>
      {/if}

      <form on:submit={handleLogin}>
        <div class="form-group">
          <label for="email">Email</label>
          <div class="input-wrapper">
            <input
              type="email"
              id="email"
              bind:value={email}
              required
              disabled={loading}
              placeholder="Enter your email"
              class:loading
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <input
              type="password"
              id="password"
              bind:value={password}
              required
              disabled={loading}
              placeholder="Enter your password"
              class:loading
            />
          </div>
        </div>

        <button type="submit" class="btn-login" disabled={loading}>
          {#if loading}
            <span class="loader"></span>
          {:else}
            Sign In
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .login-container {
    width: 100%;
    max-width: 420px;
  }

  .login-box {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 2.5rem;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .brand {
    text-align: center;
    margin-bottom: 2rem;
  }

  .brand h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  .brand p {
    color: #666;
    font-size: 0.95rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
  }

  .input-wrapper {
    position: relative;
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.2s;
  }

  input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    outline: none;
  }

  input.loading {
    background: #f3f4f6;
  }

  .btn-login {
    width: 100%;
    padding: 0.875rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-login:hover {
    background: #5a67d8;
  }

  .btn-login:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error-alert {
    background: #fee2e2;
    border: 1px solid #ef4444;
    color: #b91c1c;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .loader {
    width: 20px;
    height: 20px;
    border: 3px solid #ffffff;
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style> 