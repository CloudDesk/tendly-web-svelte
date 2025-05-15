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
  import { employeesApi } from "$lib/services/api/employees";
  import EmployeeInfo from "$lib/components/employee/EmployeeInfo.svelte";
  import { toast } from "$lib/components/common/stores/toast.store.js";
  import Modal from "$lib/components/common/Modal.svelte";
  import EmployeeForm from "$lib/components/employee/EmployeeForm.svelte";
  export let data;
  $: ({ employee } = data);
  console.log(data.employee, "employeeemployee");
  console.log(data, "data");

  let showEditForm = false;
  let loading = false;

  let employeeBankdetailsData;
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "shifts", label: "Shifts" },
    { id: "leaves", label: "Leaves Summary" },
    { id: "attendance", label: "Attendance" },
    { id: "training", label: "Training" },
    { id: "salary", label: "Employee Salary" },
    { id: "it-declaration", label: "IT Declaration" },
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

  async function handleEditSubmit(event: CustomEvent) {
    let data = event.detail;

    //remove dates createdAt and updatedAt
    delete data.createdAt;
    delete data.updatedAt;
    delete data.currentShiftAssignmentData;
    delete data.upcomingShiftAssignmentData;
    // Remove dateOfBirth if it is false, empty, or null
    if (!data.dateOfBirth) {
      delete data.dateOfBirth;
    }

    try {
      loading = true;
      const response = await employeesApi.update(employee._id, event.detail);
      if (response.success) {
        toast.success("Profile updated successfully");
        showEditForm = false;
        // Refresh the page or update the employee data
        employee = response.data;
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      loading = false;
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
      <button class="btn btn-primary" on:click={() => (showEditForm = true)}>
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
        {/if}
      </Tabs>
    </div>
    {#if showEditForm}
      <Modal
        show={showEditForm}
        title="Edit Employee Profile"
        onClose={() => (showEditForm = false)}
      >
        <EmployeeForm
          mode="update"
          {loading}
          initialValues={data.employee}
          on:update={handleEditSubmit}
          on:cancel={() => (showEditForm = false)}
        />
      </Modal>
    {/if}
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
