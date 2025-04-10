<script lang="ts">
  import { timesheetApi } from "$lib/services/api";
  import { auth } from "$lib/stores/auth";
  import { onMount } from "svelte";
  import * as XLSX from "xlsx";

  let timesheetData: TimesheetEntry[] = []; // Replace with your actual timesheet data
  $: user = $auth.user;
  const getTimesheetData = async () => {
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
  onMount(() => {
    getTimesheetData();
  });

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
</script>

<div>
  <button on:click={exportToExcel}>Download Timesheet</button>
</div>

<style>
  button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  button:hover {
    background-color: #0056b3;
  }
</style>
