export type Training = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}; 