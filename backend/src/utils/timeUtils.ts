export const formatDate = (date: Date): string => {
  // Use local timezone to match frontend behavior
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentDate = (): string => {
  return formatDate(new Date());
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isPastDate = (dateString: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(dateString);
  return checkDate < today;
};

export const isFutureDate = (dateString: string): boolean => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const checkDate = new Date(dateString);
  return checkDate > today;
};
