<script lang="ts">
  import Table from "$lib/components/common/Table.svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { leavesApi ,type LeaveRequest } from "$lib/services/api";
  import { getLeaveTypeLabel } from "$lib/constants/leaveTypes.js";
  import { toast } from "$lib/components/common/stores/toast.store.js";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import InfoBanner from "$lib/components/common/InfoBanner.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";

  export let data;
  let isLoading = false;
  $: ({ leaves, summary, pagination, filters, sort, leaveTypeId } = data);
  console.log(pagination, "pagination");

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
        <a href="/admin/leaves/${leave._id}" class="btn btn-sm btn-ghost" data-sveltekit-preload>
          View
        </a>
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

  async function handlePage(event: CustomEvent) {
    console.log(event.detail, "handlePage");
    isLoading = true;
    try {
      console.log(event.detail);
      const { page: newPage } = event.detail;
      const url = new URL($page.url);
      url.searchParams.set("page", newPage.toString());
      await goto(url, { replaceState: true, invalidateAll: true });
    } finally {
      isLoading = false;
    }
  }

  let showApplyForm = false;
  let loading = false;

  // Initialize formValues with default values
  let defaultFormValues = {
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    status: "Pending",
    leaveTypeId: leaveTypeId || "678dec1789f768e0b1877aae",
  };

  let formValues = { ...defaultFormValues };

  function openApplyForm() {
    // Reset form values when opening the form
    formValues = { ...defaultFormValues };
    showApplyForm = true;
  }

  function closeApplyForm() {
    // Reset form values when closing the form
    formValues = { ...defaultFormValues };
    showApplyForm = false;
  }

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
      // Add or update a timestamp parameter to force reload
      currentUrl.searchParams.set("t", Date.now().toString());

      // Navigate to the modified URL to trigger a refresh
      await goto(currentUrl, {
        replaceState: true,
        invalidateAll: true, // This will force SvelteKit to refetch the page data
      });
    } catch (error) {
      console.error("Error submitting leave:", error);
      toast.error("Failed to apply leave");
      // Handle error (show toast, etc.)
    } finally {
      closeApplyForm();
      loading = false;
    }
  }

  function handleFormUpdate(event: CustomEvent) {
    formValues = event.detail;
  }
  function handleExport() {}
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
  />
</svelte:head>

<IndexPageTemplate
  title="Leave Management"
  subtitle="Leave "
  showExport={true}
  showAdd={false}
  onExport={handleExport}
  showFilter={true}
  showView={true}
>
  <InfoBanner type="info" dismissible={true}>
    Remember to verify employee documents after adding new records.
  </InfoBanner>

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
  </ContentCard>
</IndexPageTemplate>
