<script lang="ts">
  import { auth } from "$lib/stores/auth";
  import {
    Calendar,
    Mail,
    Briefcase,
    Shield,
    Users,
    Settings,
    Edit,
  } from "lucide-svelte";
  import LeaveSummary from "$lib/components/dashboard/LeaveSummary.svelte";
  import CurrentShift from "$lib/components/dashboard/CurrentShift.svelte";
  import { t, locale } from "svelte-i18n";
  import { languageStore } from "$lib/stores/language";

  const languages = [
    { value: "en", label: "English" },
    { value: "ta", label: "தமிழ்" },
  ];

  let selectedLanguage: string;
  locale.subscribe((lang) => {
    selectedLanguage = lang || "en";
  });

  function handleLanguageChange(event: Event) {
    const lang = (event.target as HTMLSelectElement).value;
    languageStore.set(lang);
  }

  $: formattedJoiningDate = $auth.user?.joiningDate
    ? new Date($auth.user.joiningDate).toLocaleDateString($locale || "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  $: formattedDepartment = $auth.user?.departmentId
    ? $auth.user?.departmentId
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "N/A";

  $: firstLetter = $auth.user?.name
    ? $auth.user.name.charAt(0).toUpperCase()
    : "N";
</script>

<div class="min-h-screen bg-gray-50 flex">
  <main class="flex-1 p-6 md:p-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800">
        {$t("profile.page_title")}
      </h1>
      <div class="language-selector">
        <label for="language" class="mr-2 text-gray-600"
          >{$t("profile.preferred_language_label")}</label
        >
        <select
          id="language"
          bind:value={selectedLanguage}
          on:change={handleLanguageChange}
        >
          {#each languages as lang}
            <option value={lang.value}>{lang.label}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="bg-white rounded-xl p-6 md:p-8 shadow-sm">
      <div class="flex items-center gap-4 mb-6">
        <div
          class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center"
        >
          <span class="text-2xl font-bold text-white">{firstLetter}</span>
        </div>
        <div>
          <h2 class="text-xl font-semibold text-gray-800">
            {$auth.user?.name || "N/A"}
          </h2>
          <p class="text-gray-600 flex items-center gap-2">
            <Briefcase class="w-4 h-4" />
            {$auth.user?.role || "N/A"}
          </p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="flex items-start gap-3">
          <Mail class="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <p class="text-sm font-medium text-gray-500">
              {$t("profile.email_field_label")}
            </p>
            <p class="text-gray-800">{$auth.user?.email || "N/A"}</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <Users class="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <p class="text-sm font-medium text-gray-500">
              {$t("profile.department_field_label")}
            </p>
            <p class="text-gray-800">{formattedDepartment}</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <Shield class="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <p class="text-sm font-medium text-gray-500">
              {$t("profile.manager_field_label")}
            </p>
            <p class="text-gray-800">{$auth.user?.managerName || "N/A"}</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <Calendar class="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <p class="text-sm font-medium text-gray-500">
              {$t("profile.joining_date_field_label")}
            </p>
            <p class="text-gray-800">{formattedJoiningDate}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
      <LeaveSummary />
      <CurrentShift />
    </div>
  </main>
</div>

<style>
  button:hover {
    transform: translateY(-1px);
  }
  .language-selector select {
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    background: #fff;
    cursor: pointer;
  }
</style>
