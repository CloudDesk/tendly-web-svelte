<script lang="ts">
  import { timesheetApi } from "$lib/services/api";
  import { auth } from "$lib/stores/auth";
  import { onMount } from "svelte";
  import LoaderNew from "../common/LoaderNew.svelte";
  import { ChevronDown, CheckCheck, Info, Download } from "lucide-svelte";
  import { documentsApi } from "$lib/services/api/documents";

  let userId = "";
  let month = new Date().getMonth() + 1;
  let year = new Date().getFullYear();
  let years: number[] = [];
  let months = [
    { value: 1, name: "January" },
    { value: 2, name: "February" },
    { value: 3, name: "March" },
    { value: 4, name: "April" },
    { value: 5, name: "May" },
    { value: 6, name: "June" },
    { value: 7, name: "July" },
    { value: 8, name: "August" },
    { value: 9, name: "September" },
    { value: 10, name: "October" },
    { value: 11, name: "November" },
    { value: 12, name: "December" },
  ];

  $: user = $auth.user;
  $: userId = user?._id || "";

  export let onClose;

  let loading = false;
  let error = "";
  let success = false;
  let fileUrl = "";

  onMount(() => {
    if (user?.joiningDate) {
      const joinYear = new Date(user.joiningDate).getFullYear();
      const currentYear = new Date().getFullYear();
      years = [];
      for (let y = joinYear; y <= currentYear; y++) {
        years.push(y);
      }
    }
  });

  const generateTimesheet = async () => {
    loading = true;
    error = "";
    success = false;
    try {
      const result: any = await documentsApi.generateTimesheet(
        userId,
        month,
        year
      );
      console.log(result, "generateTimesheet");
      if (result.success) {
        fileUrl = result.data.filePath || result.data;
        success = true;
      }
    } catch (e: any) {
      console.log(e, "generateTimesheet error");
      error = e.message;
    } finally {
      loading = false;
      if (fileUrl) {
        downloadFile(fileUrl);
      }
      onClose();
    }
  };

  function downloadFile(url: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = ""; // Use the filename from the URL
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="timesheet-generator">
  <div class="header">
    <p>Select month and year to generate your timesheet report</p>
  </div>

  {#if loading}
    <div class="loader-container">
      <LoaderNew />
    </div>
  {:else}
    <form on:submit|preventDefault={generateTimesheet}>
      <div class="form-row">
        <div class="input-group">
          <label for="userId">Employee ID</label>
          <input
            type="text"
            id="userId"
            bind:value={userId}
            readonly
            class="readonly-input"
          />
        </div>
      </div>

      <div class="form-row two-columns">
        <div class="input-group">
          <label for="month">Month</label>
          <div class="select-wrapper">
            <select id="month" bind:value={month} required>
              {#each months as monthOption}
                <option value={monthOption.value}>{monthOption.name}</option>
              {/each}
            </select>
            <div class="select-icon">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <div class="input-group">
          <label for="year">Year</label>
          <div class="select-wrapper">
            <select id="year" bind:value={year} required>
              {#each years as y}
                <option value={y}>{y}</option>
              {/each}
            </select>
            <div class="select-icon">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>

      {#if error}
        <div class="alert error">
          <Info size={16} />
          <span>{error}</span>
        </div>
      {/if}

      {#if success}
        <div class="alert success">
          <CheckCheck size={16} />
          <span>Timesheet generated successfully!</span>
        </div>
      {/if}

      <div class="button-group">
        <button type="button" class="btn-secondary" on:click={onClose}>
          Cancel
        </button>
        <button type="submit" class="btn-primary" disabled={loading}>
          <Download size={16} />

          Generate Timesheet
        </button>
      </div>
    </form>
  {/if}
</div>

<!-- 
  onMount(() => {
    // getTimesheetData();
  });
  const getTimesheetData = async () => {
    console.log(user, "auth user");
    try {
      let result: any = await timesheetApi.getbyMonth(
        user?._id ?? "",
        new Date().getMonth() + 1,
        new Date().getFullYear()
      );
      console.log(result, "result");
      timesheetData = result.data;
    } catch (e) {
      console.log(e);
    }
  };


  // Function to format date to YYYY-MM-DD
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  // Function to prepare data for export
  const prepareExportData = () => {
    const exportData: any[] = [];

    timesheetData &&
      timesheetData.forEach((entry: TimesheetEntry) => {
        const formattedDate = formatDate(entry.dateUTC);

        entry.entries.forEach((task) => {
          exportData.push({
            EmployeeID: entry.employeeId,
            Date: formattedDate,
            Project: task.project,
            Description: task.description,
            "Hours Working": task.duration,
            "Total Work Hours": entry.totalDuration,
          });
        });
      });

    return exportData;
  };

  // Export function
  const exportToExcel = () => {
    const data = prepareExportData();

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheet");

    // Customize column widths (optional)
    worksheet["!cols"] = [
      { wch: 25 }, // EmployeeID
      { wch: 15 }, // Date
      { wch: 20 }, // Project
      { wch: 30 }, // Description
      { wch: 15 }, // Hours Working
      { wch: 15 }, // Total Work Hours
    ];

    // Export the file
    XLSX.writeFile(
      workbook,
      `Timesheet_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Interface for the timesheet entry
  interface TimesheetEntry {
    _id: string;
    employeeId: string;
    dateUTC: string;
    entries: {
      project: string;
      task: string;
      description: string;
      duration: number;
      _id: string;
    }[];
    totalDuration: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }

-->

<style>
  .timesheet-generator {
    padding: 1.5rem;
    /* background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    max-width: 550px;
    margin: 0 auto;
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      "Open Sans",
      "Helvetica Neue",
      sans-serif; */
  }

  .header {
    margin-bottom: 1.5rem;
    text-align: start;
  }

  .header h2 {
    color: #1e293b;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }

  .header p {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }

  .form-row {
    margin-bottom: 1.25rem;
  }

  .two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
    margin-bottom: 0.375rem;
  }

  input,
  select {
    height: 2.75rem;
    border-radius: 0.375rem;
    padding: 0 1rem;
    border: 1px solid #e2e8f0;
    background-color: #f8fafc;
    font-size: 0.875rem;
    color: #334155;
    transition:
      border-color 0.15s ease-in-out,
      box-shadow 0.15s ease-in-out;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .readonly-input {
    background-color: #f1f5f9;
    color: #64748b;
    cursor: not-allowed;
  }

  .select-wrapper {
    position: relative;
  }

  .select-wrapper select {
    appearance: none;
    padding-right: 2.5rem;
  }

  .select-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #64748b;
  }

  .button-group {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .btn-primary,
  .btn-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 2.75rem;
    padding: 0 1.25rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
    border: none;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }

  .btn-primary:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }

  .btn-secondary {
    background-color: white;
    color: #475569;
    border: 1px solid #e2e8f0;
  }

  .btn-secondary:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    margin-top: 1rem;
  }

  .error {
    background-color: #fee2e2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .success {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .loader-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  @media (max-width: 640px) {
    .two-columns {
      grid-template-columns: 1fr;
    }
  }
</style>
