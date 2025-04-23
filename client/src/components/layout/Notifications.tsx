import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { Link } from "wouter";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: 'task' | 'system' | 'alert';
  read: boolean;
  createdAt: string;
  taskId?: number;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // Fetch tasks to generate notifications
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Generate notifications based on tasks
  useEffect(() => {
    if (tasks.length > 0) {
      const newNotifications: Notification[] = [];

      // Today's tasks
      const todayTasks = tasks.filter(task => {
        const taskDate = parseISO(task.scheduledDate.toString());
        return isToday(taskDate);
      });

      if (todayTasks.length > 0) {
        newNotifications.push({
          id: 1,
          title: "Today's Tasks",
          message: `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} scheduled for today`,
          type: 'task',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Tasks with high priority
      const highPriorityTasks = tasks.filter(task => task.priority === 'high' && task.status !== 'completed');
      if (highPriorityTasks.length > 0) {
        newNotifications.push({
          id: 2,
          title: "High Priority Tasks",
          message: `You have ${highPriorityTasks.length} high priority task${highPriorityTasks.length > 1 ? 's' : ''} that need attention`,
          type: 'alert',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Overdue tasks
      const overdueTasks = tasks.filter(task => {
        const taskDate = parseISO(task.scheduledDate.toString());
        return taskDate < new Date() && task.status !== 'completed' && !isToday(taskDate);
      });
      
      if (overdueTasks.length > 0) {
        newNotifications.push({
          id: 3,
          title: "Overdue Tasks",
          message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
          type: 'alert',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Add individual task notifications
      todayTasks.forEach((task, index) => {
        newNotifications.push({
          id: 4 + index,
          title: "Task Reminder",
          message: `${task.title} at ${task.locationName}`,
          type: 'task',
          read: false,
          createdAt: new Date().toISOString(),
          taskId: task.id,
        });
      });

      // System notification
      newNotifications.push({
        id: 100,
        title: "System Update",
        message: "New features added: Calendar view, GPS navigation, and customer calling",
        type: 'system',
        read: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      });

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    }
  }, [tasks]);

  const formatNotificationDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    setUnreadCount(0);
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'task':
        return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
      case 'alert':
        return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
      case 'system':
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500"></div>;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 max-h-[500px] overflow-y-auto" align="end">
        <div className="p-3 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-neutral-500">
            No notifications
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-3 hover:bg-neutral-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                  if (notification.taskId) {
                    setOpen(false);
                  }
                }}
              >
                {notification.taskId ? (
                  <Link href={`/tasks/${notification.taskId}`}>
                    <a className="block">
                      <NotificationItem 
                        notification={notification} 
                        formatDate={formatNotificationDate} 
                        typeIcon={getTypeIcon(notification.type)} 
                      />
                    </a>
                  </Link>
                ) : (
                  <NotificationItem 
                    notification={notification} 
                    formatDate={formatNotificationDate} 
                    typeIcon={getTypeIcon(notification.type)} 
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({ 
  notification, 
  formatDate, 
  typeIcon 
}: { 
  notification: Notification;
  formatDate: (date: string) => string;
  typeIcon: JSX.Element;
}) {
  return (
    <div className="flex gap-3 cursor-pointer">
      <div className="mt-1">
        {typeIcon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <span className="text-xs text-neutral-500">
            {formatDate(notification.createdAt)}
          </span>
        </div>
        <p className="text-sm text-neutral-600 mt-1">{notification.message}</p>
      </div>
    </div>
  );
}