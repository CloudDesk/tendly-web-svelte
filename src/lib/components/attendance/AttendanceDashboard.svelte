<script lang="ts">
    import CalendarView from './CalendarView.svelte';
    import DayDetails from './DayDetails.svelte';
    import { attendanceStore } from '$lib/stores/attendance';
    import { derived } from 'svelte/store';
    import Modal from '../common/Modal.svelte';
  import RegularizationForm from '../attendance-Regularization/RegularizationForm.svelte';
  import Loader from '../common/Loader.svelte';
  import { attendanceApi } from '$lib/services/api';

    let selectedDate = new Date();
    const attendanceRecords = derived(attendanceStore, ($store) => $store.records);
  
    let regularizeRecord = null as any;
    let isShowModal = false;
let isLoading = false;

    function handleDateSelect(event:  CustomEvent<Date>) {
      console.log("handleDateSelect", event.detail);
      selectedDate = event.detail;
    }
    $: console.log("AttendanceDashboard selectedDate", selectedDate);

    function handleOpenRegularization(record: any) {
      console.log("Applying regularization", record);
      regularizeRecord = record;
      isShowModal =true
    }
   async function handleApplyRegularization(record: any) {
      console.log("Applying regularization", record);

      isLoading= true;

      try{
        let result = await attendanceApi.regularize(record);
        console.log(result,"result");
      }catch(e){
        console.error(e);
      }
      // finally{
      //   isLoading=false;
      //   isShowModal = false;
      // }   

    }

  </script>
  
  <div class="flex flex-col md:flex-row w-full gap-4">
    <div class="w-full md:w-[70%]">
      <CalendarView 
      {selectedDate}
      records={$attendanceRecords}
        on:dateSelect={(event) => handleDateSelect(event)} 
      />
    </div>
    <div class="w-full md:w-[30%]">
      <DayDetails 
        date={selectedDate}
        records={$attendanceRecords}
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
      <RegularizationForm 
      attendance={regularizeRecord} 
      on:cancel={() => isShowModal = false}
      on:submit = {(event) => handleApplyRegularization(event.detail)}
      />
      {/if}  
     
        </Modal>

    {/if}
  </div>