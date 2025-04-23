import { format, parseISO } from 'date-fns';

/**
 * Format a date object or ISO string to a readable date string
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date object or ISO string to a time string (HH:MM AM/PM)
 */
export const formatTime = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

/**
 * Format a date object or ISO string to a date and time string
 */
export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return 'Invalid date/time';
  }
};

/**
 * Format minutes to hours and minutes (Xh Ym)
 */
export const formatDuration = (minutes: number): string => {
  if (minutes === 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  
  return `${hours}h ${mins}m`;
};

/**
 * Calculate the duration between two dates in minutes
 */
export const calculateDuration = (startDate: Date | string, endDate: Date | string): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / 60000); // Convert ms to minutes
};