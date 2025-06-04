<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import {
    holidayCalendarApi,
    timesheetApi,
    shiftsApi,
    type Timesheet,
  } from "$lib/services/api";
  import CalendarWrapper from "$lib/components/timesheet/CalendarWrapper.svelte";
  import TimesheetEntries from "$lib/components/timesheet/TimesheetEntries.svelte";
  import { toast } from "$lib/components/common/stores/toast.store";
  import { Calendar, ArrowLeft, ArrowRight } from "lucide-svelte";
  import Modal from "$lib/components/common/Modal.svelte";
  import TimesheetExport from "$lib/components/timesheet/TimesheetExport.svelte";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";
  import LoaderNew from "$lib/components/common/LoaderNew.svelte";

  $: userId = $auth.user?._id || "";
  let selectedWeekStart = new Date();
  selectedWeekStart.setDate(
    selectedWeekStart.getDate() - selectedWeekStart.getDay() + 1
  );
  let selectedWeekEnd = new Date(selectedWeekStart);
  selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 6);

  let entries: any[] = [];
  let isLoading = false;
  let isSubmitting = false;
  let error = "";
  let success = false;
  let weekRange = "";
  let isExporting = false;
  let showConfirmModal = false;
  let pendingPayload: any[] = [];

  // Store holidays and weekends
  let holidays: { date: string; name: string; type: string }[] = [];
  let weekendDays: number[] = [];

  let meta: { [key: string]: { hours: number } } = {};
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  onMount(async () => {
    await Promise.all([getHolidays(), getWeekends()]);
    initializeWeek();
    updateWeekRange();
    await fetchTimesheetData();
  });

  function getDaysInRange(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  function initializeWeek() {
    entries = [];
    const startDate = new Date(selectedWeekStart);
    const daysInRange = getDaysInRange(selectedWeekStart, selectedWeekEnd);
    for (let i = 0; i < daysInRange; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
      const dateStr = date.toISOString().split("T")[0];
      const isHoliday = holidays.some((h) => h.date.startsWith(dateStr));
      const isWeekend = weekendDays.includes(date.getDay());

      entries.push({
        day: days[dayIndex],
        date,
        entries: [{ project: "", task: "", description: "", duration: 0 }],
        isHoliday,
        isWeekend,
      });
    }
  }

  function updateWeekRange() {
    const format = (d: Date) =>
      `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
    weekRange = `${format(selectedWeekStart)} - ${format(selectedWeekEnd)}`;
  }

  async function fetchTimesheetData() {
    isLoading = true;
    try {
      const response: any = await timesheetApi.getbyDate(
        userId,
        selectedWeekStart.toISOString().split("T")[0],
        selectedWeekEnd.toISOString().split("T")[0]
      );
      console.log(response, "response fetchTimesheetData");

      if (response.success && response.data) {
        const daysInRange = getDaysInRange(selectedWeekStart, selectedWeekEnd);
        console.log(daysInRange, "daysInRange");
        entries = Array(daysInRange)
          .fill(null)
          .map((_, i) => {
            const date = new Date(selectedWeekStart);
            date.setDate(selectedWeekStart.getDate() + i);
            const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
            const dateStr = date.toISOString().split("T")[0];
            const entry = response.data.find(
              (e: { dateUTC: string }) =>
                new Date(e.dateUTC).toDateString() === date.toDateString()
            );
            const isHoliday = holidays.some((h) => h.date.startsWith(dateStr));
            const isWeekend = weekendDays.includes(date.getDay());

            return {
              day: days[dayIndex],
              date,
              entries: entry?.entries.length
                ? entry.entries
                : [{ project: "", task: "", description: "", duration: 0 }],
              isHoliday,
              isWeekend,
            };
          });
        console.log(entries, "entries after fetchTimesheetData");
        response.data.forEach((entry: Timesheet) => {
          const date = new Date(entry.dateUTC);
          const dateKey = date.toISOString().split("T")[0];
          meta[dateKey] = { hours: entry.totalDuration ?? 0 };
        });
      } else {
        initializeWeek();
      }
    } catch (err) {
      console.error("Error fetching timesheet:", err);
      toast.error("Failed to load timesheet data.");
    } finally {
      isLoading = false;
    }
  }

  async function getHolidays() {
    try {
      const response: any = await holidayCalendarApi.getByUserId(userId);
      console.log(response, "response getHolidays);");
      if (response.success && Object.keys(response.data).length > 0) {
        let holidaysData = response.data?.holidays.map((h: any) => ({
          date: h.date,
          name: h.name,
          type: h.type,
        }));
        console.log(holidaysData, "holidaysData");
        holidays = holidaysData;
        initializeWeek(); // Reinitialize to apply holiday markers
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Failed to load holidays.");
    }
  }

  async function getWeekends() {
    try {
      // Format dates to ISO string format (YYYY-MM-DD) for API consumption
      const startDateStr = selectedWeekStart.toISOString().split("T")[0];
      const endDateStr = selectedWeekEnd.toISOString().split("T")[0];
      console.log(startDateStr, endDateStr, "getWeekends");
      // Make API call to fetch weekend data for the selected date range
      const response: any = await shiftsApi.getAssignmentByUser(
        userId,
        startDateStr,
        endDateStr
      );
      console.log(response, "responsegetWeekends");

      if (response.success && response.data.length > 0) {
        weekendDays = response.data[0].weekendDays;
      } else {
        weekendDays = [];
      }

      initializeWeek();
    } catch (error) {
      console.error("Error fetching weekend days:", error);
      toast.error("Failed to load weekend configuration.");
    }
  }
  console.log(weekendDays, "weekendDays");
  console.log(holidays, "holidays");
  function handleMonthChange(event: CustomEvent) {
    const { year, month } = event.detail;
    const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
    selectedWeekStart = new Date(firstDayOfMonth);
    selectedWeekStart.setDate(
      selectedWeekStart.getDate() - selectedWeekStart.getDay() + 1
    );
    selectedWeekEnd = new Date(selectedWeekStart);
    selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 6);

    initializeWeek();
    updateWeekRange();
    fetchTimesheetData();
    getWeekends();
  }

  function handleRangeSelect(event: CustomEvent) {
    const { startDate, endDate } = event.detail;
    selectedWeekStart = new Date(startDate);
    selectedWeekEnd = new Date(endDate);

    initializeWeek();
    updateWeekRange();
    fetchTimesheetData();
    getWeekends();
  }

  function navigateWeek(direction: "prev" | "next") {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() + (direction === "next" ? 7 : -7));
    selectedWeekStart = newStart;

    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + 6);
    selectedWeekEnd = newEnd;

    updateWeekRange();
    initializeWeek();
    fetchTimesheetData();
    getWeekends();
  }

  function checkHolidayWeekendEntries(payload: any[]) {
    const holidayEntries: string[] = [];
    const weekendEntries: string[] = [];

    payload.forEach((day) => {
      const dateStr = new Date(day.dateUTC).toISOString().split("T")[0];
      const isHoliday = holidays.some((h) => h.date.startsWith(dateStr));
      const isWeekend = weekendDays.includes(new Date(day.dateUTC).getDay());

      if (isHoliday && day.entries.length > 0) {
        holidayEntries.push(
          `${new Date(day.dateUTC).toLocaleDateString()} (${
            holidays.find((h) => h.date.startsWith(dateStr))?.name
          })`
        );
      }
      if (isWeekend && day.entries.length > 0) {
        weekendEntries.push(new Date(day.dateUTC).toLocaleDateString());
      }
    });

    return { holidayEntries, weekendEntries };
  }

  async function handleSubmit(event: CustomEvent) {
    let values = event.detail;
    console.log(values, "values handleSubmit");
    const payload = values
      .map((day: any) => {
        console.log(day, "day in handleSubmit");
        return {
          userId,
          dateUTC: new Date(day.date.toISOString().split("T")[0]),
          entries: day.entries
            .filter(
              (entry: any) => entry.duration > 0 && entry.project.trim() !== ""
            )
            .map(({ _id, ...entryWithoutId }: any) => entryWithoutId),
        };
      })
      .filter((day: any) => day.entries.length > 0);

    const { holidayEntries, weekendEntries } =
      checkHolidayWeekendEntries(payload);

    if (holidayEntries.length > 0 || weekendEntries.length > 0) {
      pendingPayload = payload;
      showConfirmModal = true;
      return;
    }

    await submitTimesheet(payload);
  }

  async function submitTimesheet(payload: any[]) {
    isSubmitting = true;
    success = false;
    error = "";

    try {
      for (const dayPayload of payload) {
        await timesheetApi.submit(dayPayload);
      }
      toast.success("Timesheet submitted successfully!");
      await fetchTimesheetData();
    } catch (err) {
      console.error("Error submitting timesheet:", err);
      toast.error("Error submitting timesheet. Please try again.");
    } finally {
      isSubmitting = false;
      showConfirmModal = false;
      pendingPayload = [];
    }
  }

  // function calculateTotalHours() {
  //   return entries
  //     .reduce((total, day) => {
  //       return (
  //         total +
  //         day.entries.reduce((dayTotal: number, entry: any) => {
  //           return dayTotal + (parseFloat(entry.duration) || 0);
  //         }, 0)
  //       );
  //     }, 0)
  //     .toFixed(1);
  // }

  const handleExport = () => {
    console.log("handleExport");
    isExporting = true;
  };
</script>

<IndexPageTemplate
  title="Timesheet"
  subtitle="Track and submit your working hours"
  showExport={true}
  onExport={handleExport}
>
  <ContentCard>
    <div class="bg-white rounded-xl shadow-sm mb-12 p-4">
      <div
        class="flex flex-col md:flex-row md:justify-between md:items-center gap-4"
      >
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center">
            <button
              on:click={() => navigateWeek("prev")}
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label="Previous week"
            >
              <ArrowLeft size={18} />
            </button>

            <div class="flex items-center mx-2 px-4 py-2 bg-gray-50 rounded-lg">
              <Calendar size={18} class="text-blue-600 mr-2" />
              <span class="font-medium text-gray-800">{weekRange}</span>
            </div>

            <button
              on:click={() => navigateWeek("next")}
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label="Next week"
            >
              <ArrowRight size={18} />
            </button>
          </div>

          <div class="ml-0 md:ml-2">
            <CalendarWrapper
              maxRange={7}
              initialMonth={new Date()}
              metaData={meta}
              {selectedWeekStart}
              {selectedWeekEnd}
              on:rangeSelect={handleRangeSelect}
              on:monthChange={handleMonthChange}
            />
          </div>
        </div>
      </div>
    </div>
    {#if isLoading}
      <LoaderNew />
    {:else}
      <TimesheetEntries
        {holidays}
        {weekendDays}
        {entries}
        on:submit={handleSubmit}
      />
    {/if}
    {#if isExporting}
      <Modal
        title="Export Timesheet"
        show={isExporting}
        onClose={() => (isExporting = false)}
      >
        <TimesheetExport onClose={() => (isExporting = false)} />
      </Modal>
    {/if}

    {#if showConfirmModal}
      <Modal
        title="Confirm Submission"
        show={showConfirmModal}
        onClose={() => (showConfirmModal = false)}
      >
        <div class="p-4">
          <p class="text-gray-700 mb-4">
            Your timesheet includes entries on the following holidays or
            weekends:
          </p>
          {#if checkHolidayWeekendEntries(pendingPayload).holidayEntries.length > 0}
            <div class="mb-4">
              <p class="font-medium text-red-600">Holidays:</p>
              <ul class="list-disc pl-5">
                {#each checkHolidayWeekendEntries(pendingPayload).holidayEntries as holiday}
                  <li>{holiday}</li>
                {/each}
              </ul>
            </div>
          {/if}
          {#if checkHolidayWeekendEntries(pendingPayload).weekendEntries.length > 0}
            <div class="mb-4">
              <p class="font-medium text-gray-600">Weekends:</p>
              <ul class="list-disc pl-5">
                {#each checkHolidayWeekendEntries(pendingPayload).weekendEntries as weekend}
                  <li>{weekend}</li>
                {/each}
              </ul>
            </div>
          {/if}
          <p class="text-gray-700 mb-4">
            Are you sure you want to submit these entries?
          </p>
          <div class="flex justify-end gap-2">
            <button
              class="btn-secondary"
              on:click={() => (showConfirmModal = false)}
            >
              Cancel
            </button>
            <button
              class="btn-primary"
              on:click={() => submitTimesheet(pendingPayload)}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    {/if}
  </ContentCard>
</IndexPageTemplate>
