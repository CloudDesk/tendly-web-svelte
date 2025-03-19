<script lang="ts">
  import { employeesApi, shiftsApi } from "$lib/services/api";
  import { fromUTCDate } from "$lib/utils/date";
  import { onMount } from "svelte";

  export let employeeId: string;

  let employee: any;
  let pastShifts: any = [];
  let isDragging = false;
  let draggedShiftAssignment: any = null;
  let dragSourceColumn: string = "";

  // Status mapping for API updates
  const STATUS_MAP = {
    current: "ACTIVE",
    upcoming: "SCHEDULED",
    past: "COMPLETED",
  };

  //get data from the server
  const getEmployee = async () => {
    let res = await employeesApi.getById(employeeId);
    employee = res.data;
  };

  const getPastShifts = async () => {
    let res = await shiftsApi.getPastShifts(employeeId);
    pastShifts = res.data;
  };

  // Update shift status via API
  const updateShiftAssignmentStatus = async (
    shiftAssignmentId: string,
    newStatus: string
  ) => {
    console.log("updateShiftAssignmentStatus");
    console.log(shiftAssignmentId, "shiftAssignmentId");
    console.log(newStatus, "newStatus");
    /*
    fastify.put('/shift/update-status', async (req, reply) => {
    const { employeeId, shiftAssignmentId, action } = req.body;

    if (!employeeId || !shiftAssignmentId || !action) {
        return reply.status(400).send({ error: 'Missing required parameters' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const shiftAssignment = await ShiftAssignment.findById(shiftAssignmentId).session(session);
        if (!shiftAssignment) {
            await session.abortTransaction();
            return reply.status(404).send({ error: 'Shift assignment not found' });
        }

        const employee = await Employee.findById(employeeId).session(session);
        if (!employee) {
            await session.abortTransaction();
            return reply.status(404).send({ error: 'Employee not found' });
        }

        if (action === 'current_to_past') {
            // Update SA: Set inactive to false, change status to past
            await ShiftAssignment.findByIdAndUpdate(shiftAssignmentId, { 
                status: 'past', inactive: false 
            }, { session });

            // Update EMP: Move upcoming shift to current if exists
            if (employee.upcomingShift) {
                employee.currentShift = employee.upcomingShift;
                employee.upcomingShift = null;
                await employee.save({ session });
            }

        } else if (action === 'upcoming_to_current') {
            // Fetch current shift assignment & update status to past
            if (employee.currentShift) {
                await ShiftAssignment.findByIdAndUpdate(employee.currentShift, {
                    status: 'past', inactive: false
                }, { session });

                employee.currentShift = null;
            }

            // Move upcoming to current and nullify upcoming
            employee.currentShift = employee.upcomingShift;
            employee.upcomingShift = null;

            // Update SA: Set new current shift status
            await ShiftAssignment.findByIdAndUpdate(shiftAssignmentId, { status: 'current' }, { session });

            await employee.save({ session });
        } else {
            await session.abortTransaction();
            return reply.status(400).send({ error: 'Invalid action' });
        }

        await session.commitTransaction();
        return reply.send({ message: 'Shift status updated successfully' });

    } catch (error) {
        await session.abortTransaction();
        return reply.status(500).send({ error: 'Internal server error', details: error.message });
    } finally {
        session.endSession();
    }
});

    */
  };

  // Drag event handlers
  const handleDragStart = (
    event: DragEvent,
    shiftAssignment: any,
    sourceColumn: string
  ) => {
    // Don't allow dragging from past shifts column
    if (sourceColumn === "past") {
      event.preventDefault();
      return;
    }
    console.log("hadleDragStart", shiftAssignment);
    isDragging = true;
    draggedShiftAssignment = shiftAssignment;
    dragSourceColumn = sourceColumn;

    // Set data for drag operation
    if (event.dataTransfer) {
      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          shiftId: shiftAssignment._id || shiftAssignment.shiftAssignmentId,
          sourceColumn,
        })
      );
      event.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (event: DragEvent, targetColumn: string) => {
    // Prevent default to allow drop
    event.preventDefault();

    // Only allow drops in valid target columns based on business rules
    if (dragSourceColumn === "current" && targetColumn === "past") {
      event.dataTransfer!.dropEffect = "move";
    } else if (dragSourceColumn === "upcoming" && targetColumn === "current") {
      event.dataTransfer!.dropEffect = "move";
    } else {
      event.dataTransfer!.dropEffect = "none";
    }
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    if (event.target instanceof HTMLElement) {
      event.target.classList.add("drag-over");
    }
  };

  const handleDragLeave = (event: DragEvent) => {
    if (event.target instanceof HTMLElement) {
      event.target.classList.remove("drag-over");
    }
  };

  const handleDrop = async (event: DragEvent, targetColumn: string) => {
    event.preventDefault();

    if (event.target instanceof HTMLElement) {
      event.target.classList.remove("drag-over");
    }

    // Only process valid status transitions
    if (dragSourceColumn === "current" && targetColumn === "past") {
      const shiftAssignmentId =
        draggedShiftAssignment._id || draggedShiftAssignment.shiftAssignmentId;
      await updateShiftAssignmentStatus(shiftAssignmentId, "past");
    } else if (dragSourceColumn === "upcoming" && targetColumn === "current") {
      const shiftAssignmentId =
        draggedShiftAssignment._id || draggedShiftAssignment.shiftAssignmentId;
      await updateShiftAssignmentStatus(shiftAssignmentId, "current");
    }

    // Reset drag state
    isDragging = false;
    draggedShiftAssignment = null;
    dragSourceColumn = "";
  };

  const handleDragEnd = () => {
    isDragging = false;
    draggedShiftAssignment = null;
    dragSourceColumn = "";
  };

  onMount(() => {
    if (employeeId) {
      getEmployee();
      getPastShifts();
    }
  });
</script>

<div class="space-y-6 p-6 bg-white rounded-lg shadow-lg">
  <div class="grid grid-cols-3 gap-6 p-6 h-[60vh]">
    <!-- Current Shift Column -->
    <div
      class="flex flex-col border-2 border-gray-200 rounded-md bg-white overflow-auto"
      role="region"
      on:dragover={(e) => handleDragOver(e, "current")}
      on:dragenter={handleDragEnter}
      on:dragleave={handleDragLeave}
      on:drop={(e) => handleDrop(e, "current")}
    >
      <div
        class="bg-blue-500 text-white p-4 rounded-t-md font-semibold text-center"
      >
        Current Shift
      </div>
      <div class="p-4 space-y-4 overflow-y-auto">
        {#if employee && employee.currentShiftAssignmentData}
          <div
            class="bg-white p-4 rounded-lg shadow-md border border-gray-300 cursor-move"
            draggable="true"
            role="region"
            on:dragstart={(e) =>
              handleDragStart(
                e,
                employee.currentShiftAssignmentData,
                "current"
              )}
            on:dragend={handleDragEnd}
          >
            <div class="space-y-4">
              <div>
                <span class="text-gray-500 font-medium">Start Date:</span>
                <p class="text-gray-800 text-base">
                  {fromUTCDate(employee.currentShiftAssignmentData.startDate)}
                </p>
              </div>

              <div>
                <span class="text-gray-500 font-medium">End Date:</span>
                <p class="text-gray-800 text-base">
                  {fromUTCDate(employee.currentShiftAssignmentData.endDate)}
                </p>
              </div>

              <div>
                <span class="text-gray-500 font-medium">Shift Code:</span>
                <p class="text-gray-800 text-base">
                  {employee.currentShiftAssignmentData.shiftCode}
                </p>
              </div>

              <div>
                <span class="text-gray-500 font-medium"
                  >Shift Assignment ID:</span
                >
                <p class="text-gray-800 text-base">
                  {employee.currentShiftAssignmentData.shiftAssignmentId}
                </p>
              </div>
            </div>
          </div>
        {:else}
          <div
            class="bg-gray-100 p-4 rounded-lg shadow-md border border-gray-300 text-gray-700"
          >
            <p class="text-lg font-medium">No Current Shift Assigned</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Upcoming shift Column -->
    <div
      class="flex flex-col border-2 border-gray-200 rounded-md bg-white overflow-auto"
      role="region"
      on:dragover={(e) => handleDragOver(e, "upcoming")}
      on:dragenter={handleDragEnter}
      on:dragleave={handleDragLeave}
      on:drop={(e) => handleDrop(e, "upcoming")}
    >
      <div
        class="bg-yellow-500 text-white p-4 rounded-t-md font-semibold text-center"
      >
        Upcoming Shift
      </div>
      <div class="p-4 space-y-4 overflow-y-auto">
        {#if employee && employee.upcomingShiftAssignmentData}
          <div
            class="bg-white p-4 rounded-lg shadow-md border border-gray-300 cursor-move"
            role="region"
            draggable="true"
            on:dragstart={(e) =>
              handleDragStart(
                e,
                employee.upcomingShiftAssignmentData,
                "upcoming"
              )}
            on:dragend={handleDragEnd}
          >
            <div class="space-y-4">
              <div>
                <span class="text-gray-500 font-medium">Start Date:</span>
                <p class="text-gray-800 text-base">
                  {fromUTCDate(employee.upcomingShiftAssignmentData.startDate)}
                </p>
              </div>

              <div>
                <span class="text-gray-500 font-medium">End Date:</span>
                <p class="text-gray-800 text-base">
                  {fromUTCDate(employee.upcomingShiftAssignmentData.endDate)}
                </p>
              </div>

              <div>
                <span class="text-gray-500 font-medium">Shift Code:</span>
                <p class="text-gray-800 text-base">
                  {employee.upcomingShiftAssignmentData.shiftCode}
                </p>
              </div>

              <div>
                <span class="text-gray-500 font-medium"
                  >Shift Assignment ID:</span
                >
                <p class="text-gray-800 text-base">
                  {employee.upcomingShiftAssignmentData.shiftAssignmentId}
                </p>
              </div>
            </div>
          </div>
        {:else}
          <div
            class="bg-gray-100 p-4 rounded-lg shadow-md border border-gray-300 text-gray-700"
          >
            <p class="text-lg font-medium">No Upcoming Shift Assigned</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Past Shifts Column -->
    <div
      class="flex flex-col border-2 border-gray-200 rounded-md bg-white overflow-auto"
      role="region"
      on:dragover={(e) => handleDragOver(e, "past")}
      on:dragenter={handleDragEnter}
      on:dragleave={handleDragLeave}
      on:drop={(e) => handleDrop(e, "past")}
    >
      <div
        class="bg-green-500 text-white p-4 rounded-t-md font-semibold text-center"
      >
        Past Shifts
      </div>
      <div class="p-4 space-y-4 overflow-y-auto">
        {#if pastShifts && pastShifts.length > 0}
          {#each pastShifts as shift}
            {#if shift}
              <div
                class="bg-white p-4 rounded-lg shadow-md border border-gray-300"
              >
                <div class="space-y-4">
                  <div>
                    <span class="text-gray-500 font-medium">Start Date:</span>
                    <p class="text-gray-800 text-base">
                      {fromUTCDate(shift.startDate)}
                    </p>
                  </div>
                  <div>
                    <span class="text-gray-500 font-medium">End Date:</span>
                    <p class="text-gray-800 text-base">
                      {fromUTCDate(shift.endDate)}
                    </p>
                  </div>
                  <div>
                    <span class="text-gray-500 font-medium">Shift Code:</span>
                    <p class="text-gray-800 text-base">{shift.shiftCode}</p>
                  </div>
                  <div>
                    <span class="text-gray-500 font-medium"
                      >Shift Assignment ID:</span
                    >
                    <p class="text-gray-800 text-base">{shift._id}</p>
                  </div>
                </div>
              </div>
            {:else}
              <div
                class="bg-gray-100 p-4 rounded-lg shadow-md border border-gray-300 text-gray-700"
              >
                <p class="text-lg font-medium">No Past Shift Assigned</p>
              </div>
            {/if}
          {/each}
        {:else}
          <div class="text-gray-500 text-center">No past shifts</div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .space-y-6 {
    margin-top: 1.5rem;
  }

  .cursor-move {
    cursor: grab;
  }

  .cursor-move:active {
    cursor: grabbing;
  }
</style>
