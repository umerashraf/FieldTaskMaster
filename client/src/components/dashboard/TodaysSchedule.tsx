import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { Task } from "@shared/schema";
import TaskStatus from "@/components/common/TaskStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

type TaskWithAssignedUsers = Task & {
  assignedUsers: {
    id: number;
    name: string;
    username: string;
  }[];
};

export default function TodaysSchedule() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: tasks, isLoading } = useQuery<TaskWithAssignedUsers[]>({
    queryKey: [`/api/tasks?date=${today.toISOString().split('T')[0]}`],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
          <h3 className="font-semibold">Today's Schedule</h3>
          <div className="w-16 h-5">
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sortedTasks = tasks
    ? [...tasks].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    : [];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
        <h3 className="font-semibold">Today's Schedule</h3>
        <Link href="/tasks" className="text-sm text-primary-600 hover:text-primary-700">
          View All
        </Link>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Task</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sortedTasks.length > 0 ? (
                sortedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {format(new Date(task.scheduledDate), "h:mm a")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{task.title}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{task.locationAddress}</td>
                    <td className="px-4 py-3 text-sm">
                      <TaskStatus status={task.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Link href={`/tasks/${task.id}`} className="text-primary-600 hover:text-primary-700 inline-flex items-center">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                    No tasks scheduled for today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
