// Utility functions for time formatting
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = seconds / 60;
    if (minutes < 10) {
      return `${minutes.toFixed(1)} min`;
    } else {
      return `${Math.round(minutes)} min`;
    }
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  }
};

// Get the appropriate unit label for duration
export const getDurationUnit = (seconds: number): string => {
  if (seconds < 60) {
    return 'SECONDS';
  } else if (seconds < 3600) {
    return 'MINUTES';
  } else {
    return 'HOURS';
  }
};

// Format date to YYYY-MM-DD string using local timezone
export const formatDateToAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format date for display (e.g., "Monday, September 27, 2025")
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};