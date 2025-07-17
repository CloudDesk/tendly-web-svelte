<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { attendanceApi } from "$lib/services/api";
  import { auth } from "$lib/stores/auth";
  import { toast } from "../common/stores/toast.store";
  import { X, Calendar } from "lucide-svelte";

  interface User {
    _id?: string;
    name?: string;
    biometricId?: string;
    avatar?: string;
    managerId?: string;
    managerName?: string;
  }

  interface ShiftId {
    _id: string;
    code: string;
    startTime: string;
    endTime: string;
    shiftWindowStart: string;
    shiftWindowEnd: string;
  }

  interface ShiftAssignment {
    userId: string;
    shiftId: string | ShiftId; // Can be either string or ShiftId object
    shiftCode: string;
    startDate: string;
    endDate: string | null;
    weekendDays: number[];
  }

  interface Swipe {
    timestamp: string;
    direction: "IN" | "OUT";
  }

  interface AttendanceRecord {
    _id?: string;
    userId: string;
    shiftDay: string;
    shiftCode?: string;
    swipes: Swipe[];
    attendanceStatus: string[];
  }

  interface ApiResponse {
    success: boolean;
    data: {
      attendanceRecords: AttendanceRecord[];
      shiftAssignments: ShiftAssignment[];
    };
  }

  interface RecordData {
    date: Date;
    dayStr: string;
    fromTime: string;
    toTime: string;
    windowFromTime: string;
    windowToTime: string;
    actualFromTime: string | null;
    actualToTime: string | null;
    reason: string;
    shiftCode: string;
    hasSwipes: boolean;
    attendanceId?: string | null;
    approver: {
      id: string;
      name: string;
    };
  }

  const dispatch = createEventDispatcher();

  // User info
  const user = ($auth.user as User) || {};
  console.log(user, "AuthUser");
  const userId: string = user._id ?? "";
  const userName = user.name || "User Name";
  const userCode = user.biometricId || "#EMP001";
  const userAvatar = user.avatar;
  const managerId = user.managerId || userId; // Default to self if no manager
  const managerName = user.managerName || userName; // Default to self if no manager

  // Props
  export let selectedDates: Date[] = [];

  console.log(selectedDates, "SelectedDates");
  // Component state
  let isLoading = false;
  let isSubmitting = false;
  let remarks = "";
  let recordsData: Record<string, RecordData> = {};

  // Add validation state
  interface ValidationErrors {
    fromTime: string;
    toTime: string;
    reason: string;
  }

  let validationErrors: Record<string, ValidationErrors> = {};

  // Format date for display
  function formatHeaderDate(date: Date): string {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  }

  // Format date as numeric for display
  function formatNumericDate(date: Date): string {
    return date.getDate().toString().padStart(2, "0");
  }

  // Format month for display
  function formatMonth(date: Date): string {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months[date.getMonth()];
  }

  // Format date as YYYY-MM-DD for API calls
  function formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Format time from timestamp if available
  function formatTimeFromTimestamp(timestamp: string | null): string {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      return "";
    }
  }

  // Fetch attendance and shift data for selected dates
  async function fetchRecordsData() {
    if (selectedDates.length === 0) return;

    // Store current form values before loading new data
    const existingFormData = { ...recordsData };
    isLoading = true;

    try {
      // Prepare dates in the format expected by the API
      const formattedDates = selectedDates.map((date) =>
        formatDateForApi(date)
      );

      // Call the API to get both attendance and shift data
      const response = (await attendanceApi.getAttendanceAndShiftRecords({
        userId,
        dates: formattedDates,
      })) as unknown as ApiResponse;
      console.log(response, "response for GetAtteance");
      if (response.success && response.data) {
        // Process the response data
        const { attendanceRecords, shiftAssignments } = response.data;

        // Build records data with combined information, preserving existing values
        // Create a copy of the current records data to preserve user entries
        const newRecordsData: Record<string, RecordData> = { ...recordsData };

        selectedDates.forEach((date) => {
          const dateStr = formatDateForApi(date);
          const dayStr = formatHeaderDate(date);

          // Find matching attendance record
          const attendanceRecord = attendanceRecords.find(
            (rec) =>
              new Date(rec.shiftDay).toISOString().split("T")[0] === dateStr
          );

          // Find matching shift assignment for this date
          const shiftAssignment = shiftAssignments.find((shift) => {
            const shiftStart = new Date(shift.startDate);
            const shiftEnd = shift.endDate
              ? new Date(shift.endDate)
              : new Date(3000, 0, 1); // Far future date if no end
            const currentDate = new Date(dateStr);
            return currentDate >= shiftStart && currentDate <= shiftEnd;
          });

          // Get first and last swipe if available
          let firstSwipe = null;
          let lastSwipe = null;
          let hasSwipes = false;

          if (
            attendanceRecord &&
            attendanceRecord.swipes &&
            attendanceRecord.swipes.length > 0
          ) {
            hasSwipes = true;
            const inSwipes = attendanceRecord.swipes
              .filter((swipe) => swipe.direction === "IN")
              .sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              );

            const outSwipes = attendanceRecord.swipes
              .filter((swipe) => swipe.direction === "OUT")
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              );

            if (inSwipes.length > 0) firstSwipe = inSwipes[0].timestamp;
            if (outSwipes.length > 0) lastSwipe = outSwipes[0].timestamp;
          }

          // Get shift times from assignment
          const shiftStartTime =
            typeof shiftAssignment?.shiftId === "object"
              ? shiftAssignment.shiftId.startTime
              : "09:00";
          const shiftEndTime =
            typeof shiftAssignment?.shiftId === "object"
              ? shiftAssignment.shiftId.endTime
              : "18:00";
          const shiftCode =
            typeof shiftAssignment?.shiftId === "object"
              ? shiftAssignment.shiftId.code
              : shiftAssignment?.shiftCode || "GEN";
          const windowshiftStartTime =
            typeof shiftAssignment?.shiftId === "object"
              ? shiftAssignment.shiftId.shiftWindowStart
              : "08:30";
          const windowshiftEndTime =
            typeof shiftAssignment?.shiftId === "object"
              ? shiftAssignment.shiftId.shiftWindowEnd
              : "18:30";

          // Only initialize if we don't already have data for this date
          // or preserve user entered values while updating other fields
          if (!newRecordsData[dateStr]) {
            newRecordsData[dateStr] = {
              date,
              dayStr,
              fromTime: shiftStartTime,
              toTime: shiftEndTime,
              windowFromTime: windowshiftStartTime,
              windowToTime: windowshiftEndTime,
              actualFromTime: firstSwipe
                ? formatTimeFromTimestamp(firstSwipe)
                : null,
              actualToTime: lastSwipe
                ? formatTimeFromTimestamp(lastSwipe)
                : null,
              reason: "",
              shiftCode: shiftCode,
              hasSwipes,
              attendanceId: attendanceRecord?._id || null,
              approver: {
                id: managerId,
                name: managerName,
              },
            };
          } else {
            // Update only the reference fields while preserving user entries
            newRecordsData[dateStr] = {
              ...newRecordsData[dateStr],
              date,
              dayStr,
              windowFromTime: windowshiftStartTime,
              windowToTime: windowshiftEndTime,
              actualFromTime: firstSwipe
                ? formatTimeFromTimestamp(firstSwipe)
                : newRecordsData[dateStr].actualFromTime,
              actualToTime: lastSwipe
                ? formatTimeFromTimestamp(lastSwipe)
                : newRecordsData[dateStr].actualToTime,
              shiftCode: shiftCode,
              hasSwipes,
              attendanceId: attendanceRecord?._id || null,
              approver: {
                id: managerId,
                name: managerName,
              },
            };
          }
        });

        console.log(newRecordsData, "newRecordData");
        recordsData = newRecordsData;
      } else {
        toast.error("Failed to fetch attendance and shift data");
      }
    } catch (error:any) {
      console.error("Error fetching records data:", error);
      toast.error(error.message || "An error occurred while fetching attendance data");
    } finally {
      isLoading = false;
    }
  }

  // Validate a single time field
  function validateTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Validate from and to times
  function validateTimeRange(fromTime: string, toTime: string): boolean {
    if (!validateTime(fromTime) || !validateTime(toTime)) return false;

    const [fromHour, fromMinute] = fromTime.split(":").map(Number);
    const [toHour, toMinute] = toTime.split(":").map(Number);

    const fromMinutes = fromHour * 60 + fromMinute;
    const toMinutes = toHour * 60 + toMinute;

    return toMinutes > fromMinutes;
  }

  // Update record field with validation
  function updateRecordField(
    dateStr: string,
    field: keyof ValidationErrors,
    value: string
  ) {
    if (recordsData[dateStr]) {
      recordsData[dateStr] = {
        ...recordsData[dateStr],
        [field]: value,
      };

      // Initialize validation errors for this date if not exists
      if (!validationErrors[dateStr]) {
        validationErrors[dateStr] = { fromTime: "", toTime: "", reason: "" };
      }

      // Clear the specific field error when user starts typing
      validationErrors[dateStr][field] = "";

      // Validate time fields immediately
      if (field === "fromTime" || field === "toTime") {
        const record = recordsData[dateStr];
        if (!validateTime(value)) {
          validationErrors[dateStr][field] =
            "Please enter a valid time (HH:MM)";
        } else if (
          field === "toTime" &&
          !validateTimeRange(record.fromTime, record.toTime)
        ) {
          validationErrors[dateStr].toTime =
            "End time must be after start time";
        }
      }

      // Force update of validation errors
      validationErrors = { ...validationErrors };
    }
  }

  // Submit handler with enhanced validation
  function handleSubmit() {
    if (isSubmitting) return;

    let hasErrors = false;
    validationErrors = {};

    // Only validate records for currently selected dates
    const selectedDatesStr = selectedDates.map((date) =>
      formatDateForApi(date)
    );

    // Validate only the selected records
    Object.entries(recordsData)
      .filter(([dateStr, _]) => selectedDatesStr.includes(dateStr))
      .forEach(([dateStr, record]) => {
        validationErrors[dateStr] = { fromTime: "", toTime: "", reason: "" };

        // Validate times
        if (!validateTime(record.fromTime)) {
          validationErrors[dateStr].fromTime =
            "Please enter a valid time (HH:MM)";
          hasErrors = true;
        }
        if (!validateTime(record.toTime)) {
          validationErrors[dateStr].toTime =
            "Please enter a valid time (HH:MM)";
          hasErrors = true;
        }
        if (!validateTimeRange(record.fromTime, record.toTime)) {
          validationErrors[dateStr].toTime =
            "End time must be after start time";
          hasErrors = true;
        }

        // Validate reason
        if (!record.reason && !remarks) {
          validationErrors[dateStr].reason = "Please provide a reason";
          hasErrors = true;
        }
      });

    // Force update of validation errors
    validationErrors = { ...validationErrors };

    if (hasErrors) {
      toast.error("Please correct the validation errors");
      return;
    }

    isSubmitting = true;

    // Prepare data for submission - only for selected dates
    // const selectedDatesStr = selectedDates.map(date => formatDateForApi(date));

    const regularizationData = Object.entries(recordsData)
      .filter(([dateStr, _]) => selectedDatesStr.includes(dateStr))
      .map(([dateStr, record]) => ({
        userId,
        date: dateStr,
        fromTime: record.fromTime,
        toTime: record.toTime,
        reason: record.reason || remarks,
        shiftType: record.shiftCode,
        attendanceId: record.attendanceId,
        approver: record.approver,
      }));
    remarks = "";
    console.log(regularizationData, "regularizationData");
    dispatch("submit", regularizationData);

    // Reset submit state after a short delay to ensure the parent component has time to process
    setTimeout(() => {
      isSubmitting = false;
    }, 100);
  }

  // Cancel handler
  function handleCancel() {
    // We don't clear recordsData here to preserve form entries
    // The parent component will just reset selectedDates
    dispatch("cancel");
  }

  // Add function to remove a date
  function removeDate(dateStr: string) {
    const date = selectedDates.find((d) => formatDateForApi(d) === dateStr);
    if (date) {
      // Only remove from selectedDates, but keep data in recordsData to preserve form values
      dispatch("removeDate", { date });

      // Note: We intentionally don't delete the record data here
      // This allows us to preserve form values if the user re-selects this date
      console.log(`Removed date ${dateStr} but preserved form data`);
    }
  }

  // Watch for changes to selectedDates and refresh data
  $: if (selectedDates) {
    fetchRecordsData();
  }
</script>

{#if isLoading}
  <div class="flex justify-center items-center p-6">
    <div
      class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"
    ></div>
  </div>
{:else if selectedDates.length === 0}
  <div class="p-6 text-center text-gray-500">
    <div class="flex flex-col items-center justify-center py-10">
      <Calendar class="h-16 w-16 text-blue-300 mb-4" />
      <p class="text-lg font-medium text-gray-600">
        Please select dates from the calendar
      </p>
      <p class="text-sm text-gray-500 mt-2">
        Click on dates to add them for regularization
      </p>
    </div>
  </div>
{:else}
  <div class="p-4">
    <!-- Header with selected count -->
    <div
      class="bg-blue-50 p-3 rounded-lg mb-4 flex justify-between items-center"
    >
      <div>
        <h2 class="font-medium text-blue-800">
          {selectedDates.length}
          {selectedDates.length === 1 ? "date" : "dates"} selected
        </h2>
        <p class="text-sm text-blue-400">
          Fill in regularization details below
        </p>
      </div>
    </div>

    <!-- User Profile -->
    <div class="bg-white rounded-lg shadow p-4 mb-4">
      <div class="flex items-center justify-between">
        <!-- Approver Info -->
        <div class="flex items-center">
          <div
            class="avatar bg-green-100 text-green-800 w-10 h-10 rounded-full flex items-center justify-center"
          >
            <span class="text-xl font-bold">{managerName.charAt(0)}</span>
          </div>
          <div class="text-right ml-2">
            <div class=" text-sm font-medium text-gray-600">{managerName}</div>
            <!-- <div class="text-sm text-gray-500">Approver</div> -->
          </div>
        </div>
      </div>
    </div>

    <!-- Remarks field -->
    <div class="remarks-field mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1"
        >Common Remarks (applies to all dates)</label
      >
      <div class="border rounded p-2">
        <textarea
          bind:value={remarks}
          class="w-full min-h-[80px] resize-none border-none focus:outline-none"
          placeholder="Enter common remarks for all selected dates"
        ></textarea>
      </div>
    </div>

    <!-- Selected Dates Sections -->
    {#each selectedDates as date}
      {#if recordsData[formatDateForApi(date)]}
        {@const dateStr = formatDateForApi(date)}
        <div
          class="date-section mb-4 border rounded shadow-sm transition-all hover:shadow"
        >
          <div
            class="date-header p-3 flex justify-between items-center bg-blue-50"
          >
            <div class="flex items-center">
              <div
                class="date-display flex flex-col items-center justify-center bg-blue-500 text-white h-10 w-10 rounded-full mr-3"
              >
                <div class="date-number font-medium text-lg leading-none">
                  {formatNumericDate(date)}
                </div>
                <div class="month-name text-xs leading-none">
                  {formatMonth(date)}
                </div>
              </div>
              <div>
                <div class="day-name font-medium">
                  {recordsData[dateStr].dayStr}
                </div>
                <div class="text-xs text-gray-600">
                  {recordsData[dateStr].shiftCode}
                  {`(${recordsData[dateStr].windowFromTime} - ${recordsData[dateStr].windowToTime})`}
                </div>
              </div>
            </div>
            <button
              class="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Remove this date"
              on:click={() => removeDate(dateStr)}
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="p-4">
            <!-- Time Inputs -->
            <div class="grid grid-cols-3 gap-4 mb-3">
              <div>
                <div class="text-sm text-gray-500 mb-1">From</div>
                <input
                  type="text"
                  value={recordsData[dateStr].fromTime}
                  on:input={(e) =>
                    updateRecordField(
                      dateStr,
                      "fromTime",
                      e.currentTarget?.value || ""
                    )}
                  class="w-full p-2 border rounded {validationErrors[dateStr]
                    ?.fromTime
                    ? 'border-red-500'
                    : ''}"
                  placeholder="HH:MM"
                />
                {#if validationErrors[dateStr]?.fromTime}
                  <div class="text-xs text-red-500 mt-1">
                    {validationErrors[dateStr].fromTime}
                  </div>
                {/if}
                {#if recordsData[dateStr].actualFromTime}
                  <div class="text-xs text-gray-500 mt-1">
                    {recordsData[dateStr].actualFromTime}
                  </div>
                {/if}
              </div>

              <div>
                <div class="text-sm text-gray-500 mb-1">To</div>
                <input
                  type="text"
                  value={recordsData[dateStr].toTime}
                  on:input={(e) =>
                    updateRecordField(
                      dateStr,
                      "toTime",
                      e.currentTarget?.value || ""
                    )}
                  class="w-full p-2 border rounded {validationErrors[dateStr]
                    ?.toTime
                    ? 'border-red-500'
                    : ''}"
                  placeholder="HH:MM"
                />
                {#if validationErrors[dateStr]?.toTime}
                  <div class="text-xs text-red-500 mt-1">
                    {validationErrors[dateStr].toTime}
                  </div>
                {/if}
                {#if recordsData[dateStr].actualToTime}
                  <div class="text-xs text-gray-500 mt-1">
                    {recordsData[dateStr].actualToTime}
                  </div>
                {/if}
              </div>

              <div>
                <div class="text-sm text-gray-500 mb-1">Reason</div>
                <input
                  type="text"
                  value={recordsData[dateStr].reason}
                  on:input={(e) =>
                    updateRecordField(
                      dateStr,
                      "reason",
                      e.currentTarget?.value || ""
                    )}
                  class="w-full p-2 border rounded {validationErrors[dateStr]
                    ?.reason
                    ? 'border-red-500'
                    : ''}"
                  placeholder="Please enter a reason."
                />
                {#if validationErrors[dateStr]?.reason}
                  <div class="text-xs text-red-500 mt-1">
                    {validationErrors[dateStr].reason}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}
    {/each}

    <!-- Action Buttons -->
    <div class="flex justify-end mt-4">
      <button
        on:click={handleCancel}
        class="px-6 py-2 mr-2 border rounded text-gray-600 hover:bg-gray-50"
        disabled={isSubmitting}
      >
        Cancel
      </button>
      <button
        on:click={handleSubmit}
        disabled={isSubmitting}
        class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
      >
        {#if isSubmitting}
          <div
            class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"
          ></div>
        {/if}
        <span>Submit</span>
      </button>
    </div>
  </div>
{/if}
