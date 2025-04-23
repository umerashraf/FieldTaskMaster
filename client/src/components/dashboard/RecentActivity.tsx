import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { 
  CheckCircle,
  Clock,
  Image,
  MessageSquare
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Task, Timesheet, Note, Photo } from "@shared/schema";
import { Link } from "wouter";

type ActivityItem = {
  id: string;
  type: 'task_completed' | 'time_entry' | 'photo_upload' | 'note_added';
  taskId: number;
  taskTitle: string;
  timestamp: string;
  description: string;
};

export default function RecentActivity() {
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
  
  const { data: timesheets } = useQuery<Timesheet[]>({
    queryKey: ['/api/timesheets'],
    enabled: !!tasks,
  });
  
  // Only fetch recent notes and photos
  const { data: notes } = useQuery<Note[]>({
    queryKey: ['/api/tasks/1/notes'],
    enabled: !!tasks,
  });
  
  const { data: photos } = useQuery<Photo[]>({
    queryKey: ['/api/tasks/1/photos'],
    enabled: !!tasks,
  });
  
  const isLoading = !tasks || !timesheets;
  
  // Generate activity feed by combining and sorting different activity types
  const activities: ActivityItem[] = [];
  
  if (tasks && timesheets) {
    // Add completed tasks
    tasks
      .filter(task => task.status === 'completed')
      .forEach(task => {
        activities.push({
          id: `task-${task.id}`,
          type: 'task_completed',
          taskId: task.id,
          taskTitle: task.title,
          timestamp: task.updatedAt.toString(),
          description: `Completed successfully at ${format(new Date(task.updatedAt), 'h:mm a')}`
        });
      });
    
    // Add time entries
    timesheets.forEach(timesheet => {
      const task = tasks.find(t => t.id === timesheet.taskId);
      if (task) {
        activities.push({
          id: `timesheet-${timesheet.id}`,
          type: 'time_entry',
          taskId: task.id,
          taskTitle: task.title,
          timestamp: timesheet.createdAt.toString(),
          description: `Added ${timesheet.durationMinutes ? (timesheet.durationMinutes / 60).toFixed(1) + ' hours' : 'time entry'} for Task #${task.id} - ${task.title}`
        });
      }
    });
    
    // Add notes if available
    if (notes) {
      notes.forEach(note => {
        const task = tasks.find(t => t.id === note.taskId);
        if (task) {
          activities.push({
            id: `note-${note.id}`,
            type: 'note_added',
            taskId: task.id,
            taskTitle: task.title,
            timestamp: note.createdAt.toString(),
            description: `Added to Task #${task.id} - ${task.title}`
          });
        }
      });
    }
    
    // Add photos if available
    if (photos) {
      photos.forEach(photo => {
        const task = tasks.find(t => t.id === photo.taskId);
        if (task) {
          activities.push({
            id: `photo-${photo.id}`,
            type: 'photo_upload',
            taskId: task.id,
            taskTitle: task.title,
            timestamp: photo.uploadedAt.toString(),
            description: `${photos.length} photos added to Task #${task.id} - ${task.title}`
          });
        }
      });
    }
  }
  
  // Sort by timestamp, newest first
  const sortedActivities = activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 4); // Take only the 4 most recent activities

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
          <h3 className="font-semibold">Recent Activity</h3>
          <div className="w-16 h-5">
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
        <div className="p-4">
          <ul className="divide-y divide-neutral-100">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="py-3">
                <Skeleton className="h-16 w-full" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
        <h3 className="font-semibold">Recent Activity</h3>
        <Link href="/tasks" className="text-sm text-primary-600 hover:text-primary-700">
          View All
        </Link>
      </div>
      <div className="p-4">
        <ul className="divide-y divide-neutral-100">
          {sortedActivities.length > 0 ? (
            sortedActivities.map((activity) => (
              <li key={activity.id} className="py-3 flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center
                    ${activity.type === 'task_completed' ? 'bg-primary-100' : ''}
                    ${activity.type === 'time_entry' ? 'bg-warning bg-opacity-10' : ''}
                    ${activity.type === 'photo_upload' ? 'bg-primary-100' : ''}
                    ${activity.type === 'note_added' ? 'bg-neutral-100' : ''}
                  `}>
                    {activity.type === 'task_completed' && (
                      <CheckCircle className="h-4 w-4 text-primary-600" />
                    )}
                    {activity.type === 'time_entry' && (
                      <Clock className="h-4 w-4 text-warning" />
                    )}
                    {activity.type === 'photo_upload' && (
                      <Image className="h-4 w-4 text-primary-600" />
                    )}
                    {activity.type === 'note_added' && (
                      <MessageSquare className="h-4 w-4 text-neutral-600" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">
                    {activity.type === 'task_completed' && 'Task Completed'}
                    {activity.type === 'time_entry' && 'Time Entry'}
                    {activity.type === 'photo_upload' && 'New photos uploaded'}
                    {activity.type === 'note_added' && 'New note added'}
                    {' - '}
                    {activity.taskTitle}
                  </p>
                  <p className="text-sm text-neutral-500">{activity.description}</p>
                </div>
                <div className="ml-3 flex-shrink-0 text-right">
                  <p className="text-xs text-neutral-500">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))
          ) : (
            <li className="py-6 text-center text-neutral-500">
              <p>No recent activity</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
