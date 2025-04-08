<script>
  import { ChevronLeft, ChevronRight } from "lucide-svelte";
  import { createEventDispatcher, onMount } from "svelte";

  export let maxRange = 7;
  export let metaData = {};
  export let initialMonth = new Date();
  export let disablePast = false;
  export let disableFuture = false;
  export let disableWeekends = false;
  export let selectedWeekStart = null;
  export let selectedWeekEnd = null;

  let currentMonth = new Date(initialMonth);
  let startDate = null;
  let endDate = null;
  let hoverDate = null;
  let calendarDays = [];

  const dispatch = createEventDispatcher();

  $: {
    currentMonth;
    selectedWeekStart;
    selectedWeekEnd;
    updateCalendarDays();
  }

  onMount(() => {
    updateCalendarDays();
  });

  function formatDateKey(date) {
    if (!date) return "";
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }

  function isInRange(date) {
    if (!startDate || !date) return false;
    if (!endDate) return formatDateKey(date) === formatDateKey(startDate);
    const dateTime = date.getTime();
    const start = startDate.getTime();
    const end = endDate.getTime();
    return dateTime >= start && dateTime <= end;
  }

  function isInSelectedWeekRange(date) {
    if (!selectedWeekStart || !selectedWeekEnd || !date) return false;
    const dateTime = date.getTime();
    const start = selectedWeekStart.getTime();
    const end = selectedWeekEnd.getTime();
    return dateTime >= start && dateTime <= end;
  }

  function isInHoverRange(date) {
    if (!startDate || !hoverDate || endDate || !date) return false;
    const dateTime = date.getTime();
    const start = startDate.getTime();
    const hover = hoverDate.getTime();
    return (
      (dateTime >= start && dateTime <= hover) ||
      (dateTime <= start && dateTime >= hover)
    );
  }

  function handleDateClick(day) {
    if (day.isDisabled) return;

    const clickedDate = new Date(
      Date.UTC(
        day.date.getUTCFullYear(),
        day.date.getUTCMonth(),
        day.date.getUTCDate()
      )
    );

    if (!startDate || endDate) {
      startDate = clickedDate;
      endDate = null;
    } else {
      const diffTime = Math.abs(clickedDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= maxRange) {
        if (clickedDate < startDate) {
          endDate = startDate;
          startDate = clickedDate;
        } else {
          endDate = clickedDate;
        }
        dispatch("rangeSelect", { startDate, endDate });
      } else {
        alert(`Selection exceeds maximum range of ${maxRange} days`);
      }
    }
  }

  function handleMouseOver(day) {
    if (startDate && !endDate && !day.isDisabled) {
      hoverDate = day.date;
    }
  }

  function updateCalendarDays() {
    calendarDays = [];
    const year = currentMonth.getUTCFullYear();
    const month = currentMonth.getUTCMonth();
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
    let firstDayWeekday = firstDayOfMonth.getUTCDay();
    if (firstDayWeekday === 0) firstDayWeekday = 7;

    const prevMonth = new Date(Date.UTC(year, month, 0));
    const daysInPrevMonth = prevMonth.getUTCDate();
    for (let i = firstDayWeekday - 1; i > 0; i--) {
      const date = new Date(Date.UTC(year, month - 1, daysInPrevMonth - i + 1));
      calendarDays.push({
        date,
        dateKey: formatDateKey(date),
        isCurrentMonth: false,
        isDisabled: true,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= lastDayOfMonth.getUTCDate(); i++) {
      const date = new Date(Date.UTC(year, month, i));
      const dateKey = formatDateKey(date);
      const meta = metaData[dateKey] || { hours: 0, status: "" };
      const isWeekend = [0, 6].includes(date.getUTCDay());
      const isPast = date < today;
      const isFuture = date > today;
      const isDisabled =
        (disablePast && isPast) ||
        (disableFuture && isFuture) ||
        (disableWeekends && isWeekend);

      calendarDays.push({
        date,
        dateKey,
        day: i,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isDisabled,
        meta,
      });
    }

    const totalDaysNeeded = 42;
    const remainingDays = totalDaysNeeded - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(Date.UTC(year, month + 1, i));
      calendarDays.push({
        date,
        dateKey: formatDateKey(date),
        day: i,
        isCurrentMonth: false,
        isDisabled: true,
      });
    }
  }

  function prevMonth() {
    currentMonth = new Date(
      Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 1, 1)
    );
    dispatch("monthChange", {
      year: currentMonth.getUTCFullYear(),
      month: currentMonth.getUTCMonth() + 1,
    });
  }

  function nextMonth() {
    currentMonth = new Date(
      Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1)
    );
    dispatch("monthChange", {
      year: currentMonth.getUTCFullYear(),
      month: currentMonth.getUTCMonth() + 1,
    });
  }

  function prevWeek() {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    const newEnd = new Date(newStart);
    newEnd.setDate(
      newEnd.getDate() +
        (selectedWeekEnd.getDate() - selectedWeekStart.getDate())
    );
    dispatch("rangeSelect", { startDate: newStart, endDate: newEnd });
  }

  function nextWeek() {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    const newEnd = new Date(newStart);
    newEnd.setDate(
      newEnd.getDate() +
        (selectedWeekEnd.getDate() - selectedWeekStart.getDate())
    );
    dispatch("rangeSelect", { startDate: newStart, endDate: newEnd });
  }

  $: monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);
</script>

<div
  class="calendar-container w-full max-w-md bg-white rounded-lg shadow-md p-4"
>
  <div class="calendar-header flex justify-between items-center mb-4">
    <div class="flex space-x-2">
      <button
        class="prev-month p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        on:click={prevMonth}
      >
        <ChevronLeft />
      </button>
    </div>
    <h2 class="month-year text-lg font-semibold text-gray-800">{monthName}</h2>
    <div class="flex space-x-2">
      <button
        class="next-month p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        on:click={nextMonth}
      >
        <ChevronRight />
      </button>
    </div>
  </div>

  <div
    class="weekdays grid grid-cols-7 gap-1 mb-2 text-center text-gray-500 text-sm"
  >
    <div class="font-medium">Mo</div>
    <div class="font-medium">Tu</div>
    <div class="font-medium">We</div>
    <div class="font-medium">Th</div>
    <div class="font-medium">Fr</div>
    <div class="font-medium">Sa</div>
    <div class="font-medium">Su</div>
  </div>

  <div class="calendar-grid grid grid-cols-7 gap-1">
    {#each calendarDays as day}
      <div
        class="calendar-day p-1 relative flex flex-col justify-start items-center text-center rounded-md min-h-12 transition-colors duration-200
            {!day.isCurrentMonth ? 'text-gray-300 bg-gray-50' : ''}
            {day.isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:bg-blue-50'}
            {day.isToday && day.isCurrentMonth ? 'border border-blue-400' : ''}
            {isInRange(day.date) ? 'bg-blue-100 hover:bg-blue-200' : ''}
            {isInHoverRange(day.date) ? 'bg-blue-50' : ''}
            {isInSelectedWeekRange(day.date)
          ? 'bg-green-100 hover:bg-green-200'
          : ''}
            {formatDateKey(day.date) === formatDateKey(selectedWeekStart)
          ? 'bg-green-500 text-white hover:bg-green-600'
          : ''}
            {formatDateKey(day.date) === formatDateKey(selectedWeekEnd)
          ? 'bg-green-500 text-white hover:bg-green-600'
          : ''}"
        on:click={() => handleDateClick(day)}
        on:mouseover={() => handleMouseOver(day)}
      >
        <span class="day-number text-sm"
          >{day.isCurrentMonth ? day.day : ""}</span
        >
        {#if day.isCurrentMonth && day.meta.hours}
          <div class="metadata text-xs mt-1">
            <span class="hours text-gray-600">⏱ {day.meta.hours}h</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
