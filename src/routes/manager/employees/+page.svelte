<script lang="ts">
  import { onMount } from "svelte";
  import { employeesApi } from "$lib/services/api";
  import Table from "$lib/components/common/Table.svelte";
  import type { User, PaginationMeta } from "$lib/types_old";
  import { goto } from "$app/navigation";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import InfoBanner from "$lib/components/common/InfoBanner.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";
  // import "../../../Mobileview.css"; // Import responsive CSS

  let employees: User[] = [];
  let loading = true;
  let error: string | null = null;
  let meta: PaginationMeta | null = null;
  let currentQuery = "";
  let currentSort: { key: string; direction: "asc" | "desc" } | null = null;

  const columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    {
      key: "active",
      label: "Status",
      sortable: true,
      render: (user: User) => `
        <span class="status ${user.active ? "active" : "inactive"}">
          ${user.active ? "Active" : "Inactive"}
        </span>
      `,
    },
    {
      key: "_id",
      label: "Actions",
      render: (user: User) => `
        <a href="/manager/employees/${user._id}" class="btn-action" data-sveltekit-preload>
          View
        </a>
        <button class="btn-action">
          Edit
        </button>
      `,
    },
  ];

  async function fetchEmployees(params = {}) {
    loading = true;
    error = null;

    try {
      const response: any = await employeesApi.list(params);
      employees = response.data;
      meta = response.meta;
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchEmployees({ page: 1, limit: 10 });
  });

  function handleSearch(event: CustomEvent) {
    const { query } = event.detail;
    currentQuery = query;
    fetchEmployees({
      page: 1,
      limit: meta?.limit || 10,
      search: query,
      ...(currentSort && {
        sortBy: currentSort.key,
        sortOrder: currentSort.direction,
      }),
    });
  }

  function handleSort(event: CustomEvent) {
    const { key, direction } = event.detail;
    currentSort = { key, direction };
    fetchEmployees({
      page: meta?.page || 1,
      limit: meta?.limit || 10,
      ...(currentQuery && { search: currentQuery }),
      sortBy: key,
      sortOrder: direction,
    });
  }

  function handlePage(event: CustomEvent) {
    const { page } = event.detail;
    fetchEmployees({
      page,
      limit: meta?.limit || 10,
      ...(currentQuery && { search: currentQuery }),
      ...(currentSort && {
        sortBy: currentSort.key,
        sortOrder: currentSort.direction,
      }),
    });
  }

  async function handleRowClick(event: CustomEvent<User>) {
    const user = event.detail;
    await goto(`/manager/employees/${user._id}`);
  }
</script>

<IndexPageTemplate
  title="Employees"
  subtitle="Manage your organization's employees"
>
  <InfoBanner type="info" dismissible={true}>
    Remember to verify employee documents after adding new records.
  </InfoBanner>

  <ContentCard noPadding={true}>
    <Table
    {columns}
    data={employees}
    {loading}
    {error}
    {meta}
    serverSide={true}
    on:search={handleSearch}
    on:sort={handleSort}
    on:page={handlePage}
    on:rowClick={handleRowClick}
  />
  </ContentCard>

</IndexPageTemplate>
