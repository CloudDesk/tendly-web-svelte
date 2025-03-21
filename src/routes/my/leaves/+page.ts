import type { PageLoad } from './$types';
import { leavesApi, type LeaveFilters } from '$lib/services/api/leaves';
import type { ApiError } from '$lib/types/api';
import { lovsApi } from '$lib/services/api';

export const load: PageLoad = async ({ url, params }) => {
  try {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;

    if (!user) {
      throw new Error('User not found in localStorage');
    }

    const filters: LeaveFilters = {
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 20,
      search: url.searchParams.get('search') || undefined,
      status: url.searchParams.get('status') || undefined,
      leaveType: url.searchParams.get('leaveType') || undefined,
      userId: url.searchParams.get('userId') || user._id
    };

    const sortBy = url.searchParams.get('sortBy');
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;

    const [summaryResponse, leavesResponse, leaveTypeIdResponse] = await Promise.all([
      leavesApi.getSummary(filters.userId || ''),
      leavesApi.myList(user._id, {
        ...filters,
        ...(sortBy && sortOrder && { sortBy, sortOrder })
      }),
      lovsApi.getByType('leaveType')
    ]);

    console.log(leavesResponse, "leavesResponse");
    console.log(summaryResponse, "summaryResponse");

    if (!leavesResponse.data || leavesResponse.data.length === 0) {
      return {
        leaves: [],
        summary: summaryResponse.data,
        pagination: {
          total: 0,
          page: 1,
          limit: filters.limit,
          totalPages: 1
        },
        filters,
        sort: sortBy && sortOrder ? { key: sortBy, direction: sortOrder } : null,
        leaveTypeId: leaveTypeIdResponse.data._id
      };
    }

    return {
      leaves: leavesResponse.data,
      summary: summaryResponse.data,
      pagination: {
        total: leavesResponse.meta?.total || 0,
        page: leavesResponse.meta?.page || 1,
        limit: leavesResponse.meta?.limit || 20,
        totalPages: leavesResponse.meta?.totalPages || 1
      },
      filters,
      sort: sortBy && sortOrder ? { key: sortBy, direction: sortOrder } : null,
      leaveTypeId: leaveTypeIdResponse.data._id
    };
  } catch (error) {
    console.error('Failed to load leaves:', error);

    // Attempt to fetch summary data even if leaves API call fails
    let summaryResponse;
    try {
      const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;
      summaryResponse = await leavesApi.getSummary(user._id);
    } catch (summaryError) {
      console.error('Failed to load summary:', summaryError);
        
          const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;
      let sampleSummary ={alloted:0,availed:0,remaining:0,leaveRequests:[]}
      summaryResponse = { data: {userId:user._id,
        year: new Date().getFullYear,
        annual: sampleSummary,
        sick: sampleSummary,
        compOff:sampleSummary,
        lossOfPay: sampleSummary,
        otherPaid:sampleSummary,
        otherUnpaid:sampleSummary
      } };
    }

    return {
      leaves: [],
      summary: null,
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1
      },
      filters: {
        page: 1,
        limit: 20,
        search: undefined,
        status: undefined,
        leaveType: undefined,
        userId: undefined
      },
      sort: null,
      leaveTypeId: null
    };
  }
};