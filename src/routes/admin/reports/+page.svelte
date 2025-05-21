<script lang="ts">
  import { Plus, Filter, TableProperties, FileBarChart2 } from "lucide-svelte";
  import Modal from "$lib/components/common/Modal.svelte";
  import ReportDataUnit from "$lib/components/report/ReportDataUnit.svelte";
  import Table from "$lib/components/common/Table.svelte";
  import { onMount } from "svelte";
  import { reportsApi, type IReport } from "$lib/services/api/reports";
  import LoaderNew from "$lib/components/common/LoaderNew.svelte";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";

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

<IndexPageTemplate
  title="Report"
  subtitle="Manage your reports"
  showExport={false}
  showAdd={true}
  addButtonText="New Report"
  onAdd={() => (showModal = true)}
  showFilter={true}
  showView={true}
>
  <ContentCard noPadding={true}>
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
          Your generated reports will appear here. Create your first report to
          get started with data analysis.
        </p>
        <button class="create-report-btn" on:click={() => (showModal = true)}>
          Create First Report
        </button>
      </div>
    {/if}

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
  </ContentCard>
</IndexPageTemplate>
