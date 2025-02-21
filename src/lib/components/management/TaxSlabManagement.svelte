<script lang="ts">
  import Table from "$lib/components/common/Table.svelte";
  import Modal from "$lib/components/common/Modal.svelte";
  import { onMount } from "svelte";
  import type { TaxSlab } from "$lib/types/taxSlab";
  import { taxSlabApi } from "$lib/services/api";
  import TaxSlabForm from "./tax-slab/TaxSlabForm.svelte";
  import { page } from "$app/stores";
  import { writable } from "svelte/store";
  import { goto } from "$app/navigation";

  let taxSlabs: TaxSlab[] = [];
  let loading = false;
  let error: string | null = null;
  let showForm = false;
  let showDetails = false;
  let editingSlab: TaxSlab | null = null;
  let selectedSlab: TaxSlab | null = null;
  let searchQuery = writable("");
  let pagination = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const columns = [
    { key: "regime", label: "Regime" },
    { key: "financialYear", label: "Financial Year" },
    { key: "cessRate", label: "Cess Rate (%)" },
    { key: "standardDeduction", label: "Standard Deduction" },
    {
      key: "isActive",
      label: "Active",
      render: (row: TaxSlab) => (row.isActive ? "Yes" : "No"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: TaxSlab) =>
        row?._id
          ? `
            <button class="btn btn-sm btn-ghost" data-action="view" data-id="${row._id}">View</button>
            <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${row._id}">Edit</button>
            `
          : "",
    },
  ];

  async function loadTaxSlabs() {
    let search = $page.url.searchParams.get("search") || undefined;
    try {
      loading = true;
      const response = await taxSlabApi.list({
        page: pagination.page,
        limit: pagination.limit,
        search: search,
      });
      pagination = {
        total: response.meta?.total || 0,
        page: response.meta?.page || 1,
        limit: response.meta?.limit || 10,
        totalPages: response.meta?.totalPages || 1,
      };

      taxSlabs = response.data;
    } catch (err) {
      error = "Failed to load tax slabs";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function handleSubmit(event: CustomEvent) {
    console.log(event.detail, "formData");
    try {
      loading = true;
      const formData = event.detail;

      if (editingSlab?._id) {
        await taxSlabApi.update(editingSlab._id, formData);
      } else {
        await taxSlabApi.create(formData);
      }

      showForm = false;
      await loadTaxSlabs();
    } catch (err) {
      error = "Failed to save tax slab";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handleTableAction(e: CustomEvent) {
    const { action, id } = e.detail;
    const slab = taxSlabs.find((s) => s._id === id);
    if (!slab) return;

    if (action === "view") {
      selectedSlab = { ...slab };
      showDetails = true;
    } else if (action === "edit") {
      editingSlab = { ...slab };
      showForm = true;
    }
  }

  async function handlePageChange(event: CustomEvent) {
    try {
      loading = true;
      const { page: newPage } = event.detail;
      pagination.page = newPage;
      const url = new URL($page.url);
      url.searchParams.set("page", newPage.toString());
      await goto(url, { replaceState: true });
      await loadTaxSlabs();
    } finally {
      loading = false;
    }
  }

  async function handleSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    const url = new URL($page.url);
    url.searchParams.set("search", query);
    url.searchParams.set("page", "1");
    searchQuery.set(query);

    await goto(url, { replaceState: true });
    await loadTaxSlabs();
  }

  onMount(() => {
    loadTaxSlabs();
  });
</script>

<div class="container mx-auto py-6">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-semibold">Tax Slabs</h2>
    <div class="flex gap-4">
      <input
        type="text"
        class="input"
        placeholder="Search tax slabs..."
        bind:value={$searchQuery}
        on:input={handleSearch}
      />
      <button
        class="btn btn-primary flex items-center gap-2"
        on:click={() => {
          showForm = true;
          editingSlab = null;
        }}
      >
        Add Tax Slab
      </button>
    </div>
  </div>

  {#if error}
    <div class="alert alert-error">{error}</div>
  {/if}

  {#if loading}
    <div class="loading">Loading...</div>
  {:else}
    <Table
      {columns}
      data={taxSlabs}
      {loading}
      serverSide={true}
      meta={pagination}
      variant="transparent"
      showSearchInput={false}
      on:action={handleTableAction}
      on:page={handlePageChange}
      on:search={handleSearch}
    />
  {/if}
</div>

<!-- Add/Edit Modal -->
<Modal
  show={showForm}
  title={editingSlab?._id ? "Edit Tax Slab" : "New Tax Slab"}
  onClose={() => {
    showForm = false;
  }}
  wide={true}
>
  <TaxSlabForm
    initialData={editingSlab}
    readOnly={false}
    on:submit={handleSubmit}
  />
</Modal>

<!-- View Details Modal -->
<Modal
  show={showDetails}
  title="Tax Slab Details"
  onClose={() => {
    showDetails = false;
    selectedSlab = null;
  }}
  wide={true}
>
  <TaxSlabForm initialData={selectedSlab} readOnly={true} />
</Modal>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .input {
    @apply border border-gray-300 rounded px-4 py-2;
  }
  .btn {
    @apply bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded;
  }
  .alert {
    @apply bg-red-100 text-red-700 p-4 rounded;
  }
  .loading {
    @apply flex justify-center items-center py-8;
  }
</style>
