import { useState, useEffect, useRef } from "react";

type TimerState = 'idle' | 'running' | 'paused' | 'stopped';

export function useTimer() {
  const [time, setTime] = useState(0); // time in seconds
  const [state, setState] = useState<TimerState>('idle');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pauseTime, setPauseTime] = useState<Date | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0); // in milliseconds
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Format time as HH:MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };
  
  // Start the timer
  const startTimer = () => {
    if (state === 'running') return;
    
    const now = new Date();
    
    if (state === 'idle') {
      setStartTime(now);
      setTotalPausedTime(0);
    } else if (state === 'paused' && pauseTime) {
      // Calculate additional paused time
      const additionalPauseTime = now.getTime() - pauseTime.getTime();
      setTotalPausedTime(prevTime => prevTime + additionalPauseTime);
    }
    
    setState('running');
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Start a new interval
    intervalRef.current = setInterval(() => {
      if (!startTime) return;
      
      const elapsed = Math.floor(
        (new Date().getTime() - startTime.getTime() - totalPausedTime) / 1000
      );
      
      setTime(elapsed);
    }, 1000);
  };
  
  // Pause the timer
  const pauseTimer = () => {
    if (state !== 'running') return;
    
    setState('paused');
    setPauseTime(new Date());
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  // Stop the timer
  const stopTimer = () => {
    setState('stopped');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  // Reset the timer
  const resetTimer = () => {
    setState('idle');
    setTime(0);
    setStartTime(null);
    setPauseTime(null);
    setTotalPausedTime(0);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  // Get elapsed time in minutes (useful for timesheet entries)
  const getElapsedMinutes = (): number => {
    return Math.round(time / 60);
  };
  
  return {
    time,
    isRunning: state === 'running',
    isPaused: state === 'paused',
    isStopped: state === 'stopped',
    isIdle: state === 'idle',
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    formattedTime: formatTime(time),
    getElapsedMinutes,
    startTime,
  };
}
