<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { dataunitApi } from "$lib/services/api";

  interface DataUnit {
    name: string;
    apiName: string;
    object: string;
    description?: string;
  }

  export let InfoData: DataUnit;

  console.log(InfoData, "dataUnitdataUnitdataUnit");
  const dispatch = createEventDispatcher();
  let collections: string[] = []; // Store fetched collections

  function handleNameChange(event: Event) {
    const name = (event.target as HTMLInputElement).value;
    const apiName = name.replace(/\s+/g, "_").toLowerCase();

    InfoData.name = name;
    InfoData.apiName = apiName;

    dispatch("update", { name, apiName });
  }

  function handleObjectSelect(event: Event) {
    const object = (event.target as HTMLSelectElement).value;

    // Update the object in the dataUnit store
    InfoData.object = object;

    // Dispatch an update event to notify parent components
    dispatch("update", { object });
  }

  async function getCollection() {
    try {
      const response = await dataunitApi.getCollections();
      console.log(response, "responseresponseresponse");
      collections = response.data || []; // Ensure collections is always an array
      console.log(collections, "Fetched Collections");
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  }
  onMount(getCollection);
</script>

<div class="data-unit-creation-container p-6">
  <div class="space-y-4">
    <div class="form-group">
      <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
        Name
      </label>
      <input
        id="name"
        type="text"
        class="w-full px-3 py-2 border border-gray-300 rounded-md
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       transition duration-200"
        bind:value={InfoData.name}
        on:input={handleNameChange}
        placeholder="Enter Data Unit Name"
      />
    </div>

    <div class="form-group">
      <label for="apiName" class="block text-sm font-medium text-gray-700 mb-2">
        API Name
      </label>
      <input
        id="apiName"
        type="text"
        class="w-full px-3 py-2 border border-gray-300 rounded-md
                       bg-gray-100 cursor-not-allowed"
        bind:value={InfoData.apiName}
        readonly
        placeholder="Automatically generated"
      />
    </div>
    <div class="form-group">
      <label for="object" class="block text-sm font-medium text-gray-700 mb-2">
        Object
      </label>
      <select
        id="object"
        class="w-full px-3 py-2 border border-gray-300 rounded-md
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       transition duration-200"
        bind:value={InfoData.object}
        on:change={handleObjectSelect}
      >
        <option value="">Select Salesforce object...</option>
        {#each collections as collection}
          <option value={collection}>{collection}</option>
        {/each}
      </select>
    </div>
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
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       transition duration-200"
        bind:value={InfoData.description}
        placeholder="Optional description"
        rows="4"
      ></textarea>
    </div>
  </div>
</div>
