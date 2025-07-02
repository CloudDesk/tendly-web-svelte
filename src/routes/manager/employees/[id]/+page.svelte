<script lang="ts">
    import { page } from "$app/stores";
    import Tabs from "$lib/components/common/Tabs.svelte";
    import EmployeeAttendance from "$lib/components/attendance/EmployeeAttendance.svelte";
    import EmployeeDetails from "$lib/components/employee/EmployeeDetails.svelte";
    import DetailPageTemplate from "$lib/components/templates/DetailPageTemplate.svelte";
    import ContentCard from "$lib/components/common/ContentCard.svelte";
    import LeavesList from "$lib/components/leave/LeavesList.svelte";
    import EmployeeTrainingAttendance from "$lib/components/attendance/EmployeeTrainingAttendance.svelte";
    import EmployeeDocument from "$lib/components/employee/EmployeeDocument.svelte";
    import { auth } from "$lib/stores/auth";

    const employeeId = $page.params.id;
    export let data: { employee?: any } | undefined;

    // Safely get user and determine access type
    const user = $auth?.user;
    let access: "team";

    const tabs = [
        { id: "details", label: "Employee Details" },
        { id: "leaves", label: "Leaves" },
        { id: "attendance", label: "Attendance" },
        { id: "training", label: "Training" },
        { id: "document", label: "Document" },
    ];

    $: activeTab = $page.url.searchParams.get("tab") || tabs[0]?.id;
</script>

<DetailPageTemplate title="" subtitle="" backLink="/manager/employees">
    <ContentCard noPadding={true}>
        <div class="p-6">
            <div class="flex items-center gap-4">
                <div class="avatar avatar-lg">
                    {data?.employee?.name[0]}
                </div>
                <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-3">
                        <h2 class="text-xl font-semibold text-gray-900">
                            {data?.employee?.name}
                        </h2>
                        <div class="badge badge-success">
                            {data?.employee?.role}
                        </div>
                    </div>
                    <div
                        class="badge {data?.employee?.active
                            ? 'badge-success'
                            : 'badge-danger'}"
                    >
                        {data?.employee?.active ? "Active" : "Inactive"}
                    </div>
                </div>
            </div>
        </div>
    </ContentCard>

    <ContentCard>
        <Tabs {tabs}>
            {#if activeTab === "details"}
                <EmployeeDetails {employeeId} employee={data?.employee} />
            {:else if activeTab === "attendance"}
                <EmployeeAttendance {employeeId} />
            {:else if activeTab === "leaves"}
                <LeavesList userId={employeeId} />
            {:else if activeTab === "training"}
                <EmployeeTrainingAttendance {employeeId} />
            {:else if activeTab === "document"}
                <EmployeeDocument {employeeId} access={"team"} />
            {/if}
        </Tabs>
    </ContentCard>
</DetailPageTemplate>
