export type Training = {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  trainingWindowStart: string;
  trainingWindowEnd: string;
  graceTimeInMinutes: number;
  maxParticipants: number;
  location: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';

}; 