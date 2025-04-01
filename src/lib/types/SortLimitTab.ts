// Ensure this file contains the necessary type definitions

// Define and export the DataUnit type
export type SortLimitTabTypes = {
    fields: { label: string }[];
    sortFields: { field: string; order: string }[];
    limit: number;
  };