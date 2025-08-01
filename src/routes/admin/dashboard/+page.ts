import type { PageLoad } from './$types';
import { dashboardApi } from '$lib/services/api/admin-dashboard';
import type { ApiError } from '$lib/types/api';

export const load: PageLoad = async ({ fetch }) => {
  try {
    console.log('Starting API calls...');

    // Get metrics, attendance, and department data
    const [metricsResponse, attendanceResponse, departmentResponse] = await Promise.all([
      dashboardApi.getMetrics().catch(error => {
        console.error('Metrics API error:', error);
        return null;
      }),
      dashboardApi.getTodayAttendance().catch(error => {
        console.error('Attendance API error:', error);
        return null;
      }),
      dashboardApi.getDepartmentWiseEmployees().catch(error => {
        console.error('Department API error:', error);
        return null;
      })
    ]);

    console.log('Dashboard API response:', metricsResponse);
    console.log('Today Attendance API response:', attendanceResponse);
    console.log('Response type:', typeof metricsResponse);
    console.log('Response keys:', Object.keys(metricsResponse || {}));
    console.log('Is response an object:', metricsResponse && typeof metricsResponse === 'object');

    // Check if we have a valid response
    if (!metricsResponse || typeof metricsResponse !== 'object') {
      throw new Error('Invalid API response');
    }

    // Cast response to any since API returns data directly
    const responseData = metricsResponse as any;
    const attendanceData = attendanceResponse as any;
    const departmentData = departmentResponse as any;

    console.log('Response data keys:', Object.keys(responseData));
    console.log('Response data totalEmployees:', responseData.totalEmployees);
    console.log('Response data pendingApprovals:', responseData.pendingApprovals);
    console.log('Department data:', departmentData);
    console.log('Full response data:', JSON.stringify(responseData, null, 2));

    // Try to extract data from different possible response structures
    const metrics = {
      totalEmployees: responseData.totalEmployees || responseData.data?.totalEmployees || 0,
      pendingApprovals: {
        leaves: responseData.pendingApprovals?.leaves || responseData.data?.pendingApprovals?.leaves || 0,
        regularizations: responseData.pendingApprovals?.regularizations || responseData.data?.pendingApprovals?.regularizations || 0,
        overtime: responseData.pendingApprovals?.overtime || responseData.data?.pendingApprovals?.overtime || 0,
        total: responseData.pendingApprovals?.total || responseData.data?.pendingApprovals?.total || 0
      },
      payrollProcessed: {
        amount: responseData.payrollProcessed?.amount || responseData.data?.payrollProcessed?.amount || 0,
        count: responseData.payrollProcessed?.count || responseData.data?.payrollProcessed?.count || 0
      },
      departmentWiseEmployees: (responseData.departmentWiseEmployees || responseData.data?.departmentWiseEmployees || []).map((dept: any, index: number) => ({
        departmentName: dept.departmentName || dept.name || `Department ${index + 1}`,
        count: dept.count || 0
      })),
      todayAttendance: {
        present: attendanceData?.present || attendanceData?.data?.present || responseData.todayAttendance?.present || responseData.data?.todayAttendance?.present || 0,
        leave: attendanceData?.leave || attendanceData?.data?.leave || responseData.todayAttendance?.leave || responseData.data?.todayAttendance?.leave || 0,
        total: (attendanceData?.present || attendanceData?.data?.present || responseData.todayAttendance?.present || responseData.data?.todayAttendance?.present || 0) +
          (attendanceData?.leave || attendanceData?.data?.leave || responseData.todayAttendance?.leave || responseData.data?.todayAttendance?.leave || 0)
      },
      upcomingHolidays: responseData.upcomingHolidays || responseData.data?.upcomingHolidays || [],
      resignationStatus: responseData.resignationStatus || responseData.data?.resignationStatus || []
    };

    console.log('Processed metrics:', metrics);
    return { metrics };
  } catch (error) {
    console.error('Dashboard load error:', error);
    // Instead of throwing the error, return default data
    return {
      metrics: {
        totalEmployees: 0,
        pendingApprovals: {
          leaves: 0,
          regularizations: 0,
          overtime: 0,
          total: 0
        },
        payrollProcessed: {
          amount: 0,
          count: 0
        },
        departmentWiseEmployees: [],
        todayAttendance: {
          present: 0,
          leave: 0,
          total: 0
        },
        upcomingHolidays: [],
        resignationStatus: []
      }
    };
  }
}; 