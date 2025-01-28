<script lang="ts">
  import Table from '$lib/components/common/Table.svelte';
  import Modal from '$lib/components/common/Modal.svelte';
  import { onMount } from 'svelte';
  import type { LOV } from '$lib/types';
  import { lovsApi } from '$lib/services/api/';
  import { page } from '$app/stores';
  let lovs: LOV[] = [];
  let loading = false;
  let error: string | null = null;
  let showForm = false;
  let showDetails = false;
  let editingLOV: Partial<LOV> = { values: [] };
  let selectedLOV: LOV | null = null;
  let searchQuery = '';
  let pagination = {
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1
  };
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { 
      key: 'values', 
      label: 'Values',
      render: (row: LOV) => `<span>${row?.values?.length || 0} items</span>`
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: LOV) => row?._id ? `
        <button class="btn btn-sm btn-ghost" data-action="view" data-id="${row._id}">View</button>
        <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${row._id}">Edit</button>
      ` : ''
    }
  ];

  async function loadLOVs() {
    try {
      loading = true;
      const response = await lovsApi.list({
        page: pagination.page,limit: pagination.limit,search: searchQuery
      });
      console.log(response,"response")  
      pagination={
          total: response.meta?.total||0,
          page: response.meta?.page||1,
          limit:  5,
          totalPages: response.meta?.totalPages||1
        }
      lovs = response.data;
    } catch (err) {
      error = 'Failed to load configurations';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    try {
      loading = true;
      if (editingLOV._id) {
        await lovsApi.update(editingLOV._id, editingLOV as Partial<LOV>);
      } else {
        await lovsApi.create(editingLOV as Omit<LOV, '_id'>);
      }
      showForm = false;
      editingLOV = { values: [] };
      await loadLOVs();
    } catch (err) {
      error = 'Failed to save configuration';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handleTableAction(e: CustomEvent) {
    const { action, id } = e.detail;
    const lov = lovs.find(l => l._id === id);
    if (!lov) return;

    if (action === 'view') {
      selectedLOV = lov;
      showDetails = true;
    } else if (action === 'edit') {
      editingLOV = { ...lov };
      showForm = true;
    }
  }

  function addValue() {
    editingLOV.values = [
      ...editingLOV.values || [],
      { label: '', value: '', isActive: true }
    ];
  }

  function removeValue(index: number) {
    editingLOV.values = editingLOV.values?.filter((_, i) => i !== index);
  }

  async function handlePage(event: CustomEvent) {
        console.log(event,"handlePageChange")
        loading =true
    try{
      const { page: newPage } = event.detail;
      pagination.page = newPage;
      const url = new URL($page.url);
      url.searchParams.set('page', newPage.toString());
      await loadLOVs();
    // await  goto(url, { replaceState: true , invalidateAll: true});
    }finally{
      loading=false
    }
    }


  onMount(loadLOVs);
</script>

<div>
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-semibold">Configurations</h2>
    <div class="flex gap-4">
      <input 
        type="text" 
        class="input input-bordered" 
        placeholder="Search configs..."
        bind:value={searchQuery}
        on:input={() => loadLOVs()}
      />
      <button class="btn btn-primary" on:click={() => {
        editingLOV = { values: [] };
        showForm = true;
      }}>Add New Config</button>
    </div>
  </div>

  {#if error}
    <div class="alert alert-error">{error}</div>
  {/if}

  {#if loading}
    <div class="loading">Loading...</div>
  {:else}
    <Table {columns} data={lovs} 
    serverSide={true}
    loading={loading}
    meta={pagination}
    variant='transparent'
    on:action={handleTableAction} 
    on:page={handlePage}
    />
    
    <!-- <div class="flex justify-center mt-4 gap-2">
      <button 
        class="btn btn-sm" 
        disabled={page === 1}
        on:click={() => {
          page--;
          loadLOVs();
        }}
      >Previous</button>
      <span class="py-1">Page {page}</span>
      <button 
        class="btn btn-sm"
        on:click={() => {
          page++;
          loadLOVs();
        }}
      >Next</button>
    </div> -->
  {/if}
</div>

<Modal
  show={showForm}
  title={editingLOV._id ? 'Edit Configuration' : 'New Configuration'}
  onClose={() => {
    showForm = false;
    editingLOV = { values: [] };
  }}
>
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div class="form-control">
      <label class="label">Name</label>
      <input 
        type="text" 
        class="input input-bordered" 
        bind:value={editingLOV.name}
        required
      />
    </div>

    <div class="form-control">
      <label class="label">Type</label>
      <input 
        type="text" 
        class="input input-bordered" 
        bind:value={editingLOV.type}
        required
      />
    </div>

    <div class="space-y-2">
      <div class="flex justify-between items-center">
        <label class="label">Values</label>
        <button type="button" class="btn btn-sm btn-ghost" on:click={addValue}>
          Add Value
        </button>
      </div>

      {#each editingLOV.values || [] as value, i}
        <div class="grid grid-cols-12 gap-2 items-center">
          <div class="col-span-5">
            <input 
              type="text" 
              class="input input-bordered w-full" 
              placeholder="Label"
              bind:value={value.label}
              required
            />
          </div>
          <div class="col-span-5">
            <input 
              type="text" 
              class="input input-bordered w-full" 
              placeholder="Value"
              bind:value={value.value}
              required
            />
          </div>
          <div class="col-span-1">
            <input 
              type="checkbox" 
              class="toggle" 
              bind:checked={value.isActive}
            />
          </div>
          <div class="col-span-1">
            <button 
              type="button"
              class="btn btn-sm btn-ghost text-error"
              on:click={() => removeValue(i)}
            >✕</button>
          </div>
        </div>
      {/each}
    </div>

    <div class="flex justify-end gap-2">
      <button 
        type="button" 
        class="btn btn-ghost"
        on:click={() => {
          showForm = false;
          editingLOV = { values: [] };
        }}
      >Cancel</button>
      <button type="submit" class="btn btn-primary">Save</button>
    </div>
  </form>
</Modal>

<Modal
  show={showDetails}
  title={selectedLOV?.name || 'Configuration Details'}
  onClose={() => {
    showDetails = false;
    selectedLOV = null;
  }}
>
  {#if selectedLOV}
    <div class="space-y-4">
      <div>
        <label class="font-semibold">Type:</label>
        <p>{selectedLOV.type}</p>
      </div>

      <div>
        <label class="font-semibold">Values:</label>
        <div class="mt-2">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Label</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {#each selectedLOV.values as value}
                <tr>
                  <td>{value.label}</td>
                  <td>{value.value}</td>
                  <td>
                    <span class={value.isActive ? 'text-success' : 'text-error'}>
                      {value.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</Modal> 