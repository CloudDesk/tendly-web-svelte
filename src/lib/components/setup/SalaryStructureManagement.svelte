<script lang="ts">
  import Table from "$lib/components/common/Table.svelte";
  import Modal from "$lib/components/common/Modal.svelte";
  import { onMount } from "svelte";
  import type { SalaryStructure } from "$lib/types";
  import { salaryStructureApi } from "$lib/services/api/salaryStructure";
  import SalaryStructureForm from "./salary-structure/SalaryStructureForm.svelte";
  import { page } from "$app/stores";
  import { getSelectLabel } from "$lib/utils/select";
  import { taxTerms } from "$lib/constants/users";
  import { goto } from "$app/navigation";
  import { writable } from "svelte/store";

  let salaryStructures: SalaryStructure[] = [];
  let loading = false;
  let error: string | null = null;
  let showForm = false;
  let showDetails = false;
  let editingStructure: SalaryStructure | null = {
    name: "",
    fixedEarnings: {
      basicPercentage: 0,
      hraPercentage: 0,
      otherAllowancePercentage: 0,
      daPercentage: 0,
    },
    statutoryDeductions: {
      professionalTax: {
        state: "",
        term: "",
        slabs: [],
      },
      epf: {
        employeeContribution: 0,
        employerContribution: 0,
        maxLimit: 0,
      },
      esi: {
        employeeContribution: 0,
        employerContribution: 0,
        applicabilityLimit: 0,
      },
    },
  };
  let selectedStructure: SalaryStructure | null = null;
  let searchQuery = writable("");
  let pagination = {
    total: 0,
    page: 1,
    limit: 2,
    totalPages: 1,
  };

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "basic",
      label: "Basic (%)",
      render: (row: SalaryStructure) => `${row.fixedEarnings.basicPercentage}%`,
    },
    {
      key: "hra",
      label: "HRA (%)",
      render: (row: SalaryStructure) => `${row.fixedEarnings.hraPercentage}%`,
    },
    {
      key: "otherAllowance",
      label: "Other Allowance (%)",
      render: (row: SalaryStructure) =>
        `${row.fixedEarnings.otherAllowancePercentage}%`,
    },
    {
      key: "state",
      label: "State",
      render: (row: SalaryStructure) =>
        row.statutoryDeductions.professionalTax.state || "",
    },
    {
      key: "term",
      label: "PT Term",
      render: (row: SalaryStructure) =>
        getSelectLabel(
          row.statutoryDeductions.professionalTax.term,
          taxTerms
        ) || "",
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: SalaryStructure) =>
        row?._id
          ? `
          <button class="btn btn-sm btn-ghost" data-action="view" data-id="${row._id}">View</button>
          <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${row._id}">Edit</button>
          `
          : "",
    },
  ];

  async function loadSalaryStructures() {
    let search = $page.url.searchParams.get("search") || undefined;
    try {
      loading = true;
      const response: any = await salaryStructureApi.list({
        page: pagination.page,
        limit: pagination.limit,
        search: search,
      });
      console.log(response, "response");
      pagination = {
        total: response.meta?.total || 0,
        page: response.meta?.page || 1,
        limit: response.meta?.limit || 2,
        totalPages: response.meta?.totalPages || 1,
      };

      salaryStructures = response.data;
    } catch (err) {
      error = "Failed to load salary structures";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function handleSubmit(event: CustomEvent) {
    try {
      loading = true;
      const formData = event.detail;

      if (editingStructure?._id) {
        await salaryStructureApi.update(editingStructure._id, formData);
      } else {
        await salaryStructureApi.create(formData);
      }

      showForm = false;
      await loadSalaryStructures();
    } catch (err) {
      error = "Failed to save salary structure";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handleTableAction(e: CustomEvent) {
    const { action, id } = e.detail;
    const structure = salaryStructures.find((s) => s._id === id);
    if (!structure) return;

    if (action === "view") {
      selectedStructure = { ...structure };
      showDetails = true;
    } else if (action === "edit") {
      editingStructure = { ...structure };
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
      await loadSalaryStructures();
    } finally {
      loading = false;
    }
  }

  async function handleSearch(event: Event) {
    console.log((event.target as HTMLInputElement).value, "handleSearch");
    const query = (event.target as HTMLInputElement).value;

    // const { query } = event.detail;
    const url = new URL($page.url);
    url.searchParams.set("search", query);
    url.searchParams.set("page", "1");
    searchQuery.set(query);

    await goto(url, { replaceState: true });
    await loadSalaryStructures();
  }

  onMount(() => {
    loadSalaryStructures();
  });
</script>

<div class="container mx-auto py-6">
  <div class="flex justify-between items-center mb-10">
    <h2 class="text-xl font-semibold">Salary Structures</h2>
    <div class="flex gap-4">
      <input
        type="text"
        class="input"
        placeholder="Search structures..."
        bind:value={$searchQuery}
        on:input={handleSearch}
      />
      <button
        class="btn btn-primary flex items-center gap-2"
        on:click={() => {
          showForm = true;
          editingStructure = null;
        }}
      >
        Add Structure
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
      data={salaryStructures}
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
  title={editingStructure?._id
    ? "Edit Salary Structure"
    : "New Salary Structure"}
  onClose={() => {
    showForm = false;
  }}
  wide={true}
>
  <SalaryStructureForm
    initialData={editingStructure}
    readOnly={false}
    on:submit={handleSubmit}
  />
</Modal>

<!-- View Details Modal -->
<Modal
  show={showDetails}
  title="Salary Structure Details"
  onClose={() => {
    showDetails = false;
    selectedStructure = null;
  }}
  wide={true}
>
  <SalaryStructureForm initialData={selectedStructure} readOnly={true} />
</Modal>
