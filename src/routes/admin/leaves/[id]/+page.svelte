<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { leavesApi } from '$lib/services/api/leaves';
  import type { LeaveRequest } from '$lib/services/api/leaves';

  let leave: LeaveRequest | null = null;
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    const { id } = $page.params;
    try {
      leave = await leavesApi.getById(id);
    } catch (err) {
      error = 'Failed to load leave request';
      console.error(err);
    } finally {
      isLoading = false;
    }
  });

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }
</script>

{#if isLoading}
  <p>Loading...</p>
{:else if error}
  <p>{error}</p>
{:else if leave}
  <div class="leave-detail-page">
    <header>
      <div class="header-content">
        <h1>Leave Request Details</h1>
        <span class="status {leave.status.toLowerCase()}">{leave.status}</span>
      </div>
    </header>

    <div class="detail-card">
      <div class="detail-section">
        <h2>Leave Information</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Leave Type</label>
            <span>{leave.type}</span>
          </div>
          <div class="detail-item">
            <label>Duration</label>
            <span>{calculateDuration(leave.startDate, leave.endDate)} days</span>
          </div>
          <div class="detail-item">
            <label>Start Date</label>
            <span>{formatDate(leave.startDate)}</span>
          </div>
          <div class="detail-item">
            <label>End Date</label>
            <span>{formatDate(leave.endDate)}</span>
          </div>
          <div class="detail-item">
            <label>Applied On</label>
            <span>{formatDate(leave.appliedOn)}</span>
          </div>
          {#if leave.status !== 'pending'}
            <div class="detail-item">
              <label>{leave.status === 'approved' ? 'Approved By' : 'Rejected By'}</label>
              <span>{leave.approvedBy || leave.rejectedBy}</span>
            </div>
          {/if}
        </div>
      </div>

      <div class="detail-section">
        <h2>Reason</h2>
        <p class="reason-text">{leave.reason}</p>
      </div>

      {#if leave.status === 'rejected' && leave.rejectionReason}
        <div class="detail-section">
          <h2>Rejection Reason</h2>
          <p class="reason-text">{leave.rejectionReason}</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .leave-detail-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .detail-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }

  .detail-section {
    margin-bottom: 2rem;
  }

  .detail-section:last-child {
    margin-bottom: 0;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-item label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .reason-text {
    margin-top: 0.5rem;
    line-height: 1.5;
  }

  :global(.status) {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  :global(.status.approved) {
    background: #dcfce7;
    color: #166534;
  }

  :global(.status.pending) {
    background: #fef9c3;
    color: #854d0e;
  }

  :global(.status.rejected) {
    background: #fee2e2;
    color: #991b1b;
  }
</style>