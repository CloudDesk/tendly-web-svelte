<script lang="ts">
  import { payrollApi } from "$lib/services/api/payroll";

  // Mock data for the payroll records
  const employees = [
    {
      id: "EMP001",
      name: "Emma Johnson",
      department: "Engineering",
      salary: 75000,
      status: "Processed",
      date: "2025-03-01",
    },
    {
      id: "EMP002",
      name: "Michael Chen",
      department: "Marketing",
      salary: 68000,
      status: "Processed",
      date: "2025-03-01",
    },
    {
      id: "EMP003",
      name: "Sarah Williams",
      department: "HR",
      salary: 62000,
      status: "Pending",
      date: "2025-03-01",
    },
    {
      id: "EMP004",
      name: "David Rodriguez",
      department: "Engineering",
      salary: 78000,
      status: "Processed",
      date: "2025-03-01",
    },
    {
      id: "EMP005",
      name: "Lisa Thompson",
      department: "Finance",
      salary: 82000,
      status: "Pending",
      date: "2025-03-01",
    },
    {
      id: "EMP006",
      name: "Robert Garcia",
      department: "Product",
      salary: 73000,
      status: "Processed",
      date: "2025-03-01",
    },
    {
      id: "EMP007",
      name: "Jennifer Lee",
      department: "Sales",
      salary: 69000,
      status: "Processed",
      date: "2025-03-01",
    },
    {
      id: "EMP008",
      name: "Thomas Wilson",
      department: "Engineering",
      salary: 76000,
      status: "Pending",
      date: "2025-03-01",
    },
  ];

  // Filters and search state
  let searchQuery = "";
  let selectedMonth = "March";
  let selectedYear = "2025";
  let selectedDepartment = "All";

  // Derived data based on filters
  $: filteredEmployees = employees.filter((emp) => {
    // Filter by search query
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by department
    const matchesDepartment =
      selectedDepartment === "All" || emp.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  // Payroll summary calculations
  $: totalEmployeesPaid = filteredEmployees.filter(
    (emp) => emp.status === "Processed"
  ).length;
  $: totalPayrollExpense = filteredEmployees
    .filter((emp) => emp.status === "Processed")
    .reduce((sum, emp) => sum + emp.salary, 0);
  $: pendingApprovals = filteredEmployees.filter(
    (emp) => emp.status === "Pending"
  ).length;

  // Action handlers
  const generatePayslips = async () => {
    console.log("generatePayslips", selectedMonth, selectedYear);
    const indexId = months.indexOf(selectedMonth);

    if (indexId === -1) {
      console.error("Invalid month selection:", selectedMonth);
      return null; // Return null if the month is not found
    }

    // Convert index to 1-based month (January = 01)
    const month = (indexId + 1).toString().padStart(2, "0");

    const formattedDate = `${selectedYear}-${month}`;
    console.log("Formatted Date:", formattedDate);

    let result = await payrollApi.payrollInitiate({ monthYear: formattedDate });
    console.log(result);
  };

  const releasePayslips = (target: any) => {
    alert(`Releasing payslips for ${target}...`);
  };

  const viewPayslipHistory = () => {
    alert("Opening payslip history view...");
  };

  const createPayrollTemplate = () => {
    alert("Opening payroll template editor...");
  };

  const viewPayslip = (employee: any) => {
    alert(`Viewing payslip for ${employee.name}...`);
  };

  const downloadPayslip = (employee: any) => {
    alert(`Downloading payslip for ${employee.name}...`);
  };

  // Available departments for filter
  const departments = [
    "All",
    "Engineering",
    "Marketing",
    "HR",
    "Finance",
    "Product",
    "Sales",
  ];

  // Months for filter
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Years for filter
  const years = ["2025", "2024", "2023"];
</script>

<div class="page">
  <!-- Header Section -->
  <div class="header">
    <div class="title-section">
      <h1>Payroll Management</h1>
      <p class="subtitle">
        Manage employee payroll, generate payslips, and track payroll history.
      </p>
    </div>

    <div class="search-filter-section">
      <div class="search-box">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Search by name or ID"
          bind:value={searchQuery}
        />
      </div>

      <div class="filters">
        <div class="filter">
          <label for="month">Month</label>
          <select id="month" bind:value={selectedMonth}>
            {#each months as month}
              <option value={month}>{month}</option>
            {/each}
          </select>
        </div>

        <div class="filter">
          <label for="year">Year</label>
          <select id="year" bind:value={selectedYear}>
            {#each years as year}
              <option value={year}>{year}</option>
            {/each}
          </select>
        </div>

        <div class="filter">
          <label for="department">Department</label>
          <select id="department" bind:value={selectedDepartment}>
            {#each departments as department}
              <option value={department}>{department}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions Section -->
  <div class="quick-actions">
    <button type="button" class="action-card" on:click={generatePayslips}>
      <div class="action-icon">🖨️</div>
      <div class="action-text">
        <h3>Generate Payslips</h3>
        <p>Create payslips for all employees</p>
      </div>
    </button>

    <div class="action-card dropdown-parent">
      <div class="action-icon">📤</div>
      <div class="action-text">
        <h3>Release Payslips</h3>
        <p>Send payslips to employees</p>
      </div>
      <div class="dropdown-menu">
        <button
          class="dropdown-item"
          on:click={() => releasePayslips("All Employees")}
          type="button"
        >
          All Employees
        </button>
        <button
          class="dropdown-item"
          on:click={() => releasePayslips("Selected Employees")}
          type="button"
        >
          Selected Employees
        </button>
      </div>
    </div>

    <button class="action-card" on:click={viewPayslipHistory} type="button">
      <div class="action-icon">📜</div>
      <div class="action-text">
        <h3>View Payslip History</h3>
        <p>Access past payroll records</p>
      </div>
    </button>

    <button type="button" class="action-card" on:click={createPayrollTemplate}>
      <div class="action-icon">⚙️</div>
      <div class="action-text">
        <h3>Create Payroll Template</h3>
        <p>Configure payroll format</p>
      </div>
    </button>
  </div>

  <!-- Payroll Summary Section -->
  <div class="summary-section">
    <div class="summary-card">
      <h3>Total Employees Paid</h3>
      <div class="summary-value">{totalEmployeesPaid}</div>
    </div>

    <div class="summary-card">
      <h3>Total Payroll Expense</h3>
      <div class="summary-value">${totalPayrollExpense.toLocaleString()}</div>
    </div>

    <div class="summary-card">
      <h3>Pending Approvals</h3>
      <div class="summary-value">{pendingApprovals}</div>
    </div>
  </div>

  <!-- Payslip Table Section -->
  <div class="payslip-table-section">
    <h2>Employee Payslips</h2>

    <div class="table-container">
      <table class="payslip-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Salary</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredEmployees as employee}
            <tr>
              <td>{employee.id}</td>
              <td>{employee.name}</td>
              <td>{employee.department}</td>
              <td>${employee.salary.toLocaleString()}</td>
              <td>
                <span class="status-badge {employee.status.toLowerCase()}">
                  {employee.status}
                </span>
              </td>
              <td class="actions">
                <button
                  class="action-btn view"
                  on:click={() => viewPayslip(employee)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    ></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button
                  class="action-btn download"
                  on:click={() => downloadPayslip(employee)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  /* Base Styles */
  :global(body) {
    font-family:
      "Inter",
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      "Open Sans",
      "Helvetica Neue",
      sans-serif;
    margin: 0;
    padding: 0;
    color: #333;
    background: #f6f7fb;
  }

  .page {
    padding: 24px;
    background: #f6f7fb;
    min-height: 100vh;
  }

  /* Header Section Styles */
  .header {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 24px;
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  .title-section h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: #2d3748;
  }

  .subtitle {
    margin: 8px 0 0;
    color: #718096;
    font-size: 15px;
  }

  .search-filter-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  @media (min-width: 768px) {
    .search-filter-section {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .search-box {
    display: flex;
    align-items: center;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 16px;
    width: 100%;
    max-width: 320px;
  }

  .search-box svg {
    color: #718096;
    margin-right: 10px;
  }

  .search-box input {
    border: none;
    outline: none;
    background: transparent;
    width: 100%;
    font-size: 14px;
    color: #4a5568;
  }

  .filters {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .filter {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter label {
    font-size: 12px;
    color: #718096;
    font-weight: 500;
  }

  .filter select {
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: white;
    font-size: 14px;
    color: #4a5568;
    outline: none;
    cursor: pointer;
    min-width: 100px;
  }

  /* Quick Actions Section */
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .action-card {
    display: flex;
    align-items: center;
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .action-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .action-icon {
    font-size: 24px;
    margin-right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: #f0f9ff;
    border-radius: 10px;
  }

  .action-text h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #2d3748;
  }

  .action-text p {
    margin: 4px 0 0;
    font-size: 13px;
    color: #718096;
  }

  /* Dropdown styles */
  .dropdown-parent {
    position: relative;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    z-index: 10;
    display: none;
    overflow: hidden;
  }

  .dropdown-parent:hover .dropdown-menu {
    display: block;
  }

  .dropdown-item {
    padding: 12px 16px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .dropdown-item:hover {
    background: #f7fafc;
  }

  /* Summary Section */
  .summary-section {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .summary-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  .summary-card h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: #718096;
  }

  .summary-value {
    font-size: 28px;
    font-weight: 600;
    color: #2d3748;
    margin-top: 8px;
  }

  /* Table Section */
  .payslip-table-section {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }

  .payslip-table-section h2 {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
    color: #2d3748;
  }

  .table-container {
    overflow-x: auto;
  }

  .payslip-table {
    width: 100%;
    border-collapse: collapse;
  }

  .payslip-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #718096;
    border-bottom: 1px solid #e2e8f0;
  }

  .payslip-table td {
    padding: 14px 16px;
    font-size: 14px;
    color: #4a5568;
    border-bottom: 1px solid #f0f2f5;
  }

  .payslip-table tr:hover {
    background: #f7fafc;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-badge.processed {
    background: #e6fffa;
    color: #2c7a7b;
  }

  .status-badge.pending {
    background: #fff5f5;
    color: #c53030;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn.view {
    background: #ebf8ff;
    color: #3182ce;
  }

  .action-btn.download {
    background: #e6fffa;
    color: #2c7a7b;
  }

  .action-btn:hover {
    transform: translateY(-2px);
  }
</style>
