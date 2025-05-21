<script lang="ts">
  import Table from "$lib/components/common/Table.svelte";
  import type { LeaveRequest } from "$lib/services/api/leaves";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { leavesApi } from "$lib/services/api/leaves";
  import Modal from "$lib/components/common/Modal.svelte";
  import LeaveForm from "$lib/components/leave/LeaveForm.svelte";
  import {
    getLeaveTypeLabel,
    leaveStatusOptions,
    leaveTypeOptions,
  } from "$lib/constants/leaveTypes.js";
  import { toast } from "$lib/components/common/stores/toast.store.js";
  import Filter from "$lib/components/common/Filter.svelte";
  import { writable, derived } from "svelte/store";
  import type { LeaveFilterSchema } from "$lib/types";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";

  // Constants for default form values
  const DEFAULT_FORM_VALUES = {
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    status: "Pending",
    leaveTypeId: "678dec1789f768e0b1877aae",
  };

  // Initialize stores
  let isLoading = false;
  let showApplyForm = false;
  let loading = false;
  let isFilterOpen = false;
  let filterValues = writable({});
  let appliedFilterValues = writable({});
  let formValues = { ...DEFAULT_FORM_VALUES };

  // Extract data from props
  export let data;
  $: ({ leaves, summary, pagination, filters, sort, leaveTypeId } = data);

  // Define table columns
  const columns = [
    {
      key: "leaveType",
      label: "Leave Type",
      sortable: true,
      render: (leave: LeaveRequest) => getLeaveTypeLabel(leave.leaveType || ""),
    },
    {
      key: "startDate",
      label: "Start Date",
      sortable: true,
      render: (leave: LeaveRequest) =>
        new Date(leave.startDate).toLocaleDateString(),
    },
    {
      key: "endDate",
      label: "End Date",
      sortable: true,
      render: (leave: LeaveRequest) =>
        new Date(leave.endDate).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (leave: LeaveRequest) => `
        <span class="status ${leave.status.toLowerCase()}">
          ${leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
        </span>
      `,
    },
    {
      key: "_id",
      label: "Actions",
      render: (leave: LeaveRequest) => `
        <a href="/my/leaves/${leave._id}" class="btn btn-sm btn-ghost" data-sveltekit-preload>
          View
        </a>
      `,
    },
  ];

  // Define filter schema
  const filtersSchema: LeaveFilterSchema[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        ...leaveStatusOptions,
        { label: "Cancelled", value: "Cancelled" },
      ],
    },
    {
      key: "leaveType",
      label: "Leave Type",
      type: "select",
      options: leaveTypeOptions,
    },
    {
      key: "fromDate",
      label: "From Date",
      type: "date",
    },
    {
      key: "toDate",
      label: "To Date",
      type: "date",
    },
  ];

  // Derived store to calculate the count of selected filters
  const selectedFilterCount = derived(filterValues, ($filterValues) => {
    return Object.values($filterValues).reduce((count: number, value: any) => {
      if (Array.isArray(value)) {
        return count + value.length;
      } else if (value) {
        return count + 1;
      }
      return count;
    }, 0);
  });

  // Handle search event
  function handleSearch(event: CustomEvent) {
    const { query } = event.detail;
    const url = new URL($page.url);
    url.searchParams.set("search", query);
    url.searchParams.set("page", "1");
    goto(url, { replaceState: true });
  }

  // Handle sort event
  function handleSort(event: CustomEvent) {
    const { key, direction } = event.detail;
    const url = new URL($page.url);
    url.searchParams.set("sortBy", key);
    url.searchParams.set("sortOrder", direction);
    goto(url, { replaceState: true });
  }

  // Handle page change event
  async function handlePage(event: CustomEvent) {
    isLoading = true;
    try {
      const { page: newPage } = event.detail;
      const url = new URL($page.url);
      url.searchParams.set("page", newPage.toString());
      await goto(url, { replaceState: true, invalidateAll: true });
    } finally {
      isLoading = false;
    }
  }

  // Open apply form
  function openApplyForm() {
    console.log("Opening apply form");
    formValues = { ...DEFAULT_FORM_VALUES };
    showApplyForm = true;
  }

  // Close apply form
  function closeApplyForm() {
    formValues = { ...DEFAULT_FORM_VALUES };
    showApplyForm = false;
  }

  // Handle leave form submission
  async function handleLeaveSubmit(event: CustomEvent) {
    loading = true;
    const submittedData = event.detail;
    console.log("Submitted data:", submittedData);

    try {
      const values = {
        ...submittedData,
        leaveTypeId: leaveTypeId || "678dec1789f768e0b1877aae",
      };

      const res = await leavesApi.create(values);
      console.log("Leave created:", res);
      toast.success("Leave applied successfully");
      showApplyForm = false;

      // Refresh the page data by invalidating current URL
      const currentUrl = new URL($page.url);
      currentUrl.searchParams.set("t", Date.now().toString());

      await goto(currentUrl, {
        replaceState: true,
        invalidateAll: true,
      });
    } catch (error) {
      console.log("Error submitting leave:", error);
      toast.error("Failed to apply leave");
    } finally {
      setTimeout(() => {
        closeApplyForm();
        loading = false;
      }, 500);
    }
  }

  // Handle form update
  function handleFormUpdate(event: CustomEvent) {
    formValues = event.detail;
  }

  // Toggle filter panel
  function toggleFilter() {
    isFilterOpen = !isFilterOpen;
  }

  // Handle filter change
  function handleFilterChange(event: CustomEvent) {
    const { values } = event.detail;
    console.log("Filter values changed:", values);
    filterValues.set(values);
  }

  // Handle filter apply
  async function handleFilterApply(event: CustomEvent) {
    const values = event.detail;
    appliedFilterValues.set(values);
    const url = new URL($page.url);

    ["status", "leaveType", "fromDate", "toDate"].forEach((key) => {
      url.searchParams.delete(key);
    });

    Object.entries(values).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          url.searchParams.set(key, value.join(","));
        }
      } else if (value) {
        url.searchParams.set(key, value.toString());
      }
    });

    url.searchParams.set("page", "1");

    isLoading = true;
    try {
      await goto(url, { replaceState: true });
    } finally {
      isLoading = false;
      isFilterOpen = false;
    }
  }

  // Handle filter reset
  async function handleFilterReset() {
    filterValues.set({});
    appliedFilterValues.set({});

    const url = new URL($page.url);
    const filterKeys = filtersSchema.map((filter) => filter.key);

    filterKeys.forEach((key) => {
      url.searchParams.delete(key);
    });

    url.searchParams.set("page", "1");

    isLoading = true;
    try {
      await goto(url, { replaceState: true });
    } finally {
      isLoading = false;
      toggleFilter();
    }
  }
  const handleExport = async () => {};
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
  />
</svelte:head>

<IndexPageTemplate
  title="Leave Management"
  subtitle="Apply for Leave and View Your Leave History"
  showExport={true}
  showAdd={true}
  addButtonText="Add Leave"
  onAdd={openApplyForm}
  onExport={handleExport}
  showFilter={true}
  showView={true}
  onFilter={toggleFilter}
  selectedFilterCount={$selectedFilterCount}
>
  <ContentCard noPadding={true}>
    <Table
      {columns}
      data={leaves}
      loading={isLoading}
      meta={pagination}
      serverSide={true}
      on:search={handleSearch}
      on:sort={handleSort}
      on:page={handlePage}
    />
    {#if showApplyForm}
      <Modal
        show={showApplyForm}
        title="Leave Details"
        onClose={() => (showApplyForm = false)}
      >
        <LeaveForm
          {loading}
          {summary}
          initialValues={formValues}
          on:submit={handleLeaveSubmit}
          on:update={handleFormUpdate}
          on:cancel={() => (showApplyForm = false)}
        />
      </Modal>
    {/if}
  </ContentCard>

  <Filter
    filters={filtersSchema}
    values={$appliedFilterValues}
    isOpen={isFilterOpen}
    on:change={handleFilterChange}
    on:apply={handleFilterApply}
    on:reset={handleFilterReset}
    on:close={() => (isFilterOpen = false)}
  />
</IndexPageTemplate>
