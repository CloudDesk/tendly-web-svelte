import { writable } from 'svelte/store';

export type DataUnit = {
  name: string;
  apiName: string;
  description: string;
  object: any;
  fields: Array<any>;
  filters: Array<any>;
  filterLogic: string;
  sortFields: Array<any>;
  limit: number;
  _id?: string;
};

export const dataUnit = writable<DataUnit>({
  name: '',
  apiName: '',
  description: '',
  object: null,
  fields: [],
  filters: [],
  filterLogic: '',
  sortFields: [],
  limit: 0,
  _id: '',
});