<script lang="ts">
  import EmployeeAttendance from "$lib/components/attendance/EmployeeAttendance.svelte";
  import EmployeeLeaves from "$lib/components/employee/EmployeeLeaves.svelte";
  import EmployeeTrainingAttendance from "$lib/components/attendance/EmployeeTrainingAttendance.svelte";
  import { page } from "$app/stores";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import EmployeeSalary from "$lib/components/employee/EmployeeSalary.svelte";
  import ITDeclarationApproval from "$lib/components/employee/ITDeclarationApproval.svelte";
  import EmployeeShiftAssignment from "$lib/components/employee/EmployeeShiftAssignment.svelte";
  import { employeesApi } from "$lib/services/api";
  import EmployeeInfo from "$lib/components/employee/EmployeeInfo.svelte";
  import { toast } from "$lib/components/common/stores/toast.store.js";
  import Modal from "$lib/components/common/Modal.svelte";
  import EmployeeForm from "$lib/components/employee/EmployeeForm.svelte";
  import DetailPageTemplate from "$lib/components/templates/DetailPageTemplate.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";
  import InfoBanner from "$lib/components/common/InfoBanner.svelte";
  import { Edit, Mail } from "lucide-svelte";
  import LoaderNew from "$lib/components/common/LoaderNew.svelte";

  export let data: { employee?: any } | undefined;

  let employee = data?.employee;
  let showEditForm = false;
  let loading = false;
  let errorMessage: string | null = null;
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

  // Define actions for the header
  const headerActions = [
    {
      label: "Message",
      handler: () => {
        console.log("Message employee");
      },
      variant: "outline" as const,
      icon: Mail,
    },
    {
      label: "Edit Profile",
      handler: () => {
        showEditForm = true;
      },
      variant: "primary" as const,
      icon: Edit,
    },
  ];

  async function handleEditSubmit(event: CustomEvent) {
    let data = event.detail;

    // Remove unnecessary fields
    delete data.createdAt;
    delete data.updatedAt;
    delete data.currentShiftAssignmentData;
    delete data.upcomingShiftAssignmentData;

    if (!data.dateOfBirth) {
      delete data.dateOfBirth;
    }

    try {
      loading = true;
      if (!employee) {
        throw new Error("Employee data is not available");
      }
      const response = await employeesApi.update(employee._id, event.detail);
      if (response.success) {
        toast.success("Profile updated successfully");
        showEditForm = false;
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

  async function handleRefresh(event: CustomEvent) {
    try {
      loading = true;
      const response = await employeesApi.getById(employee?._id);
      if (!response.success) {
        throw new Error("Failed to fetch employee data");
      }
      employeeBankdetailsData = response.data;
      employee = response.data;
    } catch (error) {
      console.error("Failed to load employee:", error);
      errorMessage = "Failed to load employee data. Please try again later.";
    } finally {
      loading = false;
    }
  }
</script>

<DetailPageTemplate
  title=""
  subtitle=""
  backLink="/admin/employees"
  showActions={true}
  actions={headerActions}
>
  {#if loading}
    <div class="flex justify-center items-center py-10">
      <LoaderNew />
    </div>
  {:else if errorMessage}
    <InfoBanner type="error" message={errorMessage} dismissible={false} />
  {:else if !employee}
    <InfoBanner
      type="warning"
      message="Employee data is not available. Please try again later."
      dismissible={false}
    />
  {:else}
    <!-- Employee Status and Avatar Section -->
    <ContentCard noPadding={true}>
      <div class="p-6">
        <div class="flex items-center gap-4">
          <div class="avatar avatar-lg">
            {employee?.name[0]}
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-semibold text-gray-900">
                {employee?.name}
              </h2>
              <div class="badge badge-success">{employee?.role}</div>
            </div>
            <div
              class="badge {employee?.active
                ? 'badge-success'
                : 'badge-danger'}"
            >
              {employee?.active ? "Active" : "Inactive"}
            </div>
          </div>
        </div>
      </div>
    </ContentCard>

    <!-- Tabs Section -->
    <ContentCard title="Employee Details" noPadding={true}>
      <div class="tab-container">
        <Tabs
          {tabs}
          urlParam="tab"
          on:changeTab={(e) => (activeTab = e.detail)}
        >
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
            <!-- <div class="p-6"> -->
              <EmployeeShiftAssignment employeeId={employee._id} />
            <!-- </div> -->
          {/if}
        </Tabs>
      </div>
    </ContentCard>

    <!-- Edit Modal -->
    {#if showEditForm}
      <Modal
        show={showEditForm}
        title="Edit Employee Profile"
        onClose={() => (showEditForm = false)}
      >
        <EmployeeForm
          mode="update"
          {loading}
          initialValues={employee}
          on:update={handleEditSubmit}
          on:cancel={() => (showEditForm = false)}
        />
      </Modal>
    {/if}
  {/if}
</DetailPageTemplate>
