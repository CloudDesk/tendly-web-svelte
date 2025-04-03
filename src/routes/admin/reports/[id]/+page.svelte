<script lang="ts">
  import { page } from "$app/stores";
  import { reportsApi } from "$lib/services/api/reports";
  import { onMount } from "svelte";
  import {
    Download,
    FileBarChart2,
    Filter,
    ArrowUpDown,
    Database,
    Loader2,
    Edit,
  } from "lucide-svelte";
  import Table from "$lib/components/common/Table.svelte";
  import { formatDate } from "$lib/utils/date";
  import LoaderNew from "$lib/components/common/LoaderNew.svelte";
  import { toast } from "$lib/components/common/stores/toast.store";
  import Modal from "$lib/components/common/Modal.svelte";
  import ReportDataUnit from "$lib/components/report/ReportDataUnit.svelte";
  import Card from "$lib/components/common/Card.svelte";
  let reportData: any = null;
  let executedData: any[] = [];
  let isLoading = false;
  let isExecuting = false;
  let isShowModal = false;
  let showResultsModal = false;
  let initialDataUnit: any;

  const metadataGroups = [
    {
      title: "Basic Information",
      icon: FileBarChart2,
      fields: [
        { key: "name", label: "Report Name" },
        { key: "apiName", label: "API Name" },
        { key: "description", label: "Description" },
        { key: "object", label: "Object Type" },
      ],
    },
    {
      title: "Fields & Filters",
      icon: Filter,
      fields: [
        {
          key: "fields",
          label: "Selected Fields",
          render: (fields: any[]) => fields.map((f) => f.label).join(", "),
        },
        {
          key: "filters",
          label: "Filters",
          render: (filters: any[]) =>
            filters
              .map((f) => `${f.field} ${f.condition} "${f.value}"`)
              .join(" AND "),
        },
      ],
    },
    {
      title: "Sorting & Limits",
      icon: ArrowUpDown,
      fields: [
        {
          key: "sortFields",
          label: "Sort By",
          render: (sorts: any[]) =>
            sorts.map((s) => `${s.field} (${s.order})`).join(", "),
        },
        { key: "limit", label: "Record Limit" },
      ],
    },
  ];

  async function fetchReportDetails() {
    isLoading = true;
    try {
      const { id } = $page.params;
      const response: any = await reportsApi.getById(id);

      if (response.success) {
        reportData = response.data;
        initialDataUnit = {
          _id: response.data._id,
          name: response.data.name,
          apiName: response.data.apiName,
          object: response.data.object,
          fields: response.data.fields,
          filters: response.data.filters,
          filterLogic: response.data.filterLogic,
          sortFields: response.data.sortFields,
          limit: response.data.limit,
          preview: response.data.preview,
          query: response.data.query,
        };
      }
    } catch (err) {
      toast.error("Failed to fetch report details");
    } finally {
      isLoading = false;
    }
  }

  async function handleEdit() {
    isShowModal = true;
  }

  function closeModal() {
    isShowModal = false;
  }

  function closeResultsModal() {
    showResultsModal = false;
  }

  async function handleSaveReport(event: CustomEvent) {
    const updatedReport = event.detail;
    try {
      const response: any = await reportsApi.upsert(updatedReport);
      if (response.success) {
        toast.success("Report updated successfully");
        fetchReportDetails();
      }
    } catch (err) {
      toast.error("Failed to update report");
    } finally {
      closeModal();
    }
  }

  async function executeReport() {
    isExecuting = true;
    try {
      const response: any = await reportsApi.execute({
        query: JSON.parse(reportData.query),
        reportId: reportData._id,
      });
      console.log(response, "response");
      if (response.success) {
        executedData = response.data;
        showResultsModal = true;
        toast.success("Report executed successfully");
      }
    } catch (err) {
      toast.error("Failed to execute report");
    } finally {
      isExecuting = false;
    }
  }

  function downloadCSV() {
    if (!executedData.length) return;

    const headers = Object.keys(executedData[0]);
    const csvContent = [
      headers.join(","),
      ...executedData.map((row) =>
        headers.map((header) => JSON.stringify(row[header])).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportData.name}_${formatDate(new Date())}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("CSV downloaded successfully");
  }

  onMount(fetchReportDetails);
</script>

<div class="page-container">
  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <LoaderNew />
    </div>
  {:else if reportData}
    <!-- Header Section -->
    <header class="mb-8">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{reportData.name}</h1>
          <p class="text-sm text-gray-500 mt-1">
            Last updated: {formatDate(new Date(reportData.updatedAt))}
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="btn-secondary" on:click={handleEdit}>
            <Edit
              class="w-4 h-4 text-gray-500 hover:text-blue-500 transition"
            />
            Edit
          </button>
          <button
            class="btn-primary"
            on:click={executeReport}
            disabled={isExecuting}
          >
            {#if isExecuting}
              <Loader2 class="w-4 h-4 animate-spin" />
              Executing...
            {:else}
              <Database class="w-4 h-4" />
              Execute Report
            {/if}
          </button>
        </div>
      </div>
    </header>

    <!-- Metadata Cards -->
    <div class="grid grid-cols-2 grid-rows-2 gap-6 mb-8">
      {#each metadataGroups as group}
        <Card
          title={group.title}
          subtitle=""
          bordered={false}
          icon={group.icon}
          shadow="md"
          bgColor="bg-gray-50"
        >
          <div class="space-y-4">
            {#each group.fields as field}
              <div>
                <div class="info-label">{field.label}</div>
                <div class="info-value">
                  {#if field.render && reportData[field.key]}
                    {field.render(reportData[field.key])}
                  {:else}
                    {reportData[field.key] || "N/A"}
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </Card>
      {/each}
    </div>
  {:else}
    <div class="bg-white rounded-xl shadow-sm p-8 text-center">
      <h2 class="text-xl font-medium text-gray-700">Report not found</h2>
      <p class="mt-2 text-gray-500">
        The requested report could not be loaded.
      </p>
      <a href="/reports" class="inline-block mt-4 text-blue-600 hover:underline"
        >Return to Reports</a
      >
    </div>
  {/if}

  <!-- Edit Report Modal -->
  {#if isShowModal}
    <Modal
      show={isShowModal}
      title="Update Report"
      onClose={closeModal}
      wide={true}
    >
      <ReportDataUnit
        on:close={closeModal}
        on:save={handleSaveReport}
        {initialDataUnit}
        mode="update"
      />
    </Modal>
  {/if}

  <!-- Execution Results Modal -->
  {#if showResultsModal && executedData.length}
    <Modal
      show={showResultsModal}
      title={`${reportData.name} - (${executedData.length}) Results`}
      onClose={closeResultsModal}
      wide={true}
    >
      <div class="flex justify-end items-center mb-4 mt-4">
        <button class="btn-accent-sm" on:click={downloadCSV}>
          <Download class="w-3.5 h-3.5" />
          Download CSV
        </button>
      </div>
      <div class="overflow-x-auto max-h-[calc(100vh-220px)]">
        <Table
          columns={Object.keys(executedData[0]).map((key) => ({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            sortable: true,
          }))}
          searchable={false}
          data={executedData}
        />
      </div>
    </Modal>
  {/if}
</div>

<!-- Executed Data Table (Inline) -->
<!-- {#if executedData.length && !showResultsModal}
      <CommonCard>
        <div slot="header" class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Database class="w-5 h-5 text-blue-600" />
            <h2 class="text-lg font-semibold text-gray-900">
              Executed Results ({executedData.length} records)
            </h2>
          </div>
          <button
            class="text-sm text-blue-600 hover:text-blue-800"
            on:click={() => (showResultsModal = true)}
          >
            View Full Screen
          </button>
        </div>
        <div slot="content" class="overflow-x-auto max-h-96">
          <Table
            columns={Object.keys(executedData[0]).map((key) => ({
              key,
              label: key.charAt(0).toUpperCase() + key.slice(1),
              sortable: true,
            }))}
            data={executedData}
          />
        </div>
      </CommonCard>
    {/if} -->

<style lang="postcss">
  .page-container {
    @apply max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8;
  }

  .btn-primary {
    @apply flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
             hover:bg-blue-700 transition-colors duration-200
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg
             border border-gray-300 hover:bg-gray-50 transition-colors duration-200
             focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-accent {
    @apply flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg
             hover:bg-green-700 transition-colors duration-200
             focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-accent-sm {
    @apply flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg
             hover:bg-green-700 transition-colors duration-200
             focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2;
  }
</style>
