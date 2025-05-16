<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { fade, fly } from "svelte/transition";
  import { loginController } from "./controller";
  import { t, locale } from "svelte-i18n"; // Import $t and $locale
  import { languageStore } from "$lib/stores/language"; // Import languageStore

  type View = "login" | "forgot-password" | "reset-password";
  let currentView: View = "login";
  let token = "";
  let email = "";
  let password = "";
  let confirmPassword = "";
  let error = "";
  let success = "";
  let loading = false;

  // Available languages
  const languages = [
    { value: "en", label: "English" },
    { value: "ta", label: "தமிழ்" },
  ];

  // Sync with languageStore
  let selectedLanguage: string;
  locale.subscribe((lang) => {
    selectedLanguage = lang || "en";
  });

  function handleLanguageChange(event: Event) {
    const lang = (event.target as HTMLSelectElement).value;
    languageStore.set(lang);
  }

  onMount(() => {
    const view = $page.url.searchParams.get("view") as View;
    if (view && ["login", "forgot-password", "reset-password"].includes(view)) {
      currentView = view;
    }

    const urlToken = $page.url.searchParams.get("token");
    if (urlToken && currentView === "reset-password") {
      token = urlToken;
    }
  });

  function switchView(view: View, params: Record<string, string> = {}) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    goto(url.toString());
    currentView = view;
    clearMessages();
  }

  function clearMessages() {
    error = "";
    success = "";
  }

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = "";

    try {
      await loginController.login(email, password);
      languageStore.set(selectedLanguage); // Re-apply the selected language
    } catch (err: any) {
      console.error(err);
      error = err.message || $t("login.error.invalid_credentials");
    } finally {
      loading = false;
    }
  }

  async function handleForgotPassword(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = "";
    success = "";

    try {
      let result = await loginController.forgotPassword(email);
      console.log(result, "result handleForgotPassword");
      success = "";
      email = "";
    } catch (err: any) {
      console.error(err);
      error = err.message || "Failed to send reset link"; // Add this to translations if needed
    } finally {
      loading = false;
    }
  }

  async function validateToken() {
    if (!token) return;

    loading = true;
    error = "";
    console.log("Validating token:", token);
    try {
      let result = await loginController.validateResetToken(token);
      console.log(result, "result validateToken");
    } catch (err: any) {
      error = err.message || "Invalid or expired reset token"; // Add this to translations if needed
    } finally {
      loading = false;
    }
  }

  async function handleResetPassword(e: SubmitEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      error = $t("reset_password.passwords_do_not_match");
      return;
    }

    loading = true;
    error = "";

    try {
      await loginController.resetPassword(token, password);
      success = $t("reset_password.success");
      setTimeout(() => {
        switchView("login");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      error = err.message || "Failed to reset password"; // Add this to translations if needed
    } finally {
      loading = false;
    }
  }
</script>

<div class="auth-page" in:fade={{ duration: 300 }}>
  <div class="auth-container" in:fly={{ y: 20, duration: 400, delay: 200 }}>
    <div class="auth-box">
      <!-- Language Selector -->
      <div
        class="language-selector"
        style="text-align: right; margin-bottom: 1rem;"
      >
        <select bind:value={selectedLanguage} on:change={handleLanguageChange}>
          {#each languages as lang}
            <option value={lang.value}>{lang.label}</option>
          {/each}
        </select>
      </div>
      <div class="brand">
        <h1>{$t("login.title")}</h1>
        {#if currentView === "login"}
          <p>{$t("login.subtitle")}</p>
        {:else if currentView === "forgot-password"}
          <p>{$t("forgot_password.title")}</p>
        {:else if currentView === "reset-password"}
          <p>{$t("reset_password.title")}</p>
        {/if}
      </div>

      {#if error}
        <div
          class="error-alert"
          role="alert"
          in:fly={{ y: -10, duration: 300 }}
        >
          {error}
          {#if currentView === "reset-password" && error.includes("expired")}
            <p class="mt-2">
              <button
                type="button"
                class="link-button"
                on:click={() => switchView("forgot-password")}
              >
                {$t("forgot_password.send_reset_link")}
              </button>
            </p>
          {/if}
        </div>
      {/if}

      {#if success}
        <div
          class="success-alert"
          role="alert"
          in:fly={{ y: -10, duration: 300 }}
        >
          {success}
        </div>
      {/if}

      {#if currentView === "login"}
        <form on:submit={handleLogin}>
          <div class="form-group">
            <label for="email">{$t("login.email_label")}</label>
            <div class="input-wrapper">
              <input
                type="email"
                id="email"
                bind:value={email}
                required
                disabled={loading}
                placeholder={$t("login.email_placeholder")}
                class:loading
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">{$t("login.password_label")}</label>
            <div class="input-wrapper">
              <input
                type="password"
                id="password"
                bind:value={password}
                required
                disabled={loading}
                placeholder={$t("login.password_placeholder")}
                class:loading
              />
            </div>
          </div>

          <div class="forgot-password">
            <button
              type="button"
              class="link-button"
              on:click={() => switchView("forgot-password")}
            >
              {$t("login.forgot_password")}
            </button>
          </div>

          <button type="submit" class="btn-auth" disabled={loading}>
            {#if loading}
              <span class="loader"></span>
            {:else}
              {$t("login.sign_in")}
            {/if}
          </button>
        </form>
      {:else if currentView === "forgot-password"}
        <form on:submit={handleForgotPassword}>
          <div class="form-group">
            <label for="email">{$t("login.email_label")}</label>
            <div class="input-wrapper">
              <input
                type="email"
                id="email"
                bind:value={email}
                required
                disabled={loading}
                placeholder={$t("login.email_placeholder")}
                class:loading
              />
            </div>
          </div>

          <button type="submit" class="btn-auth" disabled={loading}>
            {#if loading}
              <span class="loader"></span>
            {:else}
              {$t("forgot_password.send_reset_link")}
            {/if}
          </button>

          <div class="back-link">
            <button
              type="button"
              class="link-button"
              on:click={() => switchView("login")}
            >
              {$t("forgot_password.back_to_login")}
            </button>
          </div>
        </form>
      {:else if currentView === "reset-password"}
        {#if !error || !error.includes("expired")}
          <form on:submit={handleResetPassword}>
            <div class="form-group">
              <label for="password"
                >{$t("reset_password.new_password_label")}</label
              >
              <div class="input-wrapper">
                <input
                  type="password"
                  id="password"
                  bind:value={password}
                  required
                  disabled={loading}
                  placeholder={$t("reset_password.new_password_placeholder")}
                  minlength="8"
                  class:loading
                />
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword"
                >{$t("reset_password.confirm_password_label")}</label
              >
              <div class="input-wrapper">
                <input
                  type="password"
                  id="confirmPassword"
                  bind:value={confirmPassword}
                  required
                  disabled={loading}
                  placeholder={$t(
                    "reset_password.confirm_password_placeholder"
                  )}
                  minlength="8"
                  class:loading
                />
              </div>
            </div>

            <button type="submit" class="btn-auth" disabled={loading}>
              {#if loading}
                <span class="loader"></span>
              {:else}
                {$t("reset_password.reset_password")}
              {/if}
            </button>

            <div class="back-link">
              <button
                type="button"
                class="link-button"
                on:click={() => switchView("login")}
              >
                {$t("reset_password.back_to_login")}
              </button>
            </div>
          </form>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .auth-container {
    width: 100%;
    max-width: 420px;
    /* padding: 0 20px; */
  }

  .auth-box {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 2.5rem;
    border-radius: 1rem;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .brand {
    text-align: center;
    margin-bottom: 2rem;
  }

  .brand h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #1a1a1a;
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
    font-size: 0.9rem;
    color: #374151;
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
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .btn-auth {
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

  .btn-auth:hover {
    background: #5a67d8;
  }

  .btn-auth:disabled {
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

  .success-alert {
    background-color: #d1e7dd;
    color: #0f5132;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 20px;
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

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .forgot-password {
    text-align: right;
    margin-bottom: 15px;
    font-size: 0.9rem;
  }

  .back-link {
    text-align: center;
    margin-top: 15px;
  }

  .link-button {
    background: none;
    border: none;
    color: #4a90e2;
    cursor: pointer;
    font-size: inherit;
    padding: 0;
    text-decoration: underline;
  }

  .link-button:hover {
    color: #3b7dce;
  }

  .mt-2 {
    margin-top: 10px;
  }
</style>
