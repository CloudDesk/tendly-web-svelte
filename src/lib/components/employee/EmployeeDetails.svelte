<script lang="ts">
  import { onMount } from "svelte";
  import { employeesApi } from "$lib/services/api";
  import type { User } from "$lib/types_old";
  import Modal from "$lib/components/common/Modal.svelte";
  import { lovs } from "$lib/stores/lovs";
    import EmployeeForm from "./EmployeeForm.svelte";
    import { toast } from "../common/stores/toast.store";
    import LoaderNew from "../common/LoaderNew.svelte";

  export let employeeId: string;
  export let employee : User | null = null;

  let user: User | null = employee;
  let loading = true;
  let error: string | null = null;
  let showEditModal = false;
  let managerSearchTerm = "";
  let managerSearchResults: User[] = [];
  let managerSearchLoading = false;

  onMount(() => {
    const timer = setTimeout(() => {
      loading = false; 
    }, 2000);
 return () => clearTimeout(timer);
  });

  type EditingUser = Partial<User> & {
    joiningDate?: string;
    dateOfBirth?: string;
  };

  let editingUser: EditingUser = {};

  type Field = {
    key: keyof User;
    label: string;
    inputType:
      | "text"
      | "email"
      | "tel"
      | "date"
      | "textarea"
      | "manager-lookup"
      | "select";
    required: boolean;
    options?: Array<{ label: string; value: string }>;
    lovType?: string;
    hideInView?: boolean;
  };

  let fields: Field[] = [
    { key: "email", label: "Email", inputType: "email", required: true },
    {
      key: "role",
      label: "Role",
      inputType: "select",
      required: true,
      options: [],
      lovType: "UserRole",
    },
    {
      key: "joiningDate",
      label: "Joining Date",
      inputType: "date",
      required: true,
    },
    { key: "phone", label: "Phone", inputType: "tel", required: false },
    { key: "location", label: "Location", inputType: "text", required: false },
    {
      key: "emergencyContact",
      label: "Emergency Contact",
      inputType: "tel",
      required: false,
    },
    {
      key: "address",
      label: "Address",
      inputType: "textarea",
      required: false,
    },
    {
      key: "bloodGroup",
      label: "Blood Group",
      inputType: "text",
      required: false,
    },
    {
      key: "dateOfBirth",
      label: "Date of Birth",
      inputType: "date",
      required: false,
    },
    {
      key: "managerId",
      label: "Manager",
      inputType: "manager-lookup",
      required: false,
    },
  ];

  // Subscribe to LOV store changes
  let lovValues: { [key: string]: Array<{ label: string; value: string }> } =
    {};
  lovs.subscribe((values) => {
    lovValues = values;
    // Update fields with LOV values
    fields = fields.map((field) => {
      if (field.lovType && lovValues[field.lovType]) {
        return { ...field, options: [...lovValues[field.lovType]] };
      }
      return { ...field, options: field.options || [] };
    });
  });

  function handleEdit() {
    if (user) {
      // Format date fields to YYYY-MM-DD for input[type="date"]
      editingUser = {
        ...user,
        joiningDate: user.joiningDate
          ? new Date(user.joiningDate).toISOString().split("T")[0]
          : undefined,
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : undefined,
      };
      managerSearchTerm = user.managerName || "";
      showEditModal = true;
    }
  }

  async function handleSearchManager(term: string) {
    if (term.length < 2) {
      managerSearchResults = [];
      return;
    }
    try {
      managerSearchLoading = true;
      const response: any = await employeesApi.search(term);
      managerSearchResults = response.data.filter(
        (u: User) => u._id !== employeeId
      );
    } catch (err) {
      console.error("Failed to search managers:", err);
      managerSearchResults = [];
    } finally {
      managerSearchLoading = false;
    }
  }

  function handleSelectManager(manager: User) {
    editingUser = {
      ...editingUser,
      managerId: manager._id,
      managerName: manager.name,
    };
    managerSearchTerm = manager.name;
    managerSearchResults = [];
  }

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
        showEditModal = false;
        user = response.data ?? null;
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

  let debouncedSearch: NodeJS.Timeout;
  $: {
    clearTimeout(debouncedSearch);
    debouncedSearch = setTimeout(() => {
      handleSearchManager(managerSearchTerm);
    }, 300);
  }

  function formatDate(dateStr: any): string {
    if (!dateStr || typeof dateStr !== "string") return "";
    return new Date(dateStr).toLocaleDateString();
  }

  // Helper to avoid TypeScript index errors
  function safeAccess<T extends keyof User>(key: T): string | undefined {
    if (!user) return undefined;
    const value = (user as User)[key];
    return value ? String(value) : undefined;
  }

  function getDisplayValue(field: Field, value: any): string {
    if (!value) return "";

    if (field.key === "managerId" && user?.managerName) {
      return user.managerName;
    }

    if (field.inputType === "select" && Array.isArray(field.options)) {
      const option = field.options.find((opt) => opt.value === value);
      return option ? option.label : String(value);
    }

    if (field.inputType === "date") {
      return formatDate(value);
    }

    return String(value);
  }
</script>

<div class="space-y-6">
  <div class="flex justify-end items-center">
    {#if !loading && user}
    <button class="btn btn-secondary btn-sm mr-2" on:click={handleEdit}>
      Edit
    </button>
  {/if}
  </div>

  {#if error}
    <div class="alert alert-error">{error}</div>
  {:else if loading}
    <LoaderNew/>
  {:else if user}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each fields as field}
        {#if !field.hideInView}
          <div class="card bg-base-100">
            <div class="card-body">
              <h3 class="text-sm font-medium text-neutral-500">
                {field.label}
              </h3>
              <p class="mt-1 text-base">
                {getDisplayValue(field, safeAccess(field.key))}
              </p>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<Modal
  show={showEditModal}
  title="Edit Employee Details"
  onClose={() => (showEditModal = false)}
>
 <EmployeeForm
 mode="update"
 {loading}
 initialValues={employee || user}
 on:update={handleEditSubmit}
  on:cancel={() => (showEditModal = false)}
 />
</Modal>

<style>
  .loading {
    display: flex;
    justify-content: center;
    padding: 8px;
    color: #737373;
  }
</style>
