<script lang="ts">
  import { Plus, Filter, TableProperties, FileBarChart2 } from "lucide-svelte";
  import Modal from "$lib/components/common/Modal.svelte";
  import ReportDataUnit from "$lib/components/report/ReportDataUnit.svelte";
  import Table from "$lib/components/common/Table.svelte";
  import { onMount } from "svelte";
  import { reportsApi, type IReport } from "$lib/services/api/reports";
  import LoaderNew from "$lib/components/common/LoaderNew.svelte";

  const initialDataUnit = {
    name: "",
    apiName: "",
    description: "",
    object: null,
    fields: [],
    filters: [],
    filterLogic: "",
    sortFields: [], // Added missing property
    limit: 10, // Changed from null to 0
    preview: null,
  };

  let showModal = false;
  let isLoading = false;
  // Placeholder data for the table
  const columns = [
    { key: "name", label: "Report Name", sortable: true },
    {
      key: "_id",
      label: "Actions",
      render: (leave: IReport) => `
        <a href="/admin/reports/${leave._id}" class="btn btn-sm btn-ghost" data-sveltekit-preload>
          View
        </a>
      `,
    },
  ];

  let reports: IReport[] = [];

  function closeModal() {
    showModal = false;
  }

  async function handleSaveReport(event: CustomEvent) {
    // Handle save logic here
    console.log(event.detail, "handleSaveReport");
    const { preview, ...data } = event.detail;
    isLoading = true;
    try {
      let upsertResult = await reportsApi.upsert(data);
      console.log(upsertResult, "upsertResult");
    } catch (error) {
    } finally {
      await getreports();
      isLoading = false;
      closeModal();
    }
  }

  const getreports = async () => {
    isLoading = true;
    try {
      let result: any = await reportsApi.getAll();
      console.log(result, "result");
      if (result.success) {
        reports = result.data;
      }
    } catch (error) {
    } finally {
      isLoading = false;
    }
  };

  onMount(() => {
    getreports();
  });
</script>

<div class="page-container">
  <header>
    <div class="header-left">
      <h1>Reports</h1>
      <div class="header-actions">
        <button class="btn-filter">
          <Filter class="w-[16px] h-[16px]  fill-gray-500" />
          Filter
        </button>
        <button class="btn-view">
          <TableProperties class="w-[15px] h-[15px] " />
          View
        </button>
      </div>
    </div>
    <div class="header-right">
      <button class="btn-primary" on:click={() => (showModal = true)}>
        <Plus class="w-5 h-5 mr-2" />
        New Report
      </button>
    </div>
  </header>

  {#if isLoading}
    <LoaderNew />
  {:else if reports.length > 0}
    <div class="table-container">
      <Table {columns} data={reports} />
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-state-icon-wrapper">
        <FileBarChart2 size={48} strokeWidth={1.5} />
      </div>
      <h3 class="empty-state-title">No Reports Available</h3>
      <p class="empty-state-description">
        Your generated reports will appear here. Create your first report to get
        started with data analysis.
      </p>
      <button class="create-report-btn" on:click={() => (showModal = true)}>
        Create First Report
      </button>
    </div>
  {/if}

  <!-- Create Report Modal -->
  {#if showModal}
    <Modal
      show={showModal}
      title="Create New Report"
      onClose={closeModal}
      wide={true}
    >
      <ReportDataUnit
        on:close={closeModal}
        on:save={handleSaveReport}
        {initialDataUnit}
        mode="create"
      />
    </Modal>
  {/if}
</div>

<style>
  .page-container {
    padding: 24px;
    background: #f6f7fb;
    min-height: 100vh;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .header-right {
    display: flex;
    gap: 12px;
  }

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #323338;
    margin: 0;
  }

  button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #0073ea;
    color: white;
  }

  .btn-primary:hover {
    background: #0060c2;
  }

  .btn-secondary {
    background: white;
    color: #323338;
    border: 1px solid #dcdcdc;
  }

  .btn-secondary:hover {
    background: #f5f6f8;
  }

  .btn-filter,
  .btn-view {
    background: transparent;
    color: #676879;
    padding: 6px 12px;
  }

  .btn-filter:hover,
  .btn-view:hover {
    background: #f5f6f8;
  }

  .table-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .empty-state {
    @apply flex flex-col items-center justify-center py-16 px-8 bg-white rounded-xl shadow-md border border-gray-100;
  }

  .empty-state-icon-wrapper {
    @apply mb-6 text-gray-300;
  }

  .empty-state-title {
    @apply text-xl font-semibold text-gray-800 mb-3;
  }

  .empty-state-description {
    @apply text-gray-500 text-base max-w-md mb-6;
  }

  .create-report-btn {
    @apply px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50;
  }
</style>
