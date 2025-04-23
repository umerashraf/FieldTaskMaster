import { Link } from "wouter";
import { format } from "date-fns";
import { MapPin, Calendar, Eye, Edit, Tag } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import TaskStatus from "@/components/common/TaskStatus";
import { Card } from "@/components/ui/card";
import { Task } from "@shared/schema";

type TaskCardProps = {
  task: Task & {
    assignedUsers?: { id: number; name: string; username: string }[];
  };
};

export default function TaskCard({ task }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
      default:
        return 'text-neutral-500';
    }
  };
  
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'Priority not set';
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm hover:shadow transition-shadow duration-200 task-card">
      <div className="p-4 border-b border-neutral-100">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{task.title}</h3>
          <div className="flex items-center gap-2">
            <TaskStatus status={task.status} />
            <div className="relative">
              <button className="text-neutral-400 hover:text-neutral-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center mt-2 text-sm text-neutral-600">
          <Calendar className="h-4 w-4 mr-1 text-neutral-500" />
          {format(new Date(task.scheduledDate), "MMM d, h:mm a")}
        </div>
        <div className="flex items-center mt-1 text-sm text-neutral-600">
          <MapPin className="h-4 w-4 mr-1 text-neutral-500" />
          {task.locationAddress}
        </div>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <p className="text-sm text-neutral-600 line-clamp-2">
            {task.description || "No description provided"}
          </p>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="mr-1 text-xs text-neutral-500">Progress:</span>
            <div className="w-24 h-1.5 bg-neutral-100 rounded-full">
              <div 
                className={`h-full rounded-full ${
                  task.status === 'completed' 
                    ? 'bg-success' 
                    : task.status === 'in_progress' 
                      ? 'bg-warning' 
                      : 'bg-neutral-300'
                }`}
                style={{ width: `${task.progress || 0}%` }}
              ></div>
            </div>
            <span className="ml-1 text-xs text-neutral-500">{task.progress || 0}%</span>
          </div>
          <div className="flex items-center">
            <Tag className={`h-4 w-4 mr-1 ${getPriorityColor(task.priority)}`} />
            <span className="text-xs text-neutral-500">{getPriorityLabel(task.priority)}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {task.assignedUsers && task.assignedUsers.length > 0 ? (
              task.assignedUsers.map((user) => (
                <Avatar key={user.id} className="h-8 w-8 border-2 border-white">
                  <AvatarFallback className="bg-neutral-200 text-xs font-medium">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))
            ) : (
              <span className="text-xs text-neutral-500 px-2">Unassigned</span>
            )}
          </div>
          <div className="flex space-x-2">
            <Link href={`/tasks/${task.id}`}>
              <button className="bg-primary-50 text-primary-600 p-2 rounded-md hover:bg-primary-100">
                <Eye className="h-5 w-5" />
              </button>
            </Link>
            <Link href={`/tasks/${task.id}/edit`}>
              <button className="bg-primary-50 text-primary-600 p-2 rounded-md hover:bg-primary-100">
                <Edit className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
