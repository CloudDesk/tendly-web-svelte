<script lang="ts">
  import { goto } from "$app/navigation";
  import EmployeeAttendance from "$lib/components/attendance/EmployeeAttendance.svelte";
  import EmployeeLeaves from "$lib/components/employee/EmployeeLeaves.svelte";
  import EmployeeTrainingAttendance from "$lib/components/attendance/EmployeeTrainingAttendance.svelte";
  import { page } from "$app/stores";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import EmployeeSalary from "$lib/components/employee/EmployeeSalary.svelte";
  import ITDeclarationApproval from "$lib/components/employee/ITDeclarationApproval.svelte";
  import EmployeeShiftAssignment from "$lib/components/employee/EmployeeShiftAssignment.svelte";
  import Bankingcomponent from "$lib/components/employee/Banking-Identity/Bankingcomponent.svelte";
  import { employeesApi } from "$lib/services/api/employees";
  import EmployeeInfo from "$lib/components/employee/EmployeeInfo.svelte";
  export let data;
  $: ({ employee } = data);
  console.log(data, "employeeemployee");

  let employeeBankdetailsData;
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "shifts", label: "Shifts" },
    { id: "leaves", label: "Leaves Summary" },
    { id: "attendance", label: "Attendance" },
    { id: "training", label: "Training" },
    { id: "salary", label: "Employee Salary" },
    { id: "it-declaration", label: "IT Declaration" },
    // { id: "Banking-Identity", label: "Banking Identity" },
  ];

  $: activeTab = $page.url.searchParams.get("tab") || tabs[0]?.id;

  // function setActiveTab(tab: string) {
  //   activeTab = tab;
  // }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  async function handleRefresh(event: CustomEvent) {
    console.log("Refresh event triggered:", event.detail);

    try {
      const response = await employeesApi.getById(employee._id);
      console.log(response, "responseresponse");
      if (!response.success) {
        throw response as unknown as ApiError;
      }
      employeeBankdetailsData = response.data;
      console.log(employeeBankdetailsData, "employeeBankdetailsData");
      return {
        employee: response.data,
      };
    } catch (error) {
      console.error("Failed to load employee:", error);

      // // Ensure event.detail contains updated employee data before modifying `data`
      // if (event.detail) {
      //   data = { ...data, employee: event.detail };
      // }
    }
  }
</script>

<div class="p-8 bg-surface-muted min-h-screen">
  <header class="flex justify-between items-center mb-12">
    <div class="flex items-center gap-6">
      <button class="btn-icon" on:click={() => goto("/admin/employees")}>
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-semibold text-text m-0">{employee.name}</h1>
        <div class="badge badge-success">{employee.role}</div>
      </div>
    </div>
    <div class="flex gap-3">
      <button class="btn btn-secondary">
        <i class="fas fa-envelope"></i>
        Message
      </button>
      <button class="btn btn-primary">
        <i class="fas fa-pencil"></i>
        Edit Profile
      </button>
    </div>
  </header>

  <div class="space-y-8">
    <div class="flex items-center gap-4 mb-8">
      <div class="avatar avatar-lg">
        {employee.name[0]}
      </div>
      <div class="badge {employee.active ? 'badge-success' : 'badge-danger'}">
        {employee.active ? "Active" : "Inactive"}
      </div>
    </div>

    <div class="tab-container">
      <Tabs {tabs}>
        {#if activeTab === "overview"}
          <EmployeeInfo employeeId={employee._id} {employee} />
          <!-- <div class="info-grid">
            <div class="info-card">
              <h3 class="text-base font-medium text-text mb-6">
                Contact Information
              </h3>
              <div class="space-y-4">
                <div>
                  <div class="info-label">Email</div>
                  <div class="info-value">{employee.email}</div>
                </div>
                <div>
                  <div class="info-label">Last Login</div>
                  <div class="info-value">
                    {employee.lastLoginAt
                      ? formatDate(employee.lastLoginAt)
                      : "Never"}
                  </div>
                </div>
              </div>
            </div>

            <div class="info-card">
              <h3 class="text-base font-medium text-text mb-6">
                Employment Details
              </h3>
              <div class="space-y-4">
                <div>
                  <div class="info-label">Role</div>
                  <div class="info-value">{employee.role}</div>
                </div>
                <div>
                  <div class="info-label">Joined</div>
                  <div class="info-value">{formatDate(employee.createdAt)}</div>
                </div>
              </div>
            </div>
          </div> -->
        {:else if activeTab === "leaves"}
          <EmployeeLeaves employeeId={employee._id} />
        {:else if activeTab === "attendance"}
          <EmployeeAttendance employeeId={employee._id} />
        {:else if activeTab === "training"}
          <EmployeeTrainingAttendance employeeId={employee._id} />
        {:else if activeTab === "salary"}
          <EmployeeSalary employeeId={employee._id} />
        {:else if activeTab === "it-declaration"}
          <ITDeclarationApproval employeeId={employee._id} />
        {:else if activeTab === "shifts"}
          <EmployeeShiftAssignment employeeId={employee._id} />
        {:else if activeTab === "Banking-Identity"}
          <Bankingcomponent
            employeeId={employee._id}
            {employee}
            on:refresh={handleRefresh}
          />
        {/if}
      </Tabs>
    </div>
    <!-- 
    <div class="tab-container">
      <nav class="tabs">
        <button
          class="tab-item"
          class:active={activeTab === "overview"}
          on:click={() => setActiveTab("overview")}>Overview</button
        >
        <button
          class="tab-item"
          class:active={activeTab === "leaves"}
          on:click={() => setActiveTab("leaves")}>Leaves Summary</button
        >
        <button
          class="tab-item"
          class:active={activeTab === "attendance"}
          on:click={() => setActiveTab("attendance")}>Attendance</button
        >
        <button
          class="tab-item"
          class:active={activeTab === "training"}
          on:click={() => setActiveTab("training")}>Training</button
        >
        <button
          class="tab-item"
          class:active={activeTab === "salary"}
          on:click={() => setActiveTab("salary")}>Salary Structure</button
        >
      </nav>
    </div>

    <div class="tab-content">
      {#if activeTab === "overview"}
        <div class="info-grid">
          <div class="info-card">
            <h3 class="text-base font-medium text-text mb-6">
              Contact Information
            </h3>
            <div class="space-y-4">
              <div>
                <div class="info-label">Email</div>
                <div class="info-value">{employee.email}</div>
              </div>
              <div>
                <div class="info-label">Last Login</div>
                <div class="info-value">
                  {employee.lastLoginAt
                    ? formatDate(employee.lastLoginAt)
                    : "Never"}
                </div>
              </div>
            </div>
          </div>

          <div class="info-card">
            <h3 class="text-base font-medium text-text mb-6">
              Employment Details
            </h3>
            <div class="space-y-4">
              <div>
                <div class="info-label">Role</div>
                <div class="info-value">{employee.role}</div>
              </div>
              <div>
                <div class="info-label">Joined</div>
                <div class="info-value">{formatDate(employee.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>
      {:else if activeTab === "leaves"}
        <div class="card">
          <EmployeeLeaves employeeId={employee._id} />
        </div>
      {:else if activeTab === "attendance"}
        <div class="card">
          <EmployeeAttendance employeeId={employee._id} />
        </div>
      {:else if activeTab === "training"}
        <div class="card">
          <EmployeeTrainingAttendance employeeId={employee._id} />
        </div>
      {:else if activeTab === "salary"}
        <div class="card">
          <SalaryStructureIndex employeeId={employee._id} />
        </div>
      {/if}
    </div> -->
  </div>
</div>

<style>
  .loading {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .error {
    text-align: center;
    padding: 2rem;
    color: #991b1b;
    background: #fee2e2;
    border-radius: 0.5rem;
  }
</style>
