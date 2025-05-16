<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import "../../styles/form.css";
  import { leaveTypeOptions as allLeaveTypeOptions } from "$lib/constants/leaveTypes";
  import { auth } from "$lib/stores/auth";
  import { get } from "svelte/store";
  import { t } from "svelte-i18n";
  interface LeaveCategory {
    alloted: number;
    availed: number;
    remaining: number;
    leaveRequests: string[];
  }

  interface LeaveFormData {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    leaveTypeId: string;
  }

  interface LeaveSummary {
    annual: LeaveCategory;
    sick: LeaveCategory;
    compOff: LeaveCategory;
    lossOfPay: LeaveCategory;
    otherPaid: LeaveCategory;
    otherUnpaid: LeaveCategory;
    [key: string]: LeaveCategory;
  }

  export let loading = false;
  export let initialValues: LeaveFormData;
  export let summary: LeaveSummary;
  const authState = get(auth);
  console.log(summary, "summary");
  console.log(authState, "authState");
  console.log(initialValues, "initialValues");

  const dispatch = createEventDispatcher<{
    submit: LeaveFormData;
    cancel: void;
  }>();

  let formData = initialValues;

  const getRemainingDays = (leaveType: string): number => {
    console.log(leaveType, "leaveType");

    if (leaveType.toLowerCase() === "lossofpay") {
      return Number.MAX_SAFE_INTEGER;
    }

    const typeMapping: { [key: string]: keyof typeof summary } = {
      annual: "annual",
      sick: "sick",
      compoff: "compOff",
      otherpaid: "otherPaid",
      otherunpaid: "otherUnpaid",
    };

    const summaryKey = typeMapping[leaveType.toLowerCase()];
    return summaryKey && typeof summary[summaryKey] === "object"
      ? summary[summaryKey].remaining
      : 0;
  };

  const handleSubmit = () => {
    if (!isLeaveBalanceValid) {
      return;
    }
    console.log("Submitting form with data:", formData);
    let newObj = {
      ...formData,
      noOfDays: numberOfDays,
      appliedTo: {
        _id: authState.user?.managerId || "676a65b0b06ccef51b302d3d",
        name: authState.user?.managerName || "John Doe",
      },
    };
    dispatch("submit", newObj);
  };

  const handleCancel = () => {
    dispatch("cancel");
  };

  const handleChange = () => {
    console.log("Form changed:", formData);
  };

  $: isEndDateValid =
    !formData.startDate ||
    !formData.endDate ||
    new Date(formData.endDate) >= new Date(formData.startDate);

  $: numberOfDays =
    formData.startDate && formData.endDate
      ? Math.ceil(
          (new Date(formData.endDate).getTime() -
            new Date(formData.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  $: remainingDays = formData.leaveType
    ? getRemainingDays(formData.leaveType)
    : 0;

  $: isLeaveBalanceValid =
    formData.leaveType?.toLowerCase() === "lossofpay" ||
    numberOfDays <= remainingDays;

  $: leaveBalanceMessage = formData.leaveType
    ? formData.leaveType.toLowerCase() === "lossofpay"
      ? ""
      : $t("leaves.form.messages.available_balance", { days: remainingDays }) +
        (!isLeaveBalanceValid
          ? $t("leaves.form.messages.insufficient_balance")
          : "")
    : "";

  $: leaveTypeOptions =
    summary && Object.values(summary).some((leave) => leave.alloted > 0)
      ? allLeaveTypeOptions
      : [{ value: "lossOfPay", label: $t("leaves.form.fields.loss_of_pay") }];

  $: isLeaveAllocated =
    summary && Object.values(summary).some((leave) => leave.alloted > 0);
</script>

{#if !isLeaveAllocated}
  <div class="alert alert-error">
    <span>
      {$t("leaves.form.alerts.no_leave_allocated")}
    </span>
  </div>
{/if}

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="form-control">
      <label class="label" for="leaveType">
        <span class="label-text">{$t("leaves.form.fields.leave_type")}</span>
        <span class="text-error">*</span>
      </label>
      <select
        id="leaveType"
        class="select select-bordered w-full"
        bind:value={formData.leaveType}
        on:change={handleChange}
        required
      >
        <option value="">{$t("leaves.form.fields.select_leave_type")}</option>
        {#each leaveTypeOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      {#if formData.leaveType && leaveBalanceMessage}
        <div class="label">
          <span
            class="label-text-alt {!isLeaveBalanceValid
              ? 'text-error'
              : 'text-success'}"
          >
            {leaveBalanceMessage}
          </span>
        </div>
      {/if}
    </div>

    <div class="form-control">
      <label class="label" for="startDate">
        <span class="label-text">{$t("leaves.form.fields.start_date")}</span>
        <span class="text-error">*</span>
      </label>
      <input
        id="startDate"
        type="date"
        class="input input-bordered"
        bind:value={formData.startDate}
        on:change={handleChange}
        required
      />
    </div>

    <div class="form-control">
      <label class="label" for="endDate">
        <span class="label-text">{$t("leaves.form.fields.end_date")}</span>
        <span class="text-error">*</span>
      </label>
      <input
        id="endDate"
        type="date"
        class="input input-bordered"
        bind:value={formData.endDate}
        on:change={handleChange}
        required
      />
      {#if !isEndDateValid}
        <div class="label">
          <span class="label-text-alt text-error">
            {$t("leaves.form.messages.end_date_validation")}
          </span>
        </div>
      {/if}
    </div>

    <div class="form-control">
      <label class="label" for="reason">
        <span class="label-text">{$t("leaves.form.fields.reason")}</span>
        <span class="text-error">*</span>
      </label>
      <textarea
        id="reason"
        class="textarea textarea-bordered h-24"
        bind:value={formData.reason}
        on:input={handleChange}
        required
      ></textarea>
    </div>

    {#if formData.startDate && formData.endDate && isEndDateValid}
      <div class="form-control col-span-full">
        <label class="label" for="numberOfDays">
          <span class="label-text"
            >{$t("leaves.form.fields.number_of_days")}</span
          >
        </label>
        <div id="numberOfDays" class="text-sm font-medium">
          {numberOfDays}
          {$t(
            `leaves.form.messages.days_suffix.${numberOfDays !== 1 ? "plural" : "singular"}`
          )}
        </div>
      </div>
    {/if}
  </div>

  <div class="flex justify-end gap-2">
    <button
      type="button"
      class="btn btn-ghost"
      on:click={handleCancel}
      disabled={loading}
    >
      {$t("leaves.form.buttons.cancel")}
    </button>
    <button
      type="submit"
      class="btn btn-primary"
      disabled={loading || !isEndDateValid || !isLeaveBalanceValid}
    >
      {loading
        ? $t("leaves.form.buttons.applying")
        : $t("leaves.form.buttons.apply")}
    </button>
  </div>
</form>

<style>
  :global(.form-control) {
    display: flex;
    flex-direction: column;
  }

  :global(.label) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
  }

  :global(.text-error) {
    color: #dc2626;
  }
</style>
