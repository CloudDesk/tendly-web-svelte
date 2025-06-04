<script lang="ts">
  import { auth } from "$lib/stores/auth";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import { page } from "$app/stores";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import ContentCard from "$lib/components/common/ContentCard.svelte";
  import MyReqLeaves from "$lib/components/leave/MyReqLeaves.svelte";
  import Regularization from "$lib/components/attendance-Regularization/Regularization.svelte";
  import RegularizationList from "$lib/components/attendance-Regularization/RegularizationList.svelte";
  import vi from "date-fns/locale/vi";
  import Resignation from "$lib/components/employee/resignation/Resignation.svelte";

  const tabs = [
    { id: "leave", label: "Leave" },
    { id: "regularization", label: "Regularization" },
    { id: "resignation", label: "Resignation" },
  ];

  $: activeTab = $page.url.searchParams.get("tab") || tabs[0]?.id;
</script>

<IndexPageTemplate title="My Requests" subtitle="Manage your requests">
  <ContentCard noPadding={true}>
    <Tabs {tabs}>
      {#if activeTab === "leave"}
        <MyReqLeaves />
      {:else if activeTab === "regularization"}
        <RegularizationList viewType="user" hideHeader={true} />
      {:else if activeTab === "resignation"}
        <Resignation viewMode="employee" hideHeader={true} />
      {/if}
    </Tabs>
  </ContentCard>
</IndexPageTemplate>
