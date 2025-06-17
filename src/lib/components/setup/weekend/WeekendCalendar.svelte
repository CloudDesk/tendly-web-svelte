<script lang="ts">
    import Table from "$lib/components/common/Table.svelte";
    import Modal from "$lib/components/common/Modal.svelte";
    import WeekendCalendarForm from "./WeekendCalendarForm.svelte";
    import WeekendCalendarDetail from "./WeekendCalendarDetail.svelte";
    import WeekendCalendarAssign from "./WeekendCalendarAssign.svelte";
    import { onMount } from "svelte";
    import type { IWeekendCalendar } from "$lib/types";
    import { weekendCalendarApi } from "$lib/services/api";
  
    let weekendCalendars: IWeekendCalendar[] = [];
    let loading = false;
    let error: string | null = null;
    let showForm = false;
    let showDetails = false;
    let showAssign = false;
    let editingCalendar: Partial<IWeekendCalendar> = {};
    let selectedCalendar: IWeekendCalendar | null = null;
    let assigningCalendar: IWeekendCalendar | null = null;
    let searchQuery = "";
    let pagination = {
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 1,
    };
  
    const columns = [
      { key: "name", label: "Name" },
      { key: "description", label: "Description" },
      {
        key: "weekends",
        label: "Total Weekends",
        render: (row: IWeekendCalendar) => row.weekends.length.toString(),
      },
      {
        key: "actions",
        label: "Actions",
        render: (row: IWeekendCalendar) =>
          row?._id
            ? `
            <button class="btn btn-sm btn-ghost" data-action="view" data-id="${row._id}">View</button>
            <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${row._id}">Edit</button>
            <button class="btn btn-sm btn-ghost" data-action="assign" data-id="${row._id}">Assign</button>
          `
            : "",
      },
    ];
  
    async function loadWeekendCalendars() {
      try {
        loading = true;
        const response: any = await weekendCalendarApi.list({
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
        });
        pagination = {
          total: response.data.meta?.total || 0,
          page: response.data.meta?.page || 1,
          limit: response.data.meta?.limit || 5,
          totalPages: response.data.meta?.totalPages || 1,
        };
        weekendCalendars = response.data.calendars || [];
      } catch (err) {
        error = "Failed to load weekend calendars";
        console.error(err);
      } finally {
        loading = false;
      }
    }
  
    async function handleSubmit() {
      try {
        loading = true;
        if (editingCalendar._id) {
          await weekendCalendarApi.update(editingCalendar._id, editingCalendar);
        } else {
          await weekendCalendarApi.create(
            editingCalendar as Omit<IWeekendCalendar, "_id">
          );
        }
        showForm = false;
        editingCalendar = {};
        await loadWeekendCalendars();
      } catch (err) {
        error = "Failed to save weekend calendar";
        console.error(err);
      } finally {
        loading = false;
      }
    }
  
    function handleTableAction(e: CustomEvent) {
      const { action, id } = e.detail;
      const calendar = weekendCalendars.find((c) => c._id === id);
      if (!calendar) return;
  
      if (action === "view") {
        selectedCalendar = calendar;
        showDetails = true;
      } else if (action === "edit") {
        editingCalendar = { ...calendar };
        showForm = true;
      } else if (action === "assign") {
        showAssign = true;
        assigningCalendar = calendar;
      }
    }
  
    async function handleAssignment(event: CustomEvent) {
      const { weekendCalendarId, employees } = event.detail;
      try {
        loading = true;
        await weekendCalendarApi.assign(weekendCalendarId, employees);
        showAssign = false;
        assigningCalendar = null;
        await loadWeekendCalendars();
      } catch (err) {
        error = "Failed to assign weekend calendar";
        console.error(err);
      } finally {
        loading = false;
      }
    }
  
    onMount(loadWeekendCalendars);
  </script>
  
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Weekend Calendars</h2>
      <div class="flex gap-4">
        <input
          type="text"
          class="input input-bordered"
          placeholder="Search weekend calendars..."
          bind:value={searchQuery}
          on:input={() => loadWeekendCalendars()}
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
        data={weekendCalendars}
        {loading}
        serverSide={true}
        meta={pagination}
        searchable={false}
        variant="transparent"
        on:action={handleTableAction}
      />
    {/if}
  </div>
  
  <!-- Add, Edit Weekend Calendar Modal -->
  <Modal
    show={showForm}
    title={editingCalendar._id ? "Edit Weekend Calendar" : "New Weekend Calendar"}
    onClose={() => {
      showForm = false;
      editingCalendar = {};
    }}
    wide
  >
    <WeekendCalendarForm calendar={editingCalendar} on:submit={handleSubmit} />
  </Modal>
  
  <!-- View Weekend Calendar Details Modal -->
  <Modal
    show={showDetails}
    title="Weekend Calendar Details"
    onClose={() => {
      showDetails = false;
      selectedCalendar = null;
    }}
  >
    <WeekendCalendarDetail calendar={selectedCalendar} />
  </Modal>
  
  <!-- Assign Weekend Calendar Modal -->
  <Modal
    show={showAssign}
    title="Assign Weekend Calendar"
    onClose={() => {
      showAssign = false;
      assigningCalendar = null;
    }}
    wide
  >
    <WeekendCalendarAssign
      weekendCalendar={assigningCalendar}
      on:submit={handleAssignment}
    />
  </Modal>