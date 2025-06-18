<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import LeaveDetails from "$lib/components/leave/LeaveDetails.svelte";
  import { leavesApi } from "$lib/services/api";
  import DetailPageTemplate from "$lib/components/templates/DetailPageTemplate.svelte";
  import LoaderNew from "$lib/components/common/LoaderNew.svelte";
  import InfoBanner from "$lib/components/common/InfoBanner.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";

  interface LeaveDetails {
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
    reason: string;
    appliedBy: string;
    appliedOn: string;
    approvedBy?: string;
    rejectedBy?: string;
    rejectionReason?: string;
  }
  const leaveId = $page.params.id;
  let leave: LeaveDetails | null = null;
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      // Fetch leave details using ID from URL params
      const { id } = $page.params;
      let result: any = await leavesApi.getById(id);
      console.log(result, "result");
      if (result.success) {
        leave = result.data;
      } else {
        error = "Failed to load leave details";
      }
    } catch (err) {
      error = "Failed to load leave details";
      console.error(err);
    } finally {
      isLoading = false;
    }
  });

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function calculateDuration(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
</script>

<DetailPageTemplate
  title=""
  subtitle=""
  backLink="/admin/leaves"
  showActions={false}
>
  <!-- <div class="page-container"> -->
  <ContentCard noPadding={true}>
    {#if isLoading}
      <LoaderNew />
    {:else if error}
      <InfoBanner type="error" message={error} dismissible={false} />
    {:else if leave}
      <div class="card-body">
        <LeaveDetails {leaveId} />
      </div>
    {/if}
    <!-- </div> -->
  </ContentCard>
</DetailPageTemplate>
