export const toFixed = (num: number, fixed: number = 4) => {
  return parseFloat(num.toFixed(fixed));
};

export const toNumber = (value: any): number => {
  if (typeof value === 'number') {
    return value;
  }
  value = Number(value);
  return isNaN(value) ? 0 : value;
};

export const toInt = (value: any): number => {
  return Math.round(toNumber(value)) | 0;
};
