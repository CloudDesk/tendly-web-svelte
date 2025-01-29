<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import LeaveDetails from '$lib/components/leave/LeaveDetails.svelte';
  
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
        // Replace with your actual API call
        const response = await fetch(`/api/leaves/${id}`);
        leave = await response.json();
      } catch (err) {
        error = 'Failed to load leave details';
        console.error(err);
      } finally {
        isLoading = false;
      }
    });
  
    function formatDate(date: string): string {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  
    function calculateDuration(start: string, end: string): number {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
  </script>
  
  <div class="page-container">
    {#if isLoading}
      <div class="loading">Loading...</div>
    {:else if error}
      <div class="error">{error}</div>
    {:else if leave}
     <div class="card-body">
     <LeaveDetails {leaveId}/>
     </div>
    {/if}
  </div>
  
  <style>
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
  
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
  
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
  
    .edit-button {
      background-color: #3b82f6;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      border: none;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
  
    .edit-button:hover {
      background-color: #2563eb;
    }
  
    .details-card {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }
  
    .section {
      margin-bottom: 2rem;
    }
  
    .section:last-child {
      margin-bottom: 0;
    }
  
    h2 {
      font-size: 1.25rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 1rem;
    }
  
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
  
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  
    .full-width {
      grid-column: 1 / -1;
    }
  
    label {
      font-size: 0.875rem;
      color: #6b7280;
    }
  
    span {
      color: #111827;
    }
  
    .reason {
      line-height: 1.5;
      color: #374151;
    }
  
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
      width: fit-content;
    }
  
    .status-badge.approved {
      background-color: #dcfce7;
      color: #166534;
    }
  
    .status-badge.rejected {
      background-color: #fee2e2;
      color: #991b1b;
    }
  
    .status-badge.pending {
      background-color: #fef9c3;
      color: #854d0e;
    }
  
    .loading {
      text-align: center;
      color: #6b7280;
      padding: 2rem;
    }
  
    .error {
      color: #dc2626;
      text-align: center;
      padding: 2rem;
    }
  </style>