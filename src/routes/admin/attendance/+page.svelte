<script lang="ts">
  import { onMount } from "svelte";
  import { attendanceApi, employeesApi } from "$lib/services/api";
  import type { User } from "$lib/types_old";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import EmployeeAttendance from "$lib/components/attendance/EmployeeAttendance.svelte";
  import EmployeeTrainingAttendance from "$lib/components/attendance/EmployeeTrainingAttendance.svelte";
  import { page } from "$app/stores";
  import { navigationContext } from "$lib/stores/navigation";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";
  // import "../../../Mobileview.css"; // Import the external CSS file

  let loading = false;
  let error: string | null = null;
  let employees: User[] = [];
  let selectedEmployeeIds: Set<string> = new Set();

  const tabs = [
    { id: "shift", label: "Shift Attendance" },
    { id: "training", label: "Training Attendance" },
  ];

  $: activeTab = $page.url.searchParams.get("tab") || tabs[0]?.id;

  async function loadEmployees() {
    try {
      loading = true;
      const response: any = await employeesApi.list({
        page: 1,
        limit: 100, // Load more employees for better filtering
      });
      employees = response.data;
    } catch (err) {
      error = "Failed to load employees";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      selectedEmployeeIds = new Set(employees.map((emp) => emp._id));
    } else {
      selectedEmployeeIds.clear();
    }
    selectedEmployeeIds = selectedEmployeeIds;
  }

  function handleEmployeeSelect(employeeId: string) {
    if (selectedEmployeeIds.has(employeeId)) {
      selectedEmployeeIds.delete(employeeId);
    } else {
      selectedEmployeeIds.add(employeeId);
    }
    selectedEmployeeIds = selectedEmployeeIds;
  }

  onMount(() => {
    navigationContext.set("admin");
    loadEmployees();
  });
</script>

<IndexPageTemplate
  title="Attendance Management"
  subtitle="Manage your attendance"

>
<ContentCard noPadding={true}>
    <Tabs {tabs}>
          {#if activeTab === "shift"}
            <EmployeeAttendance
              mode="multi"
              employeeIds={Array.from(selectedEmployeeIds)}
            />
          {:else if activeTab === "training"}
            <EmployeeTrainingAttendance
              mode="multi"
              employeeIds={Array.from(selectedEmployeeIds)}
            />
          {:else}
            <div class="alert alert-info">
              Please select at least one employee to view attendance records.
            </div>
          {/if}
        </Tabs>
  </ContentCard>
</IndexPageTemplate>

