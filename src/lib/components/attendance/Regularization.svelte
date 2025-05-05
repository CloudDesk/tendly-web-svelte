<script lang="ts">
  import AttendanceCalendar from "./AttendanceCalendar.svelte";
  import Modal from "../common/Modal.svelte";
  import RegularizationForm from "../attendance-Regularization/RegularizationForm.svelte";
  import Loader from "../common/Loader.svelte";
  import { attendanceApi } from "$lib/services/api";
  import { auth } from "$lib/stores/auth";
  import { toast } from "../common/stores/toast.store";
  import { writable } from "svelte/store";
  import type { AttendanceRecord } from "$lib/types";
  import { onMount } from "svelte";
  import { getMonthStartEnd } from "$lib/utils/date";

  const userId: string = $auth.user?._id ?? "";
  const attendanceRecords = writable<AttendanceRecord[]>([]);
  const isLoading = writable(false);
  let selectedDate: Date | null = null;
  let isShowModal = false;
  let isRegularizationLoading = false;

  // Fetch attendance records for the selected month
  async function fetchAttendanceRecords(year?: number, month?: number) {
    const { start, end } = getMonthStartEnd(year, month);
    isLoading.set(true);
    try {
      const response: any = await attendanceApi.search({
        userIds: [userId],
        startDate: start,
        endDate: end,
      });
      if (response.data.length > 0) {
        const userRecords: AttendanceRecord[] = response.data[0].records.map(
          (record: any) => ({
            ...record,
            shiftDay: new Date(record.shiftDay).toISOString(),
          })
        );
        attendanceRecords.set(userRecords);
      } else {
        attendanceRecords.set([]);
      }
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      attendanceRecords.set([]);
    } finally {
      isLoading.set(false);
    }
  }

  // Handle date selection
  function handleDateSelect(event: CustomEvent<{ date: Date }>) {
    selectedDate = event.detail.date;
    isShowModal = true;
  }

  // Handle month change
  function handleMonthChange(
    event: CustomEvent<{ year: number; month: number }>
  ) {
    const { year, month } = event.detail;
    fetchAttendanceRecords(year, month);
  }

  // Handle regularization submission
  async function handleApplyRegularization(record: any) {
    isRegularizationLoading = true;
    try {
      const result = await attendanceApi.regularize(record);
      if (result.success) {
        toast.success("Regularization applied successfully");
        isShowModal = false;
        fetchAttendanceRecords(); // Refresh records
      } else {
        toast.error("Failed to apply regularization");
      }
    } catch (error) {
      console.error("Failed to apply regularization:", error);
      toast.error("Failed to apply regularization");
    } finally {
      isRegularizationLoading = false;
    }
  }

  onMount(() => {
    fetchAttendanceRecords();
  });
</script>

<div class="p-6">
  <h1 class="text-2xl font-semibold mb-4">Apply Regularization</h1>
  <div class="bg-white shadow-lg rounded-lg">
    <AttendanceCalendar
      bind:selectedDate
      weekendDays={[0, 6]}
      bind:attendanceRecords={$attendanceRecords}
      bind:isLoading={$isLoading}
      showStatus={false}
      on:dateSelect={handleDateSelect}
      on:monthChange={handleMonthChange}
    />
  </div>

  {#if isShowModal && selectedDate}
    <Modal
      show={isShowModal}
      title="Apply Regularization"
      onClose={() => (isShowModal = false)}
    >
      {#if isRegularizationLoading}
        <div class="flex justify-center items-center h-64">
          <Loader />
        </div>
      {:else}
        <RegularizationForm
          attendance={{ shiftDay: selectedDate.toISOString() }}
          on:cancel={() => (isShowModal = false)}
          on:submit={(event) => handleApplyRegularization(event.detail)}
        />
      {/if}
    </Modal>
  {/if}
</div>
