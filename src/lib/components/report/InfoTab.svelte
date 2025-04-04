<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { collectionsApi, type IReportDataUnit } from "$lib/services/api";
  import { fade } from "svelte/transition";
  import { Database, HelpCircle } from "lucide-svelte";
  import LoaderNew from "$lib/components/common/LoaderNew.svelte";

  export let dataUnit: Partial<IReportDataUnit>;

  console.log(dataUnit, "dataUnitdataUnitdataUnit");
  const dispatch = createEventDispatcher();
  let collections: string[] = []; // Store fetched collections
  let isLoading = false;
  let error = "";
  let tooltipVisible = false;

  function handleNameChange(event: Event) {
    const name = (event.target as HTMLInputElement).value;
    const apiName = name.replace(/\s+/g, "_").toLowerCase();
    dataUnit.name = name;
    dataUnit.apiName = apiName;
    dispatch("update", { name, apiName });
  }

  function handleObjectSelect(event: Event) {
    const object = (event.target as HTMLSelectElement).value;
    dataUnit.object = object;
    dispatch("update", { object });
  }

  function handleDescriptionChange(event: Event) {
    const description = (event.target as HTMLTextAreaElement).value;
    dataUnit.description = description;
    dispatch("update", { description });
  }

  async function getCollection() {
    try {
      isLoading = true;
      error = "";
      const response = await collectionsApi.getCollections();
      console.log(response, "responseresponseresponse");
      collections = response.data || []; // Ensure collections is always an array
      console.log(collections, "Fetched Collections");
    } catch (error) {
      error = "Failed to fetch collections";
      console.error("Error fetching collections:", error);
    } finally {
      isLoading = false;
    }
  }
  onMount(getCollection);
</script>

<div class="space-y-6" in:fade={{ duration: 300 }}>
  {#if error}
    <div
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4"
    >
      {error}
    </div>
  {/if}

  {#if isLoading}
    <LoaderNew />
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Name Field -->
      <div class="form-group">
        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
          Name <span class="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md
               focus:outline-none focus:ring-2 focus:ring-yellow-500
               transition duration-200"
          bind:value={dataUnit.name}
          on:input={handleNameChange}
          placeholder="Enter Data Unit Name"
          aria-required="true"
        />
        <p class="mt-1 text-xs text-gray-500">
          A descriptive name for your data unit
        </p>
      </div>

      <!-- API Name Field -->
      <div class="form-group">
        <label
          for="apiName"
          class="block text-sm font-medium text-gray-700 mb-2 flex items-center"
        >
          API Name
          <button
            on:click={() => (tooltipVisible = !tooltipVisible)}
            class="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <HelpCircle size={16} />
          </button>
        </label>

        {#if tooltipVisible}
          <div
            class="bg-gray-800 text-white p-2 rounded text-xs mb-2"
            transition:fade={{ duration: 100 }}
          >
            Auto-generated from the name. Used in API calls.
          </div>
        {/if}

        <input
          id="apiName"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md
               bg-gray-50 cursor-not-allowed"
          bind:value={dataUnit.apiName}
          readonly
          placeholder="Automatically generated"
        />
      </div>
    </div>

    <!-- Object Selection -->
    <div class="form-group">
      <label for="object" class="block text-sm font-medium text-gray-700 mb-2">
        Object <span class="text-red-500">*</span>
      </label>
      <div class="relative">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"
        >
          <Database size={18} />
        </div>
        <select
          id="object"
          class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md
               focus:outline-none focus:ring-2 focus:ring-yellow-500
               transition duration-200 appearance-none"
          bind:value={dataUnit.object}
          on:change={handleObjectSelect}
          aria-required="true"
          disabled={isLoading}
        >
          <option value="">Select Object...</option>
          {#each collections as collection}
            <option value={collection}>{collection}</option>
          {/each}
        </select>
        <div
          class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"
        >
          <svg
            class="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </div>
      </div>
      {#if isLoading}
        <p class="mt-1 text-xs text-blue-500">Loading collections...</p>
      {/if}
    </div>

    <!-- Description Field -->
    <div class="form-group">
      <label
        for="description"
        class="block text-sm font-medium text-gray-700 mb-2"
      >
        Description
      </label>
      <textarea
        id="description"
        class="w-full px-3 py-2 border border-gray-300 rounded-md
             focus:outline-none focus:ring-2 focus:ring-yellow-500
             transition duration-200"
        bind:value={dataUnit.description}
        placeholder="Provide a clear description of this data unit's purpose"
        rows="4"
      ></textarea>
      <p class="mt-1 text-xs text-gray-500">
        Optional: Describe the purpose and usage of this data unit
      </p>
    </div>
  {/if}
</div>
