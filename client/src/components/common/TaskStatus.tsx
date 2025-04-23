import { cn } from "@/lib/utils";

type TaskStatusProps = {
  status: string;
  className?: string;
};

export default function TaskStatus({ status, className }: TaskStatusProps) {
  const getStatusStyles = () => {
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

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'cancelled':
        return 'Cancelled';
      case 'scheduled':
      default:
        return 'Scheduled';
    }
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      getStatusStyles(),
      className
    )}>
      {getStatusText()}
    </span>
  );
}
