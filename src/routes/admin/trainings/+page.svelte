<script lang="ts">
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";
  import Table from "$lib/components/common/Table.svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { employeesApi } from "$lib/services/api";
  import { toast } from "$lib/components/common/stores/toast.store.js";
  import type { Training, User } from "$lib/types";
  export let data;

  $: ({ trainings, pagination, filters, sort, employees } = data);
  console.log(
    pagination,
    "pagination",
    trainings,
    "trainings",
    employees,
    "employees"
  );
  const columns = [
    { key: "name", label: "Name" },
    { key: "code", label: "Code" },
    {
      key: "timing",
      label: "Timing",
      render: (row: Training) => `${row.startTime} - ${row.endTime}`,
    },
    {
      key: "window",
      label: "Window",
      render: (row: Training) =>
        `${row.trainingWindowStart} - ${row.trainingWindowEnd}`,
    },
    {
      key: "graceTime",
      label: "Grace Time",
      render: (row: Training) => `${row.graceTimeInMinutes || 0} minutes`,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: Training) =>
        row?._id
          ? `
          <button class="btn btn-sm btn-ghost" data-action="view" data-id="${row._id}">View</button>
          <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${row._id}">Edit</button>
          <button class="btn btn-sm btn-ghost" data-action="assign" data-id="${row._id}">Assign</button>
        `
          : "",
    },
  ];

  const employeeColumns = [
    { key: "name" as keyof User, label: "Name" },
    { key: "employeeId" as keyof User, label: "Employee ID" },
    {
      key: "currentShiftAssignment",
      label: "Current Shift",
      render: (row: User) =>
        row.currentShiftAssignmentData
          ? `${row.currentShiftAssignmentData.shiftCode} (${row.currentShiftAssignmentData.startDate}-${row.currentShiftAssignmentData.endDate})`
          : "No shift assigned",
    },
    {
      key: "upcomingShiftAssignment",
      label: "Upcoming Shift",
      render: (row: User) =>
        row.upcomingShiftAssignmentData
          ? `${row.upcomingShiftAssignmentData.shiftCode} (${row.upcomingShiftAssignmentData.startDate}-${row.upcomingShiftAssignmentData.endDate})`
          : "No upcoming shift",
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

  function handleRowClick(item: any) {
    goto(`/admin/trainings/${item.detail._id}`);
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

<!-- <TrainingsList /> -->

<IndexPageTemplate
  title="My Trainings"
  subtitle="trainings"
  showExport={false}
  showAdd={false}
>
  <ContentCard noPadding={true}>
    <Table
      {columns}
      data={trainings}
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
</IndexPageTemplate>
