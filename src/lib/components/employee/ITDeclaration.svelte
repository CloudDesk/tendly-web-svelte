<script lang="ts">
    import { taxDeclarationApi } from "$lib/services/api";
    import { onMount } from "svelte";
    import Loader from "../common/Loader.svelte";
    import type { TaxDeclaration } from "$lib/types";
    import TaxableIncomeSummarySection from "../taxDeclaration/TaxableIncomeSummarySection.svelte";
    import Card from "../common/Card.svelte";
    import ItDeclarationDetails from "./ITDeclarationDetails.svelte";
    import TaxComputationSection from "../taxDeclaration/TaxComputationSection.svelte";
    import Form12BSection from "../taxDeclaration/Form12BSection.svelte";
    import Form12BbGenerate from "../taxDeclaration/Form12BBGenerate.svelte";

    export let employee;
    console.log(employee, "employee in ITDeclaration.svelte");
    let taxDeclaration: TaxDeclaration | null;
    let isLoading = false;
    let activeTab = "tax"; // Default active tab

    function setActiveTab(tab: string) {
        activeTab = tab;
    }
    const getTaxDeclarationCurrentFY = async () => {
        isLoading = true;
        try {
            let result: any = await taxDeclarationApi.getUserCurrentFY(
                employee._id,
            );
            console.log(result.data, "result ");
            if (result.success) {
                taxDeclaration = result.data;
            }
        } catch (error: any) {
        } finally {
            isLoading = false;
        }
    };
    onMount(() => {
        employee && getTaxDeclarationCurrentFY();
    });
</script>

<div>
    {#if isLoading === true}
        <Loader />
    {:else if taxDeclaration}
        <div class="tab-container">
            <nav class="tabs">
                <button
                    class="tab-item"
                    class:active={activeTab === "tax"}
                    on:click={() => setActiveTab("tax")}
                >
                    Tax Summary
                </button>
                <button
                    class="tab-item"
                    class:active={activeTab === "declaration"}
                    on:click={() => setActiveTab("declaration")}
                >
                    Declaration
                </button>
                <button
                    class="tab-item"
                    class:active={activeTab === "deduction"}
                    on:click={() => setActiveTab("deduction")}
                >
                    Monthly Deduction Plan
                </button>
                <button
                    class="tab-item"
                    class:active={activeTab === "form12b"}
                    on:click={() => setActiveTab("form12b")}
                >
                    Form 12B
                </button>
                <button
                    class="tab-item"
                    class:active={activeTab === "form12bb"}
                    on:click={() => setActiveTab("form12bb")}
                >
                    Form 12BB
                </button>
            </nav>
        </div>

        <div class="tab-">
            {#if activeTab === "tax"}
                <TaxableIncomeSummarySection {taxDeclaration} />
            {:else if activeTab === "declaration"}
                <ItDeclarationDetails
                    {taxDeclaration}
                    adminOnly={true}
                    on:approvals={getTaxDeclarationCurrentFY}
                />
            {:else if activeTab === "deduction"}
                <TaxComputationSection {taxDeclaration} />
            {:else if activeTab === "form12b"}
                <Form12BSection
                    {taxDeclaration}
                    mode="admin"
                    employeeId={employee._id}
                />
            {:else if activeTab === "form12bb"}
                <Form12BbGenerate {taxDeclaration} mode="admin" {employee} />
            {/if}
        </div>
    {:else}
        <Card title={""} subtitle={""} bordered={false} shadow="none">
            <div class="p-4 text-gray-400">
                No tax declaration found for the current financial year.
            </div>
        </Card>
    {/if}
</div>

<style>
    .tab-item {
        padding: 10px;
        cursor: pointer;
        border: none;
        background-color: #ddd;
        margin-right: 5px;
    }
    .tab-item.active {
        background-color: #d3e3fd;
        font-weight: bold;
    }
    .tab-content {
        /* margin-top: 10px; */
    }
</style>
