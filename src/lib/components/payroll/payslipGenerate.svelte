<script lang="ts">
    import { onMount } from "svelte";
    import {
      employeesApi,
      lovsApi,
      payrollApi,
      type PayrollInitiatePayload,
    } from "$lib/services/api";
    import {
      Archive,
      ChevronLeft,
      ChevronRight,
      Loader2,
      Search,
    } from "lucide-svelte";
  import { payslipApi } from "$lib/services/api/payslip";
  
    interface Employee {
      _id: string;
      name: string;
      email: string;
      role: string;
      departmentId: string;
      joiningDate: string;
      payrollStatus?:
        | "Draft"
        | "PendingApproval"
        | "InPayment"
        | "Completed"
        | "Failed"
        | "RetryPending"
        | "Cancelled"
        | null;

        paymentConfirmedAt:string | null;
    }

  
    let employees: Employee[] = [];
    let selectedEmployees = new Set<string>();
    let selectAll = false;
  
    let page = 1;
    let limit = 10;
    let totalPages = 1;
    let totalRecords = 0;
  
    // Set default month to current year and month in "YYYY-MM" format
    let month = (() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 0).padStart(2, "0");
      return `${y}-${m}`;
    })();
    let departmentId = "";
    let role = "";
    let search = "";
    let statusFilter = "";
    let userDepartments: { label: string; value: string }[] = [];
    let userRoles: { label: string; value: string }[] = [];
  
    // Loading states
    let isLoadingEmployees = false;
    let isLoadingDepartments = false;
    let isLoadingRoles = false;
    let isGenerating = false;
  
    // Status options with labels
    const statusOptions = [
      { value: "Active", label: "Active" },
      { value: "On Hold", label: "Resignation Applied - Pending Approval" },
      { value: "Resigned", label: "Resignation Approved - Final Settlement" },
    ];
  
    // Map current status to the next "Proceed" status based on BE stateTransitions
    const statusTransitionMap: Record<string, string> = {
      Draft: "PendingApproval",
      PendingApproval: "InPayment",
      Failed: "RetryPending",
      RetryPending: "InPayment",
    };
  
    async function fetchDepartments() {
      try {
        isLoadingDepartments = true;
        const departmentResponse: any = await lovsApi.getByType("department");
        if (departmentResponse.success) {
          userDepartments = departmentResponse.data.values.map((dept: any) => ({
            label: dept.label,
            value: dept.value,
          }));
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        isLoadingDepartments = false;
      }
    }
  
    async function fetchRoles() {
      try {
        isLoadingRoles = true;
        const roleResponse: any = await lovsApi.getByType("role");
        if (roleResponse.success) {
          userRoles = roleResponse.data.values.map((role: any) => ({
            label: role.label,
            value: role.value,
          }));
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        isLoadingRoles = false;
      }
    }
  
    async function fetchPayrollStatus(
      userIds: string[],
      year: string,
      month: string
    ) {
      console.log("fetchPayrollSttaus", userIds, year, month);
      try {
        const response: any = await payrollApi.getUserPayrollStatus(
          userIds,
          Number(year),
          Number(month)
        );
        console.log(response, "Payroll status response");
        if (!response.success) {
          return [];
        }
        return response.data || [];
      } catch (error) {
        console.error("Error fetching payroll status:", error);
        return [];
      }
    }
  
    async function fetchEmployees() {
      try {
        isLoadingEmployees = true;
        const filters = {
          page,
          limit,
          month,
          departmentId,
          role,
          search,
          status: statusFilter,
        };
  
        // Remove empty values in filter
        Object.keys(filters).forEach((key) => {
          if (
            filters[key as keyof typeof filters] === "" ||
            filters[key as keyof typeof filters] === undefined ||
            filters[key as keyof typeof filters] === null
          ) {
            delete (filters as any)[key];
          }
        });
        console.log(filters, "Filters for employee API");
        const response: any = await employeesApi.getforPayroll(filters);
        const employeeData = response.data || [];
  
        // Extract year and month from the month filter (format: YYYY-MM)
        const [year, monthNum] = month.split("-");
  
        //paymentConfirmedAt

        // Fetch payroll status for all employees in the current page
        const userIds = employeeData.map((emp: Employee) => emp._id);
        const payrollStatuses = await fetchPayrollStatus(userIds, year, monthNum);
  
        // Merge payroll status with employee data
        employees = employeeData.map((emp: Employee) => ({
          ...emp,
          payrollStatus:
            payrollStatuses.find((status: any) => status.employeeId === emp._id)
              ?.status || null,

              paymentConfirmedAt :    payrollStatuses.find((status: any) => status.employeeId === emp._id)
              ?.paymentConfirmedAt || null,
        }));
  
        page = response.meta.page;
        totalPages = response.meta.totalPages;
        totalRecords = response.meta.total || 0;
  
        // Reset selections when data changes
        selectedEmployees = new Set();
        selectAll = false;
      } catch (error) {
        console.error("Error fetching employees:", error);
        employees = [];
      } finally {
        isLoadingEmployees = false;
      }
    }
  
    function toggleSelectAll() {
        console.log("toggleSelectAll")
      if (selectAll) {
        console.log("toggleSelectAll if")
        selectedEmployees = new Set(
          employees
            .filter(
              (emp) =>
                emp.payrollStatus === "Completed"
            )
            .map((emp) => emp._id)
        );
      } else {
        console.log("else toggleSelectAll")
        selectedEmployees = new Set();
      }
      selectedEmployees = selectedEmployees; // Trigger reactivity
    }
  
    function toggleEmployee(id: string) {
      const employee = employees.find((emp) => emp._id === id);
      if (
        !employee ||
        (employee.payrollStatus &&
          !["Failed", "Cancelled"].includes(employee.payrollStatus))
      ) {
        return; // Prevent selection if status is not Failed, Cancelled, or null
      }
  
      if (selectedEmployees.has(id)) {
        selectedEmployees.delete(id);
      } else {
        selectedEmployees.add(id);
      }
      selectedEmployees = selectedEmployees; // Trigger reactivity
  
      // Update selectAll state
      selectAll =
        selectedEmployees.size ===
          employees.filter(
            (emp) =>
              emp.payrollStatus === "Completed"
          ).length && employees.length > 0;
    }
  
    function formatDate(dateStr: string) {
      return new Date(dateStr).toLocaleDateString();
    }
  
    function formatLabel(value: string): string {
      return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  
    function getPayrollStatusColor(status: string | null | undefined): string {
      switch (status) {
        case "Draft":
          return "text-gray-600 bg-gray-100";
        case "Pending Approval":
          return "text-yellow-600 bg-yellow-100";
        case "Processing":
          return "text-blue-600 bg-blue-100";
        case "Processed":
          return "text-green-600 bg-green-100";
        case "Completed":
          return "text-green-600 bg-green-100";
        case "Failed":
          return "text-red-600 bg-red-100";
        case "Cancelled":
          return "text-gray-600 bg-gray-100";
        default:
          return "text-gray-600 bg-gray-100";
      }
    }
  
    function clearFilters() {
      month = month;
      departmentId = "";
      role = "";
      search = "";
      statusFilter = "";
      page = 1;
      fetchEmployees();
    }
  
 
  

  
    async function generatePayslip() {
      if (isGenerating || selectedEmployees.size === 0) return;
      isGenerating = true;
  
      try {
        const payload: PayrollInitiatePayload = { monthYear: month };
  
        if (selectAll) {
          const filters = {
            departmentId: departmentId || undefined,
            role: role || undefined,
            status: statusFilter || undefined,
            search: search || undefined,
          };
          payload.filters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== undefined)
          );
        } else {
          payload.userIds = Array.from(selectedEmployees);
        }
        console.log(payload, "Payroll processing payload");
        const response = await payslipApi.bulkGenerate(payload);
        console.log(response, "Payroll processing response");
  
        // Reset selections after successful processing
        selectedEmployees = new Set();
        selectAll = false;
  
        // Refresh employee data to update payroll statuses
        await fetchEmployees();
      } catch (error) {
        console.error(error, "Error processing payroll");
      } finally {
        isGenerating = false;
      }
    }
  
    // Handle filter changes - only call API when these specific filters change
    function handleFilterChange() {
      page = 1;
      fetchEmployees();
    }


  
    onMount(() => {
      fetchDepartments();
      fetchRoles();
      fetchEmployees();
    });
  </script>
  
  <div class="p-4 md:p-6 bg-gray-50 min-h-screen">
    <!-- Header -->
    <div class="mb-4 md:mb-6">
      <h1 class="text-xl md:text-2xl font-bold text-gray-900">
        Payslip Processing
        {new Date(month + "-01").toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}
      </h1>
    </div>
  
    <!-- Filter Section -->
    <div class="bg-white shadow rounded-md mb-4 md:mb-6">
      <div class="flex flex-wrap gap-4 p-4">
        <!-- Month Filter -->
        <div class="flex flex-col w-full sm:w-auto">
          <label class="text-sm font-medium text-gray-600 mb-1">Month</label>
          <input
            type="month"
            bind:value={month}
            on:change={handleFilterChange}
            class="min-w-[160px] px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
  
        <!-- Department Filter -->
        <div class="flex flex-col w-full sm:w-auto">
          <label class="text-sm font-medium text-gray-600 mb-1">Department</label>
          <select
            bind:value={departmentId}
            on:change={handleFilterChange}
            class="min-w-[160px] px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoadingDepartments}
          >
            <option value="">All Departments</option>
            {#each userDepartments as dept}
              <option value={dept.value}>{dept.label}</option>
            {/each}
          </select>
        </div>
  
        <!-- Role Filter -->
        <div class="flex flex-col w-full sm:w-auto">
          <label class="text-sm font-medium text-gray-600 mb-1">Role</label>
          <select
            bind:value={role}
            on:change={handleFilterChange}
            class="min-w-[160px] px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoadingRoles}
          >
            <option value="">All Roles</option>
            {#each userRoles as role}
              <option value={role.value}>{role.label}</option>
            {/each}
          </select>
        </div>
  
        <!-- Status Filter -->
        <div class="flex flex-col w-full sm:w-auto">
          <label class="text-sm font-medium text-gray-600 mb-1">Status</label>
          <select
            bind:value={statusFilter}
            on:change={handleFilterChange}
            class="min-w-[160px] px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            {#each statusOptions as status}
              <option value={status.value}>{status.label}</option>
            {/each}
          </select>
        </div>
  
        <!-- Search -->
        <div class="flex flex-col w-full sm:w-auto">
          <label class="text-sm font-medium text-gray-600 mb-1">Search</label>
          <div class="relative">
            <input
              type="text"
              placeholder="Search employees..."
              bind:value={search}
              class="min-w-[160px] w-full px-3 py-2 pr-10 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              on:keydown={(e) => e.key === "Enter" && handleFilterChange()}
            />
            <button
              on:click={handleFilterChange}
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Search size="16" />
            </button>
          </div>
        </div>
  
        <!-- Clear Filters -->
        <div class="flex flex-col justify-end w-full sm:w-auto">
          <button
            on:click={clearFilters}
            class="text-sm text-blue-600 hover:underline px-2 py-2 whitespace-nowrap"
          >
            Clear Filters
          </button>
        </div>
        
      </div>
  
      <!-- Loading indicator for filters -->
      {#if isLoadingEmployees}
        <div class="px-4 pb-4">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 class="animate-spin" size="16" />
            Loading employees...
          </div>
        </div>
      {/if}
  
    </div>
  
    <!-- Table -->
    <div class="overflow-x-auto rounded-lg shadow-sm">
      <div class="bg-white">
        <table class="w-full table-auto text-sm text-left border-collapse">
          <thead class="bg-gray-100 sticky top-0 z-10 text-gray-700">
            <tr>
              <th class="px-4 py-3 font-semibold">Employee Name</th>
              <th class="px-4 py-3 font-semibold">Role</th>
              <th class="px-4 py-3 font-semibold">Department</th>
              <th class="px-4 py-3 font-semibold">Payment Date</th>
              <th class="px-4 py-3 font-semibold">Payroll Status</th>
              <th class="px-4 py-3 font-semibold text-center">
                <input
                  type="checkbox"
                  bind:checked={selectAll}
                  on:change={toggleSelectAll}
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={employees.length === 0 ||
                    isLoadingEmployees ||
                    employees.every(
                      (emp) =>
                        emp.payrollStatus &&
                        !["Completed"].includes(emp.payrollStatus)
                    )}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {#if isLoadingEmployees}
              <!-- Loading skeleton rows -->
              {#each Array(5) as _}
                <tr class="even:bg-gray-50">
                  <td class="px-4 py-3 border-b">
                    <div class="animate-pulse">
                      <div class="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                      <div class="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </td>
                  <td class="px-4 py-3 border-b">
                    <div class="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td class="px-4 py-3 border-b">
                    <div class="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td class="px-4 py-3 border-b">
                    <div class="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td class="px-4 py-3 border-b">
                    <div class="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td class="px-4 py-3 border-b text-center">
                    <div
                      class="animate-pulse h-4 w-4 bg-gray-200 rounded mx-auto"
                    ></div>
                  </td>
                </tr>
              {/each}
            {:else}
              {#each employees as emp}
                <tr class="even:bg-gray-50 hover:bg-gray-50 transition">
                  <td class="px-4 py-3 text-gray-600 border-b">
                    <div class="font-medium text-gray-900">{emp.name}</div>
                    <div class="text-gray-500 text-xs">{emp.email}</div>
                  </td>
                  <td class="px-4 py-3 text-gray-600 border-b"
                    >{formatLabel(emp.role)}</td
                  >
                  <td class="px-4 py-3 text-gray-600 border-b"
                    >{formatLabel(emp.departmentId)}</td
                  >
                  <td class="px-4 py-3 text-gray-600 border-b">
                    {emp.paymentConfirmedAt ? formatDate(emp.paymentConfirmedAt) : '-'}
                  </td>
                  
                  <td class="px-4 py-3 text-gray-600 border-b">
                    <span
                      class="inline-block px-2 py-1 rounded text-xs {getPayrollStatusColor(
                        emp.payrollStatus
                      )}"
                    >
                      {emp.payrollStatus || "No Record"}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-600 border-b text-center">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.has(emp._id)}
                      on:change={() => toggleEmployee(emp._id)}
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={emp.payrollStatus &&
                        !["Completed"].includes(emp.payrollStatus)}
                    />
                  </td>
                </tr>
              {/each}
              {#if employees.length === 0}
                <tr>
                  <td colspan="6" class="text-center p-8 text-gray-500">
                    <div class="flex flex-col items-center">
                      <Archive class="w-12 h-12 text-gray-300 mb-2" />
                      <p>No employees found</p>
                      <p class="text-sm">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              {/if}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  
    <!-- Pagination and Actions -->
    <div
      class="flex flex-col sm:flex-row justify-between items-center mt-4 px-4 gap-4"
    >
      <!-- Records Info -->
      <div class="text-sm text-gray-500">
        {#if totalRecords > 0}
          Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalRecords)} of
          {totalRecords}
        {:else}
          No records found
        {/if}
      </div>
  
      <!-- Pagination Controls -->
      <div class="flex items-center space-x-2">
        <button
          disabled={page <= 1 || isLoadingEmployees}
          on:click={() => {
            page--;
            fetchEmployees();
          }}
          class="px-3 py-1 border rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronLeft size="16" />
          <span class="hidden sm:inline">Previous</span>
        </button>
  
        {#if totalPages <= 7}
          {#each Array(totalPages) as _, i}
            <button
              on:click={() => {
                page = i + 1;
                fetchEmployees();
              }}
              class="px-3 py-1 border rounded-md text-sm {page === i + 1
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100'}"
              disabled={isLoadingEmployees}
            >
              {i + 1}
            </button>
          {/each}
        {:else}
          <!-- Show first page -->
          <button
            on:click={() => {
              page = 1;
              fetchEmployees();
            }}
            class="px-3 py-1 border rounded-md text-sm {page === 1
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100'}"
            disabled={isLoadingEmployees}
          >
            1
          </button>
  
          {#if page > 3}
            <span class="px-2 text-gray-500">...</span>
          {/if}
  
          <!-- Show current page range -->
          {#each Array(3) as _, i}
            {#if page + i - 1 > 1 && page + i - 1 < totalPages}
              <button
                on:click={() => {
                  page = page + i - 1;
                  fetchEmployees();
                }}
                class="px-3 py-1 border rounded-md text-sm {page === page + i - 1
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100'}"
                disabled={isLoadingEmployees}
              >
                {page + i - 1}
              </button>
            {/if}
          {/each}
  
          {#if page < totalPages - 2}
            <span class="px-2 text-gray-500">...</span>
          {/if}
  
          <!-- Show last page -->
          <button
            on:click={() => {
              page = totalPages;
              fetchEmployees();
            }}
            class="px-3 py-1 border rounded-md text-sm {page === totalPages
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100'}"
            disabled={isLoadingEmployees}
          >
            {totalPages}
          </button>
        {/if}
  
        <button
          disabled={page >= totalPages || isLoadingEmployees}
          on:click={() => {
            page++;
            fetchEmployees();
          }}
          class="px-3 py-1 border rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span class="hidden sm:inline">Next</span>
          <ChevronRight size="16" />
        </button>
      </div>
  
      <!-- Process Button -->
      <div class="flex items-center gap-4 w-full sm:w-auto justify-end">
        <button
          class="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          on:click={generatePayslip}
          disabled={isGenerating || selectedEmployees.size === 0}
        >
          {#if isGenerating}
            <Loader2 class="animate-spin" size="16" />
            Generating...
          {:else}
            Generate Payslip ▶
          {/if}
        </button>
      </div>
    </div>
  </div>
  