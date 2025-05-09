<script lang="ts">
  import { attendanceApi, shiftsApi } from "$lib/services/api";
  import { auth } from "$lib/stores/auth";
  import { toast } from "../common/stores/toast.store";
  import { writable } from "svelte/store";
  import type { AttendanceRecord } from "$lib/types";
  import { onMount } from "svelte";
  import RegularizationCalendar from "./RegularizationCalendar.svelte";
  import RegularizationForm from "./RegularizationForm.svelte";
  import { formatDate } from "$lib/utils/date";

  const userId: string = $auth.user?._id ?? "";
  const attendanceRecords = writable<AttendanceRecord[]>([]);
  const isLoading = writable(false);
  let selectedDates: Date[] = [];
  let expandedDates: Record<string, boolean> = {};
  let isRegularizationLoading = false;
  let remarks = "";

  // Form data for regularization
  let shiftData: Record<
    string,
    {
      date: Date;
      dayStr: string;
      fromTime: string;
      toTime: string;
      actualFromTime: string;
      actualToTime: string;
      reason: string;
      shiftType: string;
    }
  > = {};

  // Format date for display
  function formatDisplayDate(date: Date): string {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = days[date.getDay()];
    const dateNum = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("default", { month: "short" });
    return `${dateNum} ${day}`;
  }

  // Format date with day for header
  function formatHeaderDate(date: Date): string {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = days[date.getDay()];
    return `${day}`;
  }

  // Format date as numeric for display
  function formatNumericDate(date: Date): string {
    return date.getDate().toString().padStart(2, "0");
  }

  // Toggle expanded state for a date
  function toggleDateExpanded(dateStr: string) {
    expandedDates = {
      ...expandedDates,
      [dateStr]: !expandedDates[dateStr],
    };
  }

  // Fetch attendance records for the selected month
  async function fetchAttendanceRecords(year?: number, month?: number) {
    isLoading.set(true);
    try {
      // Simple month range calculation instead of using getMonthStartEnd
      const firstDayOfMonth = new Date(
        year || new Date().getFullYear(),
        (month || new Date().getMonth()) - 1,
        1
      );
      const lastDayOfMonth = new Date(
        year || new Date().getFullYear(),
        month || new Date().getMonth(),
        0
      );

      const startDate = formatDate(firstDayOfMonth);
      const endDate = formatDate(lastDayOfMonth);

      // Optional API call if needed
      // const response = await attendanceApi.search({
      //   userIds: [userId],
      //   startDate,
      //   endDate
      // });

      isLoading.set(false);
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      isLoading.set(false);
    }
  }

  // Handle date selection
  function handleDateSelect(event: CustomEvent<{ selectedDates: Date[] }>) {
    selectedDates = [...event.detail.selectedDates];
    console.log(selectedDates, "selectedDates");
    // Initialize data for each selected date
    selectedDates.forEach((date) => {
      const dateStr = date.toISOString().split("T")[0];
      if (!shiftData[dateStr]) {
        shiftData[dateStr] = {
          date,
          dayStr: formatHeaderDate(date),
          fromTime: "09:00",
          toTime: "18:00",
          actualFromTime: "",
          actualToTime: "",
          reason: "",
          shiftType: "General Shift",
        };
      }

      // Default to expanded state for new dates
      if (expandedDates[dateStr] === undefined) {
        expandedDates[dateStr] = true;
      }
    });

    // Remove data for dates that are no longer selected
    Object.keys(shiftData).forEach((dateStr) => {
      const stillSelected = selectedDates.some(
        (date) => date.toISOString().split("T")[0] === dateStr
      );
      if (!stillSelected) {
        delete shiftData[dateStr];
      }
    });
  }

  // Handle month change
  function handleMonthChange(
    event: CustomEvent<{ year: number; month: number }>
  ) {
    const { year, month } = event.detail;
    // Optional: fetch shift data for new month
  }

  // Update shift data
  function updateShiftData(dateStr: string, field: string, value: string) {
    if (shiftData[dateStr]) {
      shiftData[dateStr] = {
        ...shiftData[dateStr],
        [field]: value,
      };
    }
  }

  // Handle form submission
  async function handleFormSubmit(event: CustomEvent<any>) {
    isRegularizationLoading = true;
    try {
      // The form component has already prepared the data in the correct format
      const regularizationData = event.detail;

      // Make API call for each date
      const results = await Promise.all(
        regularizationData.map(async (data: any) => {
          return await attendanceApi.regularize(data);
        })
      );

      // Check if all requests were successful
      const allSuccessful = results.every((result) => result.success);

      if (allSuccessful) {
        toast.success("Regularization applied successfully");
        selectedDates = []; // Clear selected dates after successful submission
      } else {
        toast.error("Some regularization requests failed");
      }
    } catch (error) {
      console.error("Failed to apply regularization:", error);
      toast.error("Failed to apply regularization");
    } finally {
      isRegularizationLoading = false;
    }
  }

  // Handle form cancellation
  function handleFormCancel() {
    selectedDates = []; // Clear selected dates
  }

  onMount(() => {
    const currentDate = new Date();
    fetchAttendanceRecords(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    );
  });
</script>

<div class="p-4">
  <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
    <!-- Calendar Section - 30% -->
    <div class="md:col-span-4 xl:col-span-3">
      <RegularizationCalendar
        bind:selectedDates
        weekendDays={[]}
        allowFutureDates={false}
        maxFutureDays={0}
        on:dateSelect={handleDateSelect}
        on:monthChange={handleMonthChange}
      />
    </div>

    <!-- Regularization Form Section - 70% -->
    <div class="md:col-span-8 xl:col-span-9 bg-white rounded shadow">
      <RegularizationForm
        bind:selectedDates
        on:submit={handleFormSubmit}
        on:cancel={handleFormCancel}
      />
    </div>
  </div>
</div>

<style>
  .tab-btn {
    transition: all 0.3s;
  }

  .tab-btn:not(.active) {
    color: #4b5563;
  }

  .tab-btn:not(.active):hover {
    background-color: #f3f4f6;
  }
</style>
