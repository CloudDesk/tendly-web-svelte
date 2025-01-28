import { fetchApi, type ListParams } from './base';
import type { Training } from '$lib/types';
import { toUTCDate, toUTCTime, fromUTCTime, fromUTCDate } from '$lib/utils/date';


function convertTrainingTimesToUTC<T extends { startTime?: string; endTime?: string; trainingWindowStart?: string; trainingWindowEnd?: string; validFrom?: string; validTill?: string }>(training: T): T {
  return {
    ...training,
    startTime: toUTCTime(training.startTime),
    endTime: toUTCTime(training.endTime),
    trainingWindowStart: toUTCTime(training.trainingWindowStart),
    trainingWindowEnd: toUTCTime(training.trainingWindowEnd),
    validFrom: toUTCDate(training.validFrom),
    validTill: toUTCDate(training.validTill)
  };
}

function convertTrainingTimesFromUTC<T extends { startTime?: string; endTime?: string; trainingWindowStart?: string; trainingWindowEnd?: string; validFrom?: string; validTill?: string }>(training: T): T {
  return {
    ...training,
    startTime: fromUTCTime(training.startTime),
    endTime: fromUTCTime(training.endTime),
    trainingWindowStart: fromUTCTime(training.trainingWindowStart),
    trainingWindowEnd: fromUTCTime(training.trainingWindowEnd),
    validFrom: fromUTCDate(training.validFrom),
    validTill: fromUTCDate(training.validTill)
  };
}

export const trainingsApi = {
  list: async (params: ListParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    console.log(queryParams.toString(), "queryparams")
    const response = await fetchApi<Training[]>(`/trainings?${queryParams.toString()}`);
    return {
      ...response,
      data: response.data.map(training => convertTrainingTimesFromUTC(training))
    };
  },
  getById: async (id: string) => {
    const response = await fetchApi<Training>(`/trainings/${id}`);
    return {
      ...response,
      data: convertTrainingTimesFromUTC(response.data)
    };
  },
  create: async (data: Omit<Training, '_id'>) => {
    const response = await fetchApi<Training>('/trainings', {
      method: 'POST',
      body: JSON.stringify(convertTrainingTimesToUTC(data))
    });
    return {
      ...response,
      data: convertTrainingTimesFromUTC(response.data)
    };
  },
  update: async (id: string, data: Partial<Training>) => {
    const response = await fetchApi<Training>(`/trainings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(convertTrainingTimesToUTC(data))
    });
    return {
      ...response,
      data: convertTrainingTimesFromUTC(response.data)
    };
  },
  delete: (id: string) =>
    fetchApi<void>(`/trainings/${id}`, {
      method: 'DELETE'
    }),
  assignEmployees: (
    trainingId: string,
    trainingCode: string,
    employeeIds: string[],
    validity: { validFrom: string; validTill?: string }
  ) => {
    // Convert dates to UTC at midnight
    const validFromDate = new Date(validity.validFrom);
    validFromDate.setHours(0, 0, 0, 0);
    const utcValidFrom = validFromDate.toISOString();

    let utcValidTill: string | undefined;
    if (validity.validTill) {
      const validTillDate = new Date(validity.validTill);
      validTillDate.setHours(23, 59, 59, 999);
      utcValidTill = validTillDate.toISOString();
    }

    return fetchApi<void>(`/trainings/${trainingId}/assign`, {
      method: 'POST',
      body: JSON.stringify({
        addUserIds: employeeIds,
        removeUserIds: [],
        trainingCode,
        startDate: utcValidFrom,
        endDate: utcValidTill
      })
    });
  }
}; 