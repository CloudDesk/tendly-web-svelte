<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { attendanceApi } from "$lib/services/api";
  import { auth } from "$lib/stores/auth";
  import { toast } from "../common/stores/toast.store";
  import { onMount } from "svelte";

  interface User {
    _id?: string;
    name?: string;
    biometricId?: string;
    avatar?: string;
  }

  interface RecordData {
    date: Date;
    dayStr: string;
    fromTime: string;
    toTime: string;
    actualFromTime: string | null;
    actualToTime: string | null;
    reason: string;
    shiftType: string;
    shiftCode: string;
  }

  const dispatch = createEventDispatcher();

  // User info
  const user = ($auth.user as User) || {};
  const userId: string = user._id ?? "";
  const userName = user.name || "User Name";
  const userCode = user.biometricId || "#EMP001";
  const userAvatar = user.avatar;

  // Props
  export let selectedDates: Date[] = [];

  // Component state
  let isLoading = false;
  let remarks = "";
  let recordsData: Record<string, RecordData> = {};

  // Format date for display
  function formatHeaderDate(date: Date): string {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  }

  // Format date as numeric for display
  function formatNumericDate(date: Date): string {
    return date.getDate().toString().padStart(2, "0");
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

    isLoading = true;

    try {
      // Prepare dates in the format expected by the API
      const formattedDates = selectedDates.map((date) =>
        formatDateForApi(date)
      );

      // Call the API to get both attendance and shift data
      const response = await attendanceApi.getAttendanceAndShiftRecords({
        userId,
        dates: formattedDates,
      });

      if (response.success && response.data) {
        // Process the response data
        const { attendanceRecords, shiftAssignments } = response.data;

        // Build records data with combined information
        const newRecordsData: Record<string, RecordData> = {};

        selectedDates.forEach((date) => {
          const dateStr = formatDateForApi(date);
          const dayStr = formatHeaderDate(date);

          // Find matching attendance record
          const attendanceRecord = attendanceRecords.find(
            (rec) =>
              new Date(rec.shiftDay).toISOString().split("T")[0] === dateStr
          );

          // Find matching shift assignment
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

          if (
            attendanceRecord &&
            attendanceRecord.swipes &&
            attendanceRecord.swipes.length > 0
          ) {
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

          newRecordsData[dateStr] = {
            date,
            dayStr,
            fromTime: "09:00", // Default values that can be overridden
            toTime: "18:00",
            actualFromTime: firstSwipe
              ? formatTimeFromTimestamp(firstSwipe)
              : null,
            actualToTime: lastSwipe ? formatTimeFromTimestamp(lastSwipe) : null,
            reason: "",
            shiftType: shiftAssignment?.shiftCode || "General Shift",
            shiftCode: shiftAssignment?.shiftCode || "GS",
          };
        });

        recordsData = newRecordsData;
      } else {
        toast.error("Failed to fetch attendance and shift data");
      }
    } catch (error) {
      console.error("Error fetching records data:", error);
      toast.error("An error occurred while fetching attendance data");
    } finally {
      isLoading = false;
    }
  }

  // Update a field for a specific date
  function updateRecordField(dateStr: string, field: string, value: string) {
    if (recordsData[dateStr]) {
      recordsData[dateStr] = {
        ...recordsData[dateStr],
        [field]: value,
      };
    }
  }

  // Submit handler
  function handleSubmit() {
    // Prepare data for submission
    const regularizationData = Object.entries(recordsData).map(
      ([dateStr, record]) => ({
        userId,
        date: dateStr,
        fromTime: record.fromTime,
        toTime: record.toTime,
        reason: record.reason || remarks,
        shiftType: record.shiftType,
      })
    );

    // Dispatch the data to the parent component
    dispatch("submit", regularizationData);
  }

  // Cancel handler
  function handleCancel() {
    dispatch("cancel");
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
    <p>Please select a date to apply regularization</p>
  </div>
{:else}
  <div class="p-4">
    <!-- User Profile -->
    <div class="user-profile mb-4 flex items-center">
      <div
        class="avatar mr-3 bg-blue-100 text-blue-800 w-10 h-10 rounded-full flex items-center justify-center"
      >
        {#if userAvatar}
          <img
            src={userAvatar}
            alt={userName}
            class="rounded-full w-full h-full object-cover"
          />
        {:else}
          <span class="text-xl font-bold">{userName.charAt(0)}</span>
        {/if}
      </div>
      <div class="user-info">
        <div class="user-name text-sm font-medium">{userName}</div>
        <div class="user-code text-xs text-gray-500">{userCode}</div>
      </div>
      <div class="dropdown-icon ml-auto">
        <button class="text-gray-400">▼</button>
      </div>
    </div>

    <!-- Remarks field -->
    <div class="remarks-field mb-4">
      <div class="border rounded p-2">
        <textarea
          bind:value={remarks}
          class="w-full min-h-[80px] resize-none border-none focus:outline-none"
          placeholder="Remarks"
        ></textarea>
        <div class="flex justify-end">
          <button class="text-green-500 mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <button class="text-green-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        </div>
      </div>
      <div class="mt-2">
        <button class="flex items-center text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add
        </button>
      </div>
    </div>

    <!-- Selected Dates Sections -->
    {#each selectedDates as date}
      {#if recordsData[formatDateForApi(date)]}
        {@const dateStr = formatDateForApi(date)}
        <div class="date-section mb-4 border rounded">
          <div
            class="date-header p-3 flex justify-between items-center bg-gray-50"
          >
            <div class="flex items-center">
              <div class="date-number font-medium pr-2 text-lg">
                {formatNumericDate(date)}
              </div>
              <div class="day-name text-sm">{recordsData[dateStr].dayStr}</div>
            </div>
            <div class="flex items-center">
              <button class="text-gray-400 hover:text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div class="p-4">
            <!-- Shift Type -->
            <div class="mb-3">
              <select
                value={recordsData[dateStr].shiftType}
                on:change={(e) =>
                  updateRecordField(
                    dateStr,
                    "shiftType",
                    e.currentTarget?.value || ""
                  )}
                class="w-full p-2 border rounded text-gray-700 bg-white"
              >
                <option value="General Shift">General Shift</option>
                <option value="Morning Shift">Morning Shift</option>
                <option value="Evening Shift">Evening Shift</option>
              </select>
            </div>

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
                  class="w-full p-2 border rounded"
                  placeholder="HH:MM"
                />
                {#if recordsData[dateStr].actualFromTime}
                  <div class="text-xs text-gray-500 mt-1">
                    {recordsData[dateStr].actualFromTime}
                  </div>
                {/if}
                <div class="text-center text-gray-500 mt-1">?</div>
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
                  class="w-full p-2 border rounded"
                  placeholder="HH:MM"
                />
                {#if recordsData[dateStr].actualToTime}
                  <div class="text-xs text-gray-500 mt-1">
                    {recordsData[dateStr].actualToTime}
                  </div>
                {/if}
                <div class="text-center text-gray-500 mt-1">?</div>
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
                  class="w-full p-2 border rounded"
                  placeholder="Please enter a reason."
                />
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
      >
        Cancel
      </button>
      <button
        on:click={handleSubmit}
        class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Submit
      </button>
    </div>
  </div>
{/if}
