import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "wouter";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"week" | "day">(isMobile ? "day" : "week");
  
  // When mobile status changes, update view mode
  useEffect(() => {
    setViewMode(isMobile ? "day" : "week");
  }, [isMobile]);

  // Fetch tasks
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Navigation functions
  const goToPrevious = () => {
    setCurrentDate(prev => {
      if (viewMode === "day") {
        return addDays(prev, -1);
      } else {
        return addDays(prev, -7);
      }
    });
  };

  const goToNext = () => {
    setCurrentDate(prev => {
      if (viewMode === "day") {
        return addDays(prev, 1);
      } else {
        return addDays(prev, 7);
      }
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get days of current week
  const startDate = viewMode === "day" ? currentDate : startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = viewMode === "day" ? currentDate : endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Filter tasks for the current view (day or week)
  const visibleTasks = tasks.filter(task => {
    const taskDate = parseISO(task.scheduledDate.toString());
    if (viewMode === "day") {
      return isSameDay(taskDate, currentDate);
    } else {
      return days.some(day => isSameDay(day, taskDate));
    }
  });

  // Group tasks by day for week view
  const tasksByDay = days.map(day => {
    const dayTasks = tasks.filter(task => {
      const taskDate = parseISO(task.scheduledDate.toString());
      return isSameDay(taskDate, day);
    });
    return { day, tasks: dayTasks };
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "scheduled":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Format date range for header
  const dateRangeText = viewMode === "day" 
    ? format(currentDate, "MMMM d, yyyy") 
    : `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;

  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2" />
            Calendar
          </h1>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewMode(viewMode === "day" ? "week" : "day")}
            >
              {viewMode === "day" ? "Week View" : "Day View"}
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <Button variant="ghost" onClick={goToPrevious}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <CardTitle className="text-center">{dateRangeText}</CardTitle>
            
            <Button variant="ghost" onClick={goToNext}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </CardHeader>
          
          <CardContent>
            {viewMode === "day" ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {format(currentDate, "EEEE")}
                </h3>
                
                {visibleTasks.length === 0 ? (
                  <div className="text-center py-10 text-neutral-500">
                    No tasks scheduled for this day
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleTasks.map(task => (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <a className="block">
                          <Card className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-lg">{task.title}</h4>
                                  <p className="text-sm text-neutral-600 mt-1">
                                    {task.locationName}, {task.locationAddress}
                                  </p>
                                  <p className="text-xs text-neutral-500 mt-2">
                                    {format(parseISO(task.scheduledDate.toString()), "h:mm a")}
                                  </p>
                                </div>
                                <Badge className={`${getStatusColor(task.status)} text-white`}>
                                  {task.status.replace("_", " ")}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {tasksByDay.map(({ day, tasks }) => (
                  <div key={day.toString()} className="border rounded-md p-2">
                    <div className={`text-center p-2 rounded-md mb-2 ${
                      isSameDay(day, new Date()) ? "bg-primary-50 text-primary-700 font-bold" : ""
                    }`}>
                      <div>{format(day, "EEE")}</div>
                      <div className="text-lg">{format(day, "d")}</div>
                    </div>
                    
                    <div className="space-y-2">
                      {tasks.length === 0 ? (
                        <div className="text-center py-3 text-neutral-400 text-xs">No tasks</div>
                      ) : (
                        tasks.map(task => (
                          <Link key={task.id} href={`/tasks/${task.id}`}>
                            <a className="block">
                              <div 
                                className={`p-1.5 rounded text-xs ${getStatusColor(task.status)} text-white cursor-pointer`}
                                title={task.title}
                              >
                                <div className="truncate w-full">{task.title}</div>
                                <div className="text-white/80">
                                  {format(parseISO(task.scheduledDate.toString()), "h:mm a")}
                                </div>
                              </div>
                            </a>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}