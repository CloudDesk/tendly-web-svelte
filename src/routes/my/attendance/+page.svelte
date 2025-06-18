<script lang="ts">
  import RegularizationList from "$lib/components/attendance-Regularization/RegularizationList.svelte";
  import { derived, writable } from "svelte/store";
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import { getMonthStartEnd } from "$lib/utils/date";
  import AttendanceDashboard from "$lib/components/attendance/AttendanceDashboard.svelte";
  import { attendanceApi } from "$lib/services/api";
  import type { AttendanceRecord } from "$lib/types";
  import Regularization from "$lib/components/attendance-Regularization/Regularization.svelte";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import { page } from "$app/stores";
  import Tabs from "$lib/components/common/Tabs.svelte";

  const viewMode = writable<"calendar" | "list" | "heat">("calendar");
  const userId: string = $auth.user?._id ?? "";
  const attendanceRecords = writable<AttendanceRecord[]>([]);
  const isLoading = writable(false);

  const tabs = [
    { id: "calendar", label: "My Calendar" },
    { id: "regularize", label: "Request Regularization" },
    { id: "history", label: "Regularization History" },
  ];
  // Reactive derived store to update the active tab based on the URL
  const activeTab = derived(
    page,
    ($page) => $page.url.searchParams.get("tab") || tabs[0]?.id
  );

  // Function to initialize and refresh data
  async function initializeData() {
    console.log("Fetching attendance data");
    const { start, end } = getMonthStartEnd();
    isLoading.set(true);
    try {
      const response: any = await attendanceApi.search({
        userIds: [userId],
        startDate: start,
        endDate: end,
      });
      console.log(response.data, "response.data");
      if (response.data.length > 0) {
        const userRecords: AttendanceRecord[] = response.data[0].records.map(
          (record: any) => ({
            ...record,
            // Ensure consistent date format
            shiftDay: new Date(record.shiftDay).toISOString(),
          })
        );
        attendanceRecords.set(userRecords);
      } else {
        attendanceRecords.set([]);
      }
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      attendanceRecords.set([]);
    } finally {
      isLoading.set(false);
    }
  }

  // Handle successful swipe
  function handleSwipeSuccess() {
    console.log("callback called");
    initializeData();
  }

  async function handleMonthChange(
    event: CustomEvent<{ year: number; month: number }>
  ) {
    console.log("Month Changed in Parent:", event.detail);
    const { year, month } = event.detail;
    // Do something with year and month

    const { start, end } = getMonthStartEnd(year, month);
    isLoading.set(true);
    try {
      const response: any = await attendanceApi.search({
        userIds: [userId],
        startDate: start,
        endDate: end,
      });
      console.log(response.data, "response.data");
      if (response.data.length > 0) {
        const userRecords: AttendanceRecord[] = response.data[0].records.map(
          (record: any) => ({
            ...record,
            // Ensure consistent date format
            shiftDay: new Date(record.shiftDay).toISOString(),
          })
        );
        attendanceRecords.set(userRecords);
      } else {
        attendanceRecords.set([]);
      }
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      attendanceRecords.set([]);
    } finally {
      isLoading.set(false);
    }
  }

  onMount(() => {
    initializeData();
  });
</script>

<IndexPageTemplate
  title="Attendance"
  subtitle="Attendance records and regularization"
>
  <div class="mt-4">
    <Tabs {tabs}>
      {#if $activeTab === "calendar"}
        <AttendanceDashboard
          bind:attendanceRecords={$attendanceRecords}
          bind:isLoading={$isLoading}
          on:refresh={initializeData}
          on:monthChange={handleMonthChange}
        />
      {:else if $activeTab === "regularize"}
        <Regularization />
      {:else if $activeTab === "history"}
        <RegularizationList viewType="user" />
      {/if}
    </Tabs>
    <!-- {#if $viewMode === "calendar"}
        <AttendanceDashboard
          bind:attendanceRecords={$attendanceRecords}
          bind:isLoading={$isLoading}
          on:refresh={initializeData}
          on:monthChange={handleMonthChange}
        />
      {:else if $viewMode === "list"}
        <Regularization />
      {:else}
        <RegularizationList viewType="user" />
      {/if} -->
  </div>
</IndexPageTemplate>
