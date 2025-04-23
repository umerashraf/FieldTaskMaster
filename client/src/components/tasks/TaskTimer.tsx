import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/lib/context/AppContext";
import { useTimer } from "@/lib/hooks/useTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timesheet } from "@shared/schema";
import { Play, Pause, StopCircle, Clock } from "lucide-react";

type TaskTimerProps = {
  taskId: number;
};

export default function TaskTimer({ taskId }: TaskTimerProps) {
  const { user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    time, 
    isRunning, 
    startTimer, 
    pauseTimer, 
    stopTimer, 
    resetTimer,
    formattedTime 
  } = useTimer();

  const [currentTimesheetId, setCurrentTimesheetId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Get task's timesheets
  const { data: timesheets } = useQuery<Timesheet[]>({
    queryKey: [`/api/timesheets?taskId=${taskId}`],
  });

  // Start a new timesheet
  const startTimesheet = useMutation({
    mutationFn: async (data: { taskId: number; userId: number; startTime: Date }) => {
      const response = await apiRequest('POST', '/api/timesheets', {
        taskId: data.taskId,
        userId: data.userId,
        startTime: data.startTime.toISOString(),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentTimesheetId(data.id);
      setStartTime(new Date(data.startTime));
      queryClient.invalidateQueries({ queryKey: [`/api/timesheets?taskId=${taskId}`] });
      toast({
        title: "Timer started",
        description: "The timer has been started for this task.",
      });
    },
    onError: (error: any) => {
      stopTimer();
      toast({
        title: "Error",
        description: error.message || "Failed to start the timer.",
        variant: "destructive",
      });
    },
  });

  // Update an existing timesheet (for pausing/stopping)
  const updateTimesheet = useMutation({
    mutationFn: async (data: { id: number; endTime?: Date; durationMinutes?: number }) => {
      const payload: any = {};
      if (data.endTime) payload.endTime = data.endTime.toISOString();
      if (data.durationMinutes !== undefined) payload.durationMinutes = data.durationMinutes;
      
      const response = await apiRequest('PATCH', `/api/timesheets/${data.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/timesheets?taskId=${taskId}`] });
      setCurrentTimesheetId(null);
      setStartTime(null);
      resetTimer();
      toast({
        title: "Timer stopped",
        description: "The time has been recorded for this task.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop the timer.",
        variant: "destructive",
      });
    },
  });

  // Handle timer start button
  const handleStartTimer = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to track time.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    setStartTime(now);
    startTimer();
    
    startTimesheet.mutate({
      taskId,
      userId: user.id,
      startTime: now,
    });
  };

  // Handle timer pause button
  const handlePauseTimer = () => {
    pauseTimer();
    // We're not recording pauses to the backend in this implementation
    // This could be extended to track multiple segments of time
  };

  // Handle timer stop button
  const handleStopTimer = () => {
    if (!currentTimesheetId || !startTime) return;
    
    stopTimer();
    const now = new Date();
    const durationMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    
    updateTimesheet.mutate({
      id: currentTimesheetId,
      endTime: now,
      durationMinutes,
    });
  };

  // Calculate total time logged for this task
  const calculateTotalTime = (): string => {
    if (!timesheets || timesheets.length === 0) return "00:00:00";
    
    const totalMinutes = timesheets.reduce((total, timesheet) => {
      return total + (timesheet.durationMinutes || 0);
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  const isPending = startTimesheet.isPending || updateTimesheet.isPending;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 text-center">
          <div className="text-3xl font-semibold">{isRunning ? formattedTime : calculateTotalTime()}</div>
          <div className="text-sm text-neutral-500 mt-1">
            {isRunning ? "Current session" : "Total time"}
          </div>
        </div>
        
        <div className="flex justify-center space-x-2">
          {!isRunning ? (
            <Button
              type="button"
              onClick={handleStartTimer}
              disabled={isPending}
              className="bg-primary-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-700 transition flex items-center"
            >
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={handlePauseTimer}
                disabled={isPending}
                variant="outline"
                className="flex items-center"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
              
              <Button
                type="button"
                onClick={handleStopTimer}
                disabled={isPending}
                variant="destructive"
                className="flex items-center"
              >
                <StopCircle className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </>
          )}
        </div>
        
        {timesheets && timesheets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <h4 className="font-medium text-sm mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Recent Time Entries
            </h4>
            <ul className="space-y-2 text-sm">
              {timesheets.slice(0, 3).map((timesheet) => (
                <li key={timesheet.id} className="flex justify-between items-center py-1 px-2 bg-neutral-50 rounded">
                  <span>
                    {timesheet.startTime 
                      ? new Date(timesheet.startTime).toLocaleDateString() 
                      : "Not recorded"}
                  </span>
                  <span className="font-medium">
                    {timesheet.durationMinutes 
                      ? `${Math.floor(timesheet.durationMinutes / 60)}h ${timesheet.durationMinutes % 60}m` 
                      : "In progress"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
