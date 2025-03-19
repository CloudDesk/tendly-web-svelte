export type LOVValue = {
  value: string;
  label: string;
  isActive: boolean;
};

export type LOV = {
  _id?: string;
  name: string;
  type: string;
  values: LOVValue[];
}; 