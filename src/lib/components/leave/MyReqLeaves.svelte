<script lang="ts">
  import { leavesApi } from "$lib/services/api";
  import { auth } from "$lib/stores/auth";
  import { onMount } from "svelte";
  import type { LeaveFilters, LeaveRequest } from "$lib/services/api";
  import { getLeaveTypeLabel } from "$lib/constants/leaveTypes.js";
  import ContentCard from "../common/ContentCard.svelte";
  import Table from "../common/Table.svelte";
  $: user = $auth.user;
  console.log(user, "user");
  $: userId = user?._id;
  console.log(userId, "userId");

  let leaves: LeaveRequest[] = [];
  let isLoading = false;
  let meta = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };
  let filters: LeaveFilters = {
    userId: userId || "",
    page: 1,
    limit: 10,
    status: "Pending",
    leaveType: "",
    startDate: "",
    endDate: "",
  };

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

  async function handlePage(event: CustomEvent) {
    isLoading = true;
    try {
      const { page: newPage } = event.detail;
      filters.page = newPage;
      await getMyLeaves();
    } catch (error) {}
  }
  // Handle sort event
  function handleSort(event: CustomEvent) {
    const { key, direction } = event.detail;
  }
  const getMyLeaves = async () => {
    isLoading = true;
    try {
      if (!userId) {
        console.error("User ID is not available");
        return;
      }
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => Boolean(value))
      );
      console.log(cleanedFilters, "cleanedFilters");
      const response: any = await leavesApi.myList(userId, cleanedFilters);
      console.log(response, " response");
      if (response.success && Array.isArray(response.data)) {
        leaves = response.data;
        meta = response.meta || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        };
      } else {
        console.error("Failed to fetch leaves or data is not an array");
      }
    } catch (error) {
      console.log(error, " error");
    } finally {
      isLoading = false;
    }
  };

  onMount(() => {
    getMyLeaves();
  });
</script>

<ContentCard noPadding={true}>
  <Table
    {columns}
    data={leaves}
    loading={isLoading}
    {meta}
    serverSide={true}
    searchable={false}
    on:sort={handleSort}
    on:page={handlePage}
  />
</ContentCard>
