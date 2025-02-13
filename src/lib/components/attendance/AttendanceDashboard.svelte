<script lang="ts">
    import DayDetails from './DayDetails.svelte';
    import Modal from '../common/Modal.svelte';
    import RegularizationForm from '../attendance-Regularization/RegularizationForm.svelte';
    import Loader from '../common/Loader.svelte';
    import { attendanceApi } from '$lib/services/api';
    import AttendanceCaledar from './AttendanceCaledar.svelte';
    import type { AttendanceRecord } from '$lib/types';
  import { createEventDispatcher } from 'svelte';
  import { toast } from '../common/stores/toast.store';

    const dispatch = createEventDispatcher();
    export let attendanceRecords: AttendanceRecord[] = [];
    export let isLoading: boolean;


      let selectedDate = new Date();
      let regularizeRecord: AttendanceRecord | null = null;
      let isShowModal = false;
      let isRegularizationLoading = false;
      const weekEndDays = [0, 6];


    function handleDateSelect(event:  CustomEvent<{ date: Date }>) {
      console.log("handleDateSelect", event.detail.date);
      selectedDate = event.detail.date;
    }

    function handleOpenRegularization(record: any) {
      console.log("Applying regularization", record);
      regularizeRecord = record;
      isShowModal =true
    }
   async function handleApplyRegularization(record: any) {
      console.log("Applying regularization", record);
      isRegularizationLoading= true;
      try{
        let result = await attendanceApi.regularize(record);
        console.log(result,"result");
        if(result.success){
          toast.success("Regularization applied successfully");
          isShowModal = false;
          dispatch('refresh');
        }else{
          toast.error(  "Failed to apply regularization");
        }
      }catch(e){
        console.error(e);

      }finally{
        isRegularizationLoading = false;
        isShowModal = false;
      } 

    }

    function handleMonthChange(event: CustomEvent<{year: number, month: number}>) {
      console.log("handleMonthChange", event.detail);
      const { year, month } = event.detail;
      dispatch('monthChange', { year, month });
    }


  </script>
  
  <div class="flex flex-col md:flex-row w-full gap-4">
    <div class="w-full md:w-[70%]">
      <AttendanceCaledar
      bind:selectedDate={selectedDate}
      weekendDays={weekEndDays}
      bind:attendanceRecords= {attendanceRecords}
      bind:isLoading={isLoading}
      on:dateSelect={handleDateSelect}
      on:monthChange={handleMonthChange}
      />
    </div>
    <div class="w-full md:w-[30%]">
      <DayDetails 
        bind:selectedDate={selectedDate}
        bind:records={attendanceRecords}
        on:applyRegularization={(event) => handleOpenRegularization(event.detail)}
      />
    </div>
    {#if isShowModal}
        <Modal
        show={isShowModal}
            title="Apply Regularization"
            onClose={() => isShowModal = false}    
        >
        {#if isLoading}  
        <div class="flex justify-center items-center h-64">
          <Loader/>
        </div>
 
      {:else}  
      {#if regularizeRecord}
        <RegularizationForm 
        attendance={regularizeRecord} 
        on:cancel={() => isShowModal = false}
        on:submit = {(event) => handleApplyRegularization(event.detail)}
        />
      {/if}
      {/if}  
     
        </Modal>

    {/if}
  </div>