<script lang="ts">
  import { attendanceRegularizeApi } from "$lib/services/api";
  import { toast } from "../common/stores/toast.store";
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
  import RegularizationCalendar from "./RegularizationCalendar.svelte";
  import RegularizationForm from "./RegularizationFormBulk.svelte";
  import { formatDate } from "$lib/utils/date";

  const isLoading = writable(false);
  let selectedDates: Date[] = [];
  let expandedDates: Record<string, boolean> = {};
  let isRegularizationLoading = false;

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
    // Create a new array to ensure reactivity
    selectedDates = [...event.detail.selectedDates];

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
      console.log(regularizationData, "handleFormSubmit");

      let result =
        await attendanceRegularizeApi.bulkRegularize(regularizationData);
      console.log(result, "result handleFormSubmit");

      // Check if the response has data array
      if (result?.data && Array.isArray(result.data)) {
        // Check if all regularizations were successful
        const allSuccessful = result.data.every((item) => item.success);

        if (allSuccessful) {
          // All regularizations were successful
          toast.success("Regularization requests submitted successfully");
          // Clear selected dates
          selectedDates = [];
        } else {
          // Some regularizations failed
          toast.error("Some regularization requests failed. Please try again.");
        }
      } else {
        // Invalid response format
        throw new Error("Invalid response format");
      }
    } catch (e) {
      console.error(e, "error handleFormSubmit");
      toast.error(
        "Unable to submit regularization requests. Please try again later."
      );
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
