import {
  format,
  parseISO,
  isToday,
  isThisWeek,
  isThisMonth,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  Locale,
  formatDistanceToNow
} from 'date-fns';

/**
 * Format a date to a localized string format
 */
export const formatDate = (
  date: Date | string,
  formatStr: string = 'PPP',
  locale?: Locale
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale });
};

/**
 * Format a time in 12-hour format
 */
export const formatTime = (
  date: Date | string,
  formatStr: string = 'h:mm a',
  locale?: Locale
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale });
};

/**
 * Format a date range as a string
 */
export const formatDateRange = (
  startDate: Date | string,
  endDate: Date | string,
  formatStr: string = 'MMM d',
  separator: string = ' - ',
  locale?: Locale
): string => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  return `${format(start, formatStr, { locale })}${separator}${format(end, formatStr, { locale })}`;
};

/**
 * Create date filtering ranges
 */
export const getDateRange = (range: 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom'): {
  start: Date;
  end: Date;
} => {
  const today = new Date();
  
  switch (range) {
    case 'today':
      return {
        start: startOfDay(today),
        end: endOfDay(today)
      };
    case 'this_week':
      return {
        start: startOfWeek(today, { weekStartsOn: 0 }),
        end: endOfWeek(today, { weekStartsOn: 0 })
      };
    case 'this_month':
      return {
        start: startOfMonth(today),
        end: endOfMonth(today)
      };
    case 'last_month':
      const lastMonth = addMonths(today, -1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      };
    case 'custom':
    default:
      return {
        start: startOfDay(today),
        end: endOfDay(today)
      };
  }
};

/**
 * Check if a date is within a range
 */
export const isWithinRange = (
  date: Date | string,
  start: Date | string,
  end: Date | string
): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const startObj = typeof start === 'string' ? parseISO(start) : start;
  const endObj = typeof end === 'string' ? parseISO(end) : end;
  
  return (isAfter(dateObj, startObj) || dateObj.getTime() === startObj.getTime()) && 
         (isBefore(dateObj, endObj) || dateObj.getTime() === endObj.getTime());
};

/**
 * Return a human-readable string representing the elapsed time
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

/**
 * Return a descriptive date string based on when the date is
 */
export const getDateDescription = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  } else if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE'); // Day of week
  } else if (isThisMonth(dateObj)) {
    return format(dateObj, 'MMMM d'); // Month and day
  } else {
    return format(dateObj, 'MMM d, yyyy'); // Full date
  }
};

/**
 * Combine date and time into a single Date object
 */
export const combineDateAndTime = (date: Date, time: string): Date => {
  const result = new Date(date);
  const [hours, minutes] = time.split(':').map(Number);
  
  result.setHours(hours, minutes, 0, 0);
  return result;
};
