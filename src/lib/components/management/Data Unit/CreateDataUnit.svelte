<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { get } from "svelte/store";
  import Modal from "$lib/components/common/Modal.svelte";

  import InfoTab from "./InfoTab.svelte";
  import FieldsTab from "./FieldsTab.svelte";
  import FiltersTab from "./FiltersTab.svelte";
  import SortLimitTab from "./SortLimitTab.svelte";
  import ChildrenTab from "./ChildrenTab.svelte";
  import PreviewTab from "./PreviewTab.svelte";
  import { dataUnit } from "$lib/stores/dataUnit";

  let currentTab = "Info";
  const dispatch = createEventDispatcher();

  const initialDataUnit = {
    name: "",
    apiName: "",
    description: "",
    object: null,
    fields: [],
    filters: [],
    filterLogic: "",
    sort: [],
    sortFields: [], // Added missing property
    limit: 0, // Changed from null to 0
    children: [],
    type: "",
    preview: null,
    id: "", // Added missing property
  };

  let showModal = true; // Track modal visibility

  $: if (showModal) {
    dataUnit.set(initialDataUnit); // Reset the dataUnit store when the modal is opened
  }

  function setTab(tab: string) {
    currentTab = tab;
  }

  function closeModal() {
    showModal = false; // Hide the modal
    dispatch("close");
    location.reload(); // Reload the page
  }

  function openModal() {
    showModal = true; // Show the modal
  }

  async function saveDataUnit() {
    try {
      const $dataUnit = get(dataUnit);

      if (!$dataUnit.name) {
        alert("Please enter a name for the Data Unit");
        return;
      }

      dispatch("save", $dataUnit);
      closeModal();
    } catch (error) {
      console.error("Error saving Data Unit:", error);
      alert("Failed to save Data Unit");
    }
  }

  function updateDataUnit(event: CustomEvent) {
    console.log(event.detail, "eventdetail");
    dataUnit.update((current) => {
      if (event.detail?.object) {
        return {
          ...current,
          ...event.detail,
          fields: [],
          filters: [],
          filterLogic: "",
          sort: [],
          limit: 0,
          children: [],
          preview: null,
        };
      } else {
        return { ...current, ...event.detail };
      }
    });
  }
</script>

<Modal
  title="Create New Data Unit"
  show={showModal}
  wide={true}
  on:close={closeModal}
  onClose={closeModal}
>
  <div class="tabs flex justify-between mb-4">
    {#each ["Info", "Fields", "Filters", "Sort & Limit", "Preview"] as tab}
      <button
        on:click={() => setTab(tab)}
        class="btn {currentTab === tab ? 'btn-active' : 'btn-inactive'}"
      >
        {tab}
      </button>
    {/each}
  </div>

  <!-- Tab Content -->
  {#if currentTab === "Info"}
    <InfoTab InfoData={dataUnit} on:update={updateDataUnit} />
  {:else if currentTab === "Fields"}
    <FieldsTab {dataUnit} on:update={updateDataUnit} />
  {:else if currentTab === "Filters"}
    <FiltersTab DataUnit={$dataUnit} on:update={updateDataUnit} />
  {:else if currentTab === "Sort & Limit"}
    <SortLimitTab {dataUnit} on:update={updateDataUnit} />
    <!-- {:else if currentTab === "Children"}
    <ChildrenTab {dataUnit} on:update={updateDataUnit} /> -->
  {:else if currentTab === "Preview"}
    <PreviewTab dataUnitt={$dataUnit} on:update={updateDataUnit} />
  {/if}

  <div class="modal-footer flex justify-end space-x-2 mt-4">
    <button
      class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-md transition"
      on:click={closeModal}
    >
      Cancel
    </button>
    <button
      class="px-4 py-2 bg-yellow-500 text-white rounded-md
                   hover:bg-yellow-600 transition"
      on:click={saveDataUnit}
    >
      Create Data Unit
    </button>
  </div>
</Modal>

<button
  class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
  on:click={openModal}
>
  Open Modal
</button>

<style>
  .tabs {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  .tabs button {
    flex-grow: 1;
    margin: 0 2px;
    padding: 0.5rem 1rem;
    border: none;
    cursor: pointer;
    transition: color 0.3s ease;
  }
  .btn-active {
    color: #1d4ed8;
  }
  .btn-inactive {
    color: #1a1a1a;
  }
  .btn-inactive:hover {
    color: rgba(29, 78, 216, 0.7);
  }
</style>
