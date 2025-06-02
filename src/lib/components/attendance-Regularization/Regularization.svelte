<script lang="ts">
  import { attendanceRegularizeApi } from "$lib/services/api";
  import type { AttendanceRegularization } from "$lib/services/api/attendance-regularization";
  import { toast } from "../common/stores/toast.store";
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import RegularizationCalendar from "./RegularizationCalendar.svelte";
  import RegularizationForm from "./RegularizationFormBulk.svelte";
  import { formatDate } from "$lib/utils/date";

  const isLoading = writable(false);
  let selectedDates: Date[] = [];
  let expandedDates: Record<string, boolean> = {};
  let isRegularizationLoading = false;
  // let regularizationRecords: Record<string, AttendanceRegularization> = {};
  let regularizationRecords = writable<
    Record<string, AttendanceRegularization>
  >({});

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

  // Format date with day for header
  function formatHeaderDate(date: Date): string {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const day = days[date.getDay()];
    return `${day}`;
  }

  // Fetch attendance records for the selected month
  async function fetchAttendanceRecords(year?: number, month?: number) {
    isLoading.set(true);
    try {
      // Calculate first and last day of the month correctly
      const currentYear = year || new Date().getFullYear();
      const currentMonth = month || new Date().getMonth() + 1; // Adding 1 since getMonth() is 0-based

      // First day of the month
      const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
      // Last day of the month
      const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

      const startDate = formatDate(firstDayOfMonth);
      const endDate = formatDate(lastDayOfMonth);

      console.log("Fetching records from:", startDate, "to:", endDate);

      // Fetch regularization records
      const userId = $auth.user?._id;
      if (userId) {
        const response = await attendanceRegularizeApi.getRegularizationRecords(
          userId,
          {
            allStatus: true,
            startDate,
            endDate,
          }
        );

        console.log("API Response:", response);

        if (response.success && response.data) {
          // Convert array to record object with date as key
          const newRecords = response.data.reduce(
            (acc, record) => {
              // Extract the date part from shiftDay without timezone conversion
              const [dateStr] = record.shiftDay.split("T");
              console.log("Processing record for date:", dateStr, record);
              acc[dateStr] = record;
              return acc;
            },
            {} as Record<string, AttendanceRegularization>
          );

          console.log("Processed records:", newRecords);
          regularizationRecords.set(newRecords);
        }
      }
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      toast.error("Failed to fetch attendance records");
    } finally {
      isLoading.set(false);
    }
  }

  // Handle date selection
  function handleDateSelect(event: CustomEvent<{ selectedDates: Date[] }>) {
    const newSelectedDates = [...event.detail.selectedDates];

    // Store existing shiftData to preserve user inputs
    const previousShiftData = { ...shiftData };
    selectedDates = newSelectedDates;

    console.log(selectedDates, "selectedDates in handleDateSelect");
    console.log(
      event.detail.selectedDates,
      "event.detail.selectedDates in handleDateSelect"
    );
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
        delete expandedDates[dateStr];
      }
    });

    // Force a UI update by reassigning shiftData
    shiftData = { ...shiftData };
  }

  // Handle remove date from form
  function handleRemoveDate(event: CustomEvent<{ date: Date }>) {
    const dateToRemove = event.detail.date;
    selectedDates = selectedDates.filter((d) => d !== dateToRemove);
  }

  // Handle month change
  function handleMonthChange(
    event: CustomEvent<{ year: number; month: number }>
  ) {
    const { year, month } = event.detail;
    fetchAttendanceRecords(year, month);
  }

  // Handle form submission
  async function handleFormSubmit(event: CustomEvent<any>) {
    if (isRegularizationLoading) return; // Prevent multiple submissions

    isRegularizationLoading = true;
    try {
      // The form component has already prepared the data in the correct format
      const regularizationData = event.detail;
      console.log(regularizationData, "handleFormSubmit");

      let result =
        await attendanceRegularizeApi.bulkRegularize(regularizationData);
      console.log(result, "result handleFormSubmit");

      if (result.success) {
        if (Array.isArray(result.data)) {
          const newRecords = { ...$regularizationRecords };
          regularizationRecords.set(newRecords);

          toast.success("Regularization requests submitted successfully");
          // selectedDates = [];
        } else {
          throw new Error("Invalid response format: data is not an array");
        }
      } else {
        toast.error(
          result.error.message || "Failed to submit regularization requests"
        );
      }
    } catch (e) {
      console.error(e, "error handleFormSubmit");
      toast.error(
        "Unable to submit regularization requests. Please try again later."
      );
    } finally {
      console.log(selectedDates, "selectedDates after form submit");

      let date = new Date(selectedDates[0]);
      let year = date.getUTCFullYear();
      let month = date.getUTCMonth() + 1;
      // console.log("Fetching records for year:", year, "month:", month);
      await fetchAttendanceRecords(year, month);
      selectedDates = [];
      handleFormCancel();
      isRegularizationLoading = false;
    }
  }

  // Handle form cancellation
  function handleFormCancel() {
    selectedDates = []; // Clear selected dates
  }

  onMount(async () => {
    console.log("Component mounted, fetching records...");
    const currentDate = new Date();
    await fetchAttendanceRecords(
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
        regularizationRecords={$regularizationRecords}
        isLoading={$isLoading}
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
        on:removeDate={handleRemoveDate}
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
