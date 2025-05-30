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
    import LeavesList from "$lib/components/leave/LeavesList.svelte";
    import EmployeeTrainingAttendance from "$lib/components/attendance/EmployeeTrainingAttendance.svelte";

  const employeeId = $page.params.id;
  export let data: { employee?: any } | undefined;

  const tabs = [
    { id: "details", label: "Employee Details" },
    { id: "leaves", label: "Leaves" },
    { id: "attendance", label: "Attendance" },
    {id: "training", label: "Training" }
  ];

  $: activeTab = $page.url.searchParams.get("tab") || tabs[0]?.id;

</script>

<DetailPageTemplate
  title=''
  subtitle=""
  backLink="/manager/employees"
>
<ContentCard>
<div class="p-4">

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-neutral">{data?.employee.name}</h1>
    </div>

    <div class="card">
      <div class="card-body">
        <Tabs {tabs}>
          {#if activeTab === "details"}
            <EmployeeDetails {employeeId}   employee={data?.employee}/>
          {:else if activeTab === "attendance"}
            <EmployeeAttendance {employeeId} />
          {:else if activeTab === "leaves"}
            <!-- <EmployeeLeaves {employeeId} /> -->
             <LeavesList userId={employeeId} />
          {:else if activeTab === "training"}
          <EmployeeTrainingAttendance {employeeId} />
          {/if}
        </Tabs>
      </div>
    </div>

</div>
</ContentCard>
</DetailPageTemplate>
