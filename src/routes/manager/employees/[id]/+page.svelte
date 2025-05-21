<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { employeesApi } from "$lib/services/api";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import EmployeeAttendance from "$lib/components/attendance/EmployeeAttendance.svelte";
  import EmployeeDetails from "$lib/components/employee/EmployeeDetails.svelte";
  import EmployeeLeaves from "$lib/components/employee/EmployeeLeaves.svelte";
  import type { User } from "$lib/types_old";
  import DetailPageTemplate from "$lib/components/templates/DetailPageTemplate.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";
  import LoaderNew from "$lib/components/common/LoaderNew.svelte";

  const employeeId = $page.params.id;
  let user: User | null = null;
  let loading = true;
  let error: string | null = null;

  const tabs = [
    { id: "details", label: "Employee Details" },
    { id: "leaves", label: "Leaves" },
    { id: "attendance", label: "Attendance" },
  ];

  $: activeTab = $page.url.searchParams.get("tab") || tabs[0]?.id;

  onMount(async () => {
    try {
      const response: any = await employeesApi.getById(employeeId);
      user = response.data;
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

<DetailPageTemplate
  title=''
  description="View and manage employee details"
  backLink="/manager/employees"
>
<ContentCard>
<div class="p-4">
  {#if loading}
    <LoaderNew/>
  {:else if error}
    <div class="alert alert-error">{error}</div>
  {:else if user}
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-neutral">{user.name}</h1>
    </div>

    <div class="card">
      <div class="card-body">
        <Tabs {tabs}>
          {#if activeTab === "details"}
            <EmployeeDetails {employeeId} />
          {:else if activeTab === "attendance"}
            <EmployeeAttendance {employeeId} />
          {:else if activeTab === "leaves"}
            <EmployeeLeaves {employeeId} />
          {/if}
        </Tabs>
      </div>
    </div>
  {/if}
</div>
</ContentCard>
</DetailPageTemplate>
