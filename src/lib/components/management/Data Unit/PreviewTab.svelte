<script lang="ts">
  import { dataUnit as dataUnitStore } from "$lib/stores/dataUnit";
  import type { DataUnit } from "$lib/stores/dataUnit";
  import { get } from "svelte/store";

  export let dataUnitt: DataUnit = get(dataUnitStore);
  console.log(JSON.stringify(dataUnitt, null, 2), "dataUnit"); // Debugging line
  function generateSQLQuery(dataUnit: DataUnit): string {
    if (!dataUnit || !dataUnit.object || !dataUnit.fields) {
      return "Invalid data structure";
    }

    let tableName = dataUnit.object;
    let fields = dataUnit.fields.length
      ? dataUnit.fields?.map((f) => f.apiName).join(", ")
      : "*";

    let conditions: string[] = dataUnit.filters.map((f, index) => {
      let fieldType =
        dataUnit.fields.find((field) => field.apiName === f.field?.toString())
          ?.fieldType || "String";

      let value = fieldType === "String" ? `'${f.value}'` : f.value;

      return `${f.field} = ${value}`;
    });

    // Handle null or empty filterLogic
    let whereClause = "";
    if (conditions.length > 0) {
      if (dataUnit.filterLogic) {
        whereClause =
          " WHERE " +
          dataUnit.filterLogic.replace(/\b\d+\b/g, (match) => {
            let index = parseInt(match) - 1;
            return conditions[index] ? `(${conditions[index]})` : "";
          });
      } else {
        // Default to combining conditions with AND if filterLogic is null or empty
        whereClause = " WHERE " + conditions.join(" AND ");
      }
    }

    let orderByClause = dataUnit.sortFields?.length
      ? ` ORDER BY ${dataUnit.sortFields
          ?.map(
            (sf: any) =>
              `${sf.field} ${sf.order === "Ascending" ? "ASC" : "DESC"}`
          )
          .join(", ")}`
      : "";

    let limitClause = dataUnit.limit ? ` LIMIT ${dataUnit.limit}` : "";

    let query = `SELECT ${fields} FROM ${tableName}${whereClause}${orderByClause}${limitClause};`;

    return query;
  }

  let sqlQuery: string = generateSQLQuery(dataUnitt);
</script>

<div class="query-container">
  <h2>SQL Query Preview</h2>
  <pre>{sqlQuery}</pre>
</div>

<style>
  .query-container {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    font-family: monospace;
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
  }
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
</style>
