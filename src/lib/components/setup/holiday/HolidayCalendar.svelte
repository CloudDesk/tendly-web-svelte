<script lang="ts">
  import Table from "$lib/components/common/Table.svelte";
  import Modal from "$lib/components/common/Modal.svelte";
  import HolidayForm from "./HolidayForm.svelte";
  import HolidayDetails from "./HolidayDetails.svelte";
  import { onMount } from "svelte";
  import type { IHolidayCalendar } from "$lib/types";
  import { holidayCalendarApi } from "$lib/services/api";
  import { page } from "$app/stores";
  import HolidayAssign from "./HolidayAssign.svelte";

  let holidayCalendars: IHolidayCalendar[] = [];
  let loading = false;
  let error: string | null = null;
  let showForm = false;
  let showDetails = false;
  let showAssign = false;
  let editingCalendar: Partial<IHolidayCalendar> = {};
  let selectedCalendar: IHolidayCalendar | null = null;
  let assigningCalendar: IHolidayCalendar | null = null;
  let searchQuery = "";
  let pagination = {
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "year", label: "Year" },
    {
      key: "holidays",
      label: "Total Holidays",
      render: (row: IHolidayCalendar) => row.holidays.length.toString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: IHolidayCalendar) =>
        row?._id
          ? `
          <button class="btn btn-sm btn-ghost" data-action="view" data-id="${row._id}">View</button>
          <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${row._id}">Edit</button>
          <button class="btn btn-sm btn-ghost" data-action="assign" data-id="${row._id}">Assign</button>
        `
          : "",
    },
  ];

  async function loadHolidayCalendars() {
    try {
      loading = true;
      const response: any = await holidayCalendarApi.list({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
      });
      console.log(response, "loadHolidayCalendars");
      pagination = {
        total: response.data.meta?.total || 0,
        page: response.data.meta?.page || 1,
        limit: response.data.meta?.limit || 5,
        totalPages: response.data.meta?.totalPages || 1,
      };
      holidayCalendars = response.data.calendars || [];
    } catch (err) {
      error = "Failed to load holiday calendars";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    try {
      loading = true;
      if (editingCalendar._id) {
        await holidayCalendarApi.update(editingCalendar._id, editingCalendar);
      } else {
        await holidayCalendarApi.create(
          editingCalendar as Omit<IHolidayCalendar, "_id">
        );
      }
      showForm = false;
      editingCalendar = {};
      await loadHolidayCalendars();
    } catch (err) {
      error = "Failed to save holiday calendar";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handleTableAction(e: CustomEvent) {
    const { action, id } = e.detail;
    const calendar = holidayCalendars.find((c) => c._id === id);
    if (!calendar) return;

    if (action === "view") {
      selectedCalendar = calendar;
      showDetails = true;
    } else if (action === "edit") {
      editingCalendar = { ...calendar };
      showForm = true;
    } else if (action === "assign") {
      console.log("Assigning calendar:", calendar);
      showAssign = true;
      assigningCalendar = calendar;
    }
  }

  async function handlePageChange(event: CustomEvent) {
    loading = true;
    try {
      const { page: newPage } = event.detail;
      pagination.page = newPage;
      const url = new URL($page.url);
      url.searchParams.set("page", newPage.toString());
      await loadHolidayCalendars();
    } finally {
      loading = false;
    }
  }

  async function handleAssignment(event: CustomEvent) {
    console.log("handleAssignment", event.detail);
    const { holidayCalendarId, employees } = event.detail;
    try {
      loading = true;
      let employeeIds = employees;
      await holidayCalendarApi.assign(holidayCalendarId, employeeIds);
      showAssign = false;
      assigningCalendar = null;
      await loadHolidayCalendars();
    } catch (err) {
      error = "Failed to assign holiday calendar";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  onMount(loadHolidayCalendars);
</script>

<div>
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-semibold">Holiday Calendars</h2>
    <div class="flex gap-4">
      <input
        type="text"
        class="input input-bordered"
        placeholder="Search holiday calendars..."
        bind:value={searchQuery}
        on:input={() => loadHolidayCalendars()}
      />
      <button
        class="btn btn-primary"
        on:click={() => {
          editingCalendar = {};
          showForm = true;
        }}>Add New Calendar</button
      >
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
      data={holidayCalendars}
      {loading}
      serverSide={true}
      meta={pagination}
      searchable={false}
      variant="transparent"
      on:action={handleTableAction}
      on:page={handlePageChange}
    />
  {/if}
</div>

<!-- Add, Edit Holiday Calendar Modal -->
<Modal
  show={showForm}
  title={editingCalendar._id ? "Edit Holiday Calendar" : "New Holiday Calendar"}
  onClose={() => {
    showForm = false;
    editingCalendar = {};
  }}
  wide
>
  <HolidayForm calendar={editingCalendar} on:submit={handleSubmit} />
</Modal>

<!-- View Holiday Calendar Details Modal -->
<Modal
  show={showDetails}
  title="Holiday Calendar Details"
  onClose={() => {
    showDetails = false;
    selectedCalendar = null;
  }}
>
  <HolidayDetails calendar={selectedCalendar} />
</Modal>

<!-- Assign -->

<Modal
  show={showAssign}
  title="Assign Holiday Calendar"
  onClose={() => {
    showAssign = false;
    assigningCalendar = null;
  }}
  wide
>
  <HolidayAssign
    holidayCalendar={assigningCalendar}
    on:submit={handleAssignment}
  />
</Modal>
