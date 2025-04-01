import { writable } from 'svelte/store';

export type DataUnit = {
  name: string;
  apiName: string;
  description: string;
  object: any;
  fields: Array<any>;
  filters: Array<any>;
  filterLogic: string;
  sort: Array<any>;
  sortFields: Array<any>;
  limit: number;
  children: Array<any>;
  type: string;
  preview: any;
  id: string;
};

export const dataUnit = writable<DataUnit>({
  name: '',
  apiName: '',
  description: '',
  object: null,
  fields: [],
  filters: [],
  filterLogic: '',
  sort: [],
  sortFields: [],
  limit: 0,
  children: [],
  type: '',
  preview: null,
  id: '',
});