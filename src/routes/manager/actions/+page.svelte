<script lang="ts">
  import Tabs from "$lib/components/common/Tabs.svelte";
  import AssignedLeaves from "$lib/components/managerActions/AssignedLeaves.svelte";
  import Regularization from "$lib/components/managerActions/Regularization.svelte";
  import { page } from "$app/stores";
  import Resignation from "$lib/components/employee/resignation/Resignation.svelte";
  import RegularizationList from "$lib/components/attendance-Regularization/RegularizationList.svelte";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";

  const tabs = [
    { id: "leave", label: "Leave" },
    { id: "regularization", label: "Regularization" },
    { id: "resignation", label: "Resignation" },
    { id: "admin-resignation", label: "Admin Resignation" },
  ];

  $: activeTab = $page.url.searchParams.get("tab") || tabs[0]?.id;
</script>

<IndexPageTemplate
  title="Management"
  subtitle="Review and Manage Leave, Regularization, and Resignation Requests"
>
  <ContentCard noPadding={true}>
    <Tabs {tabs}>
      {#if activeTab === "leave"}
        <AssignedLeaves />
      {:else if activeTab === "regularization"}
        <RegularizationList viewType="manager" />
      {:else if activeTab === "resignation"}
        <Resignation viewMode="manager" />
      {:else if activeTab === "admin-resignation"}
        <Resignation viewMode="admin" />
      {/if}
    </Tabs>
  </ContentCard>
</IndexPageTemplate>
