<script lang="ts">
  import { page } from "$app/stores";
  import { reportsApi } from "$lib/services/api";
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
  import DetailPageTemplate from "$lib/components/templates/DetailPageTemplate.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";

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
    } catch (err:any) {
      toast.error(err.message || "Failed to fetch report details");
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
  const headerActions = [
    {
      label: "Edit",
      handler: () => {
        isShowModal = true;
      },
      variant: "outline",
      icon: Edit,
    },
    {
      label: "Execute Report",
      handler: executeReport,
      variant: "primary",
      icon: Database,
    },
  ];
</script>

<DetailPageTemplate
  title=""
  subtitle=""
  backLink="/admin/reports"
  showActions={true}
  actions={headerActions}
>
  <ContentCard noPadding={true}>
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900">{reportData?.name}</h1>
      <p class="text-sm text-gray-500 mt-1">
        {reportData?.updatedAt
          ? `Last updated: ${formatDate(new Date(reportData?.updatedAt))}`
          : ""}
      </p>
    </div>
  </ContentCard>
  <ContentCard>
    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <LoaderNew />
      </div>
    {:else if reportData}
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
        <a
          href="/reports"
          class="inline-block mt-4 text-blue-600 hover:underline"
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
  </ContentCard>
</DetailPageTemplate>
