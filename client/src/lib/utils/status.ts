export type TaskStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

type StatusOption = {
  value: TaskStatus;
  label: string;
};

/**
 * Get all available task status options
 */
export const getStatusOptions = (): StatusOption[] => {
  return [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
};

/**
 * Get a status label from its value
 */
export const getStatusLabel = (status: TaskStatus): string => {
  const option = getStatusOptions().find(opt => opt.value === status);
  return option ? option.label : 'Unknown';
};

/**
 * Get the color class for a specific status
 */
export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'completed':
      return 'bg-success bg-opacity-10 text-success';
    case 'in_progress':
      return 'bg-warning bg-opacity-10 text-warning';
    case 'cancelled':
      return 'bg-error bg-opacity-10 text-error';
    case 'scheduled':
    default:
      return 'bg-neutral-200 text-neutral-800';
  }
};
