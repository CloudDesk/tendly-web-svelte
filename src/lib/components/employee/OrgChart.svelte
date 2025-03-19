<script lang="ts">
  import { employeesApi } from "$lib/services/api";
  import { onMount } from "svelte";
  import type { User } from "$lib/types";
  import ProfileCard from "./ProfileCard.svelte";

  interface OrgNode extends User {
    children: OrgNode[];
    isExpanded: boolean;
    image: string | null;
  }

  let employees: User[] = [];
  let orgData: OrgNode | null = null;

  async function fetchEmployees() {
    try {
      const response: any = await employeesApi.list({ page: 1, limit: 100 });
      employees = response.data.map((emp: any) => ({
        _id: emp._id,
        name: emp.name,
        role: emp.role,
        managerId: emp.managerId,
        image: emp.image || null,
      }));
      processOrgData();
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  }

  function processOrgData() {
    const ceoNode: OrgNode = {
      _id: "ceo",
      email: "",
      firstName: "CEO",
      lastName: "",
      name: "CEO",
      role: "CEO",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      managerId: "ceo",
      image: null,
      children: [],
      isExpanded: true,
    };
    const employeeMap = new Map<string, OrgNode>();
    employees.forEach((emp) => {
      employeeMap.set(emp._id, {
        ...emp,
        children: [],
        isExpanded: true,
        image: emp?.image || null,
      } as OrgNode);
    });

    const processed = new Set<string>();
    processed.add("ceo");

    employees.forEach((emp) => {
      if (emp.role === "admin") {
        ceoNode.children.push(employeeMap.get(emp._id) as OrgNode);
        processed.add(emp._id);
      }
    });

    employees.forEach((emp) => {
      if (emp.role === "manager" && !processed.has(emp._id)) {
        const adminNode = employeeMap.get(emp.managerId as string);
        if (adminNode) {
          adminNode.children.push(employeeMap.get(emp._id) as OrgNode);
          processed.add(emp._id);
        }
      }
    });

    employees.forEach((emp) => {
      if (emp.role === "staff" && !processed.has(emp._id)) {
        const managerNode = employeeMap.get(emp.managerId as string);
        if (managerNode) {
          managerNode.children.push(employeeMap.get(emp._id) as OrgNode);
          processed.add(emp._id);
        }
      }
    });

    orgData = ceoNode;
  }

  onMount(() => {
    fetchEmployees();
  });
</script>

<div class="org-chart-container p-8">
  {#if orgData}
    <div class="org-chart">
      <ProfileCard node={orgData} />
    </div>
  {:else}
    <div class="loading">Loading organization chart...</div>
  {/if}
</div>

<style>
  .org-chart-container {
    width: 100%;
    overflow-x: auto;
    /* background: #b8b8b8; */
  }

  .org-chart {
    display: flex;
    justify-content: center;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #4a5568;
  }
</style>
