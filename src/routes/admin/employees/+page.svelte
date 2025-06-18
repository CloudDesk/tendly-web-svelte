<script lang="ts">
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";
  import Table from "$lib/components/common/Table.svelte";
  // import InfoBanner from "$lib/components/common/InfoBanner.svelte";
  import type { User } from "$lib/types_old.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import Modal from "$lib/components/common/Modal.svelte";
  import EmployeeForm from "$lib/components/employee/EmployeeForm.svelte";
  import { employeesApi } from "$lib/services/api";
  import { toast } from "$lib/components/common/stores/toast.store.js";
  export let data;

  $: ({ employees, pagination, filters, sort } = data);
  console.log(pagination, "pagination");
  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (user: User) => `
        <div class="name-cell">
          <div class="avatar">${user.name[0]}</div>
          <div class="user-info">
            <div class="full-name">${user.name}</div>
            <div class="email">${user.email}</div>
          </div>
        </div>
      `,
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (user: User) => `
        <div class="role-badge ${user.role}">${user.role}</div>
      `,
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (user: User) => `
        <div class="status-badge ${user.active ? "active" : "inactive"}">
          ${user.active ? "Active" : "Inactive"}
        </div>
      `,
    },
    {
      key: "_id",
      label: "Actions",
      render: (user: User) => `
        <div class="actions">
          <button class="btn-action view" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-action edit" title="Edit">
            <i class="fas fa-pencil"></i>
          </button>
          <button class="btn-action more" title="More">
            <i class="fas fa-ellipsis-h"></i>
          </button>
        </div>
      `,
    },
  ];

  function handleSearch(event: CustomEvent) {
    const { query } = event.detail;
    const url = new URL($page.url);
    url.searchParams.set("search", query);
    url.searchParams.set("page", "1");
    goto(url, { replaceState: true });
  }
  function handleSort(event: CustomEvent) {
    const { key, direction } = event.detail;
    const url = new URL($page.url);
    url.searchParams.set("sortBy", key);
    url.searchParams.set("sortOrder", direction);
    goto(url, { replaceState: true });
  }

  function handlePage(event: CustomEvent) {
    const { page: newPage } = event.detail;
    const url = new URL($page.url);
    url.searchParams.set("page", newPage.toString());
    goto(url, { replaceState: true });
  }

  function handleRowClick(event: CustomEvent<User>) {
    const user = event.detail;
    goto(`/admin/employees/${user._id}`);
  }

  let defaultFormValues = {
    name: "",
    email: "",
    role: "",
    joiningDate: "",
    phone: "",
    location: "",
    emergencyContact: "",
    address: "",
    bloodGroup: "",
    dateOfBirth: "",
    managerId: "",
    // isActive: true
  };

  let formValues = { ...defaultFormValues };
  let showApplyForm = false;
  let loading = false;

  function openApplyForm() {
    // Reset form values when opening the form
    formValues = { ...defaultFormValues };
    showApplyForm = true;
  }

  async function handleFormSubmit(event: CustomEvent) {
    console.log("submitting form with data:", event.detail);
    // showApplyForm=false;
    try {
      loading = true;
      const response: any = await employeesApi.create(event.detail);
      console.log(response, "createResponse");
      if (response.success) {
        toast.success("Employee added successfully");
        // Redirect to the new employee page
        await goto(`/admin/employees/${response.data._id}`);
      } else {
        toast.error("Failed to add employee");
      }
    } catch (error) {
      toast.error("Failed to add employee");
      console.error("Error submitting form:", error);
    } finally {
      showApplyForm = false;
    }
  }
  function handleFormUpdate(event: CustomEvent) {
    formValues = event.detail;
  }

  function handleAdd() {
    showApplyForm = true;
  }

  function handleExport() {
    // Export functionality
  }
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
  />
</svelte:head>

<IndexPageTemplate
  title="Employees"
  subtitle="Manage your organization's employees"
  showExport={true}
  showAdd={true}
  addButtonText="Add Employee"
  onAdd={handleAdd}
  onExport={handleExport}
  showFilter={true}
  showView={true}
>
  <!-- <InfoBanner type="info" dismissible={true}>
    Remember to verify employee documents after adding new records.
  </InfoBanner> -->

  <ContentCard noPadding={true}>
    <Table
      {columns}
      data={employees}
      loading={$page.url.searchParams.toString() !==
        $page.url.searchParams.toString()}
      meta={pagination}
      serverSide={true}
      on:search={handleSearch}
      on:sort={handleSort}
      on:page={handlePage}
      on:rowClick={handleRowClick}
    />
  </ContentCard>
  {#if showApplyForm}
    <Modal
      show={showApplyForm}
      title="New Employee"
      onClose={() => (showApplyForm = false)}
    >
      <EmployeeForm
        mode="create"
        {loading}
        initialValues={formValues}
        on:submit={handleFormSubmit}
        on:cancel={() => (showApplyForm = false)}
      />
    </Modal>
  {/if}
</IndexPageTemplate>

<style>
  :global(.name-cell) {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  :global(.avatar) {
    width: 32px;
    height: 32px;
    background: #e6f2ff;
    color: #0073ea;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 12px;
  }

  :global(.user-info) {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  :global(.full-name) {
    font-weight: 500;
    color: #323338;
  }

  :global(.email) {
    font-size: 12px;
    color: #676879;
  }

  :global(.role-badge) {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    text-transform: capitalize;
  }

  :global(.role-badge.admin) {
    background: #e5f4ff;
    color: #0073ea;
  }

  :global(.role-badge.manager) {
    background: #f5ebff;
    color: #a358df;
  }

  :global(.role-badge.staff) {
    background: #ecf6ec;
    color: #037f4c;
  }

  :global(.status-badge) {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  :global(.status-badge.active) {
    background: #ecf6ec;
    color: #037f4c;
  }

  :global(.status-badge.inactive) {
    background: #ffebeb;
    color: #d83a52;
  }
</style>
