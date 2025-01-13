export type LOVValue = {
  value: string;
  label: string;
  isActive: boolean;
};

export type LOV = {
  type: string;
  values: LOVValue[];
}; 