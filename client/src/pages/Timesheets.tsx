import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTitle } from "@/lib/hooks/useTitle";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { Timesheet, Task, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Calendar, 
  User as UserIcon,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type TimesheetWithDetails = Timesheet & {
  task?: Task;
  user?: User;
};

export default function Timesheets() {
  useTitle("Timesheets | FieldServe Pro");
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: 'startTime',
    direction: 'descending'
  });

  // Calculate week range
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 0 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch timesheets
  const { data: timesheets, isLoading } = useQuery<Timesheet[]>({
    queryKey: ['/api/timesheets'],
  });

  // Fetch tasks for task details
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: !!timesheets,
  });

  // Fetch users for filtering and user details
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!timesheets,
  });

  // Previous week
  const goToPreviousWeek = () => {
    const prevWeek = new Date(selectedWeek);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setSelectedWeek(prevWeek);
  };

  // Next week
  const goToNextWeek = () => {
    const nextWeek = new Date(selectedWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setSelectedWeek(nextWeek);
  };

  // Today
  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Combine timesheet data with task and user details
  const timesheetsWithDetails: TimesheetWithDetails[] = timesheets
    ? timesheets.map(timesheet => {
        const task = tasks?.find(t => t.id === timesheet.taskId);
        const user = users?.find(u => u.id === timesheet.userId);
        return { ...timesheet, task, user };
      })
    : [];

  // Filter timesheets by selected week and user
  const filteredTimesheets = timesheetsWithDetails.filter(timesheet => {
    const timesheetDate = new Date(timesheet.startTime);
    const isInSelectedWeek = 
      timesheetDate >= weekStart && 
      timesheetDate <= weekEnd;
    
    const isSelectedUser = 
      selectedUser === "all" || 
      timesheet.userId === parseInt(selectedUser);
    
    return isInSelectedWeek && isSelectedUser;
  });

  // Sort timesheets
  const sortedTimesheets = [...filteredTimesheets].sort((a, b) => {
    let comparison = 0;
    
    if (sortConfig.key === 'startTime') {
      comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    } else if (sortConfig.key === 'duration') {
      comparison = (a.durationMinutes || 0) - (b.durationMinutes || 0);
    } else if (sortConfig.key === 'task') {
      comparison = (a.task?.title || '').localeCompare(b.task?.title || '');
    } else if (sortConfig.key === 'user') {
      comparison = (a.user?.name || '').localeCompare(b.user?.name || '');
    }
    
    return sortConfig.direction === 'ascending' ? comparison : -comparison;
  });

  // Calculate weekly stats
  const calculateWeeklyStats = () => {
    const totalMinutes = filteredTimesheets.reduce((total, timesheet) => {
      return total + (timesheet.durationMinutes || 0);
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    const taskCount = new Set(filteredTimesheets.map(t => t.taskId)).size;
    
    return {
      totalTime: `${hours}h ${minutes}m`,
      taskCount,
      entryCount: filteredTimesheets.length,
    };
  };

  const weeklyStats = calculateWeeklyStats();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-800">Timesheets</h2>
        <p className="text-neutral-500 mt-1">Track and manage your time entries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Weekly Summary</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium">
                {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
              </h3>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-4">
              {daysOfWeek.map((day, index) => {
                const dayTimesheets = filteredTimesheets.filter(t => {
                  const date = new Date(t.startTime);
                  return date.getDate() === day.getDate() && 
                         date.getMonth() === day.getMonth() && 
                         date.getFullYear() === day.getFullYear();
                });
                
                const dayMinutes = dayTimesheets.reduce((total, t) => total + (t.durationMinutes || 0), 0);
                const hours = Math.floor(dayMinutes / 60);
                const minutes = dayMinutes % 60;
                
                const today = new Date();
                const isToday = day.getDate() === today.getDate() && 
                               day.getMonth() === today.getMonth() && 
                               day.getFullYear() === today.getFullYear();
                
                return (
                  <div 
                    key={index} 
                    className={`p-2 text-center rounded-lg ${
                      isToday ? 'bg-primary-50 border border-primary-200' : 'bg-neutral-50'
                    }`}
                  >
                    <p className="text-sm font-medium">{format(day, "EEE")}</p>
                    <p className={`text-xs ${isToday ? 'text-primary-600 font-medium' : 'text-neutral-500'}`}>
                      {format(day, "d")}
                    </p>
                    <p className="text-sm font-medium mt-2">
                      {dayMinutes > 0 ? `${hours}h ${minutes}m` : '-'}
                    </p>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-50 p-3 rounded-lg text-center">
                <p className="text-sm text-neutral-600">Total Time</p>
                <p className="text-xl font-semibold text-primary-600">{weeklyStats.totalTime}</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg text-center">
                <p className="text-sm text-neutral-600">Tasks Worked</p>
                <p className="text-xl font-semibold text-primary-600">{weeklyStats.taskCount}</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg text-center">
                <p className="text-sm text-neutral-600">Time Entries</p>
                <p className="text-xl font-semibold text-primary-600">{weeklyStats.entryCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">User</label>
                <Select
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users?.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Date Range</label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-semibold">Time Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => requestSort('startTime')}
                >
                  <div className="flex items-center">
                    Date/Time
                    {sortConfig.key === 'startTime' && (
                      sortConfig.direction === 'ascending' 
                        ? <ChevronUp className="ml-1 h-4 w-4" />
                        : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => requestSort('task')}
                >
                  <div className="flex items-center">
                    Task
                    {sortConfig.key === 'task' && (
                      sortConfig.direction === 'ascending' 
                        ? <ChevronUp className="ml-1 h-4 w-4" />
                        : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => requestSort('user')}
                >
                  <div className="flex items-center">
                    User
                    {sortConfig.key === 'user' && (
                      sortConfig.direction === 'ascending' 
                        ? <ChevronUp className="ml-1 h-4 w-4" />
                        : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer text-right"
                  onClick={() => requestSort('duration')}
                >
                  <div className="flex items-center justify-end">
                    Duration
                    {sortConfig.key === 'duration' && (
                      sortConfig.direction === 'ascending' 
                        ? <ChevronUp className="ml-1 h-4 w-4" />
                        : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sortedTimesheets.length > 0 ? (
                sortedTimesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                        <div>
                          <p className="font-medium text-sm">
                            {format(new Date(timesheet.startTime), "EEEE, MMMM d")}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {format(new Date(timesheet.startTime), "h:mm a")}
                            {timesheet.endTime ? ` - ${format(new Date(timesheet.endTime), "h:mm a")}` : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {timesheet.task ? (
                        <div>
                          <p className="font-medium text-sm">{timesheet.task.title}</p>
                          <p className="text-xs text-neutral-500 truncate max-w-[200px]">
                            {timesheet.task.locationName}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-neutral-500">
                          Task not found
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {timesheet.user ? (
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-2 text-neutral-500" />
                          <span className="text-sm">{timesheet.user.name}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-sm">Unknown user</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-primary-50 text-primary-700 hover:bg-primary-100">
                        {timesheet.durationMinutes 
                          ? `${Math.floor(timesheet.durationMinutes / 60)}h ${timesheet.durationMinutes % 60}m` 
                          : "In progress"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-neutral-500">
                    No time entries for the selected period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
