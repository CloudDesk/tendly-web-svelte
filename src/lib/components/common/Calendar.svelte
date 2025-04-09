<script>
  import { ChevronLeft, ChevronRight, Clock } from "lucide-svelte";
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

<div class="calendar-container bg-white rounded-lg overflow-hidden">
  <div
    class="calendar-header flex justify-between items-center p-4 border-b border-gray-100"
  >
    <button
      class="prev-month p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200"
      on:click={prevMonth}
    >
      <ChevronLeft size={18} />
    </button>

    <h2 class="month-year text-base font-semibold text-gray-800">
      {monthName}
    </h2>

    <button
      class="next-month p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200"
      on:click={nextMonth}
    >
      <ChevronRight size={18} />
    </button>
  </div>

  <div
    class="weekdays grid grid-cols-7 gap-1 px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 bg-gray-50"
  >
    <div>Mon</div>
    <div>Tue</div>
    <div>Wed</div>
    <div>Thu</div>
    <div>Fri</div>
    <div>Sat</div>
    <div>Sun</div>
  </div>

  <div class="calendar-grid grid grid-cols-7 gap-1 p-4">
    {#each calendarDays as day}
      <div
        class="calendar-day relative flex flex-col justify-start items-center text-center rounded-md h-12 transition-all duration-200
            {!day.isCurrentMonth ? 'text-gray-300 bg-gray-50' : ''}
            {day.isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:bg-blue-50'}
            {day.isToday && day.isCurrentMonth
          ? 'ring-2 ring-blue-400 ring-opacity-50'
          : ''}
            {isInRange(day.date) ? 'bg-blue-100 hover:bg-blue-200' : ''}
            {isInHoverRange(day.date) ? 'bg-blue-50' : ''}
            {isInSelectedWeekRange(day.date)
          ? 'bg-blue-50 hover:bg-blue-100'
          : ''}
            {formatDateKey(day.date) === formatDateKey(selectedWeekStart)
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : ''}
            {formatDateKey(day.date) === formatDateKey(selectedWeekEnd)
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : ''}"
        on:click={() => handleDateClick(day)}
        on:mouseover={() => handleMouseOver(day)}
      >
        <span class="day-number font-medium text-sm pt-1">
          {day.isCurrentMonth ? day.day : ""}
        </span>

        {#if day.isCurrentMonth && day.meta.hours}
          <div class="metadata flex items-center justify-center mt-1 text-xs">
            <span
              class="flex items-center hours text-blue-600 bg-blue-50 px-1 rounded"
            >
              <Clock size={10} class="mr-1" />
              {day.meta.hours}h
            </span>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- {#if selectedWeekStart && selectedWeekEnd}
    <div
      class="calendar-footer flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50"
    >
      <button
        class="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
        on:click={prevWeek}
      >
        Previous Week
      </button>

      <button
        class="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
        on:click={nextWeek}
      >
        Next Week
      </button>
    </div>
  {/if} -->
</div>

<style>
  .calendar-container {
    width: 100%;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .calendar-day {
    aspect-ratio: 1;
    padding: 2px;
  }

  /* Transition styles */
  .calendar-day {
    transition: all 0.2s ease-in-out;
  }

  /* Day hover effect */
  .calendar-day:not(.opacity-50):hover {
    transform: translateY(-1px);
  }
</style>
