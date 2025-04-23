export type TaskPriority = 'high' | 'medium' | 'low';

type PriorityOption = {
  value: TaskPriority;
  label: string;
};

/**
 * Get all available task priority options
 */
export const getPriorityOptions = (): PriorityOption[] => {
  return [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];
};

/**
 * Get a priority label from its value
 */
export const getPriorityLabel = (priority: TaskPriority): string => {
  const option = getPriorityOptions().find(opt => opt.value === priority);
  return option ? option.label : 'Unknown';
};

/**
 * Get the color class for a specific priority
 */
export const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'high':
      return 'text-red-500 bg-red-50';
    case 'medium':
      return 'text-amber-500 bg-amber-50';
    case 'low':
    default:
      return 'text-green-500 bg-green-50';
  }
};

/**
 * Get priority value mapped to a numeric value for sorting
 */
export const getPriorityValue = (priority: TaskPriority): number => {
  switch (priority) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
    default:
      return 1;
  }
};
