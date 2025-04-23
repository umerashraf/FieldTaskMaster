import { useQuery } from "@tanstack/react-query";
import { 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  Package2,
  TrendingUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardStatsType = {
  todaysTaskCount: number;
  todaysTasksCompleted: number;
  todaysTasksPending: number;
  completedThisWeek: number;
  hoursLogged: number;
  weeklyHoursTarget: number;
  materialsUsed: number;
  lowStockCount: number;
  taskCompletionRate: number;
  customerSatisfaction: number;
  firstTimeFixRate: number;
};

export default function DashboardStats() {
  const { data, isLoading, error } = useQuery<DashboardStatsType>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-6 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 p-4 rounded-lg mb-6">
        <p className="text-red-800">Error loading dashboard statistics</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <div className="rounded-full bg-primary-100 p-2 mr-4">
            <ClipboardList className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Today's Tasks</p>
            <h4 className="text-xl font-semibold">{data.todaysTaskCount}</h4>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="flex">
              <span className="inline-block w-2 h-2 rounded-full bg-success mr-1"></span>
              <span className="text-xs text-neutral-600">{data.todaysTasksCompleted} Completed</span>
            </div>
            <div className="flex">
              <span className="inline-block w-2 h-2 rounded-full bg-warning mr-1"></span>
              <span className="text-xs text-neutral-600">{data.todaysTasksPending} Pending</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <div className="rounded-full bg-success bg-opacity-10 p-2 mr-4">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Completed This Week</p>
            <h4 className="text-xl font-semibold">{data.completedThisWeek}</h4>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-success mr-1" />
            <span className="text-xs text-success">15% increase from last week</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <div className="rounded-full bg-warning bg-opacity-10 p-2 mr-4">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Hours Logged</p>
            <h4 className="text-xl font-semibold">{data.hoursLogged.toFixed(1)}</h4>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center">
            <span className="inline-block w-full h-2 rounded-full bg-neutral-100">
              <span 
                className="inline-block h-full rounded-full bg-warning" 
                style={{ width: `${Math.min(100, (data.hoursLogged / data.weeklyHoursTarget) * 100)}%` }}
              ></span>
            </span>
          </div>
          <div className="mt-1 text-xs text-neutral-600 text-right">
            {Math.round((data.hoursLogged / data.weeklyHoursTarget) * 100)}% of weekly target
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <div className="rounded-full bg-primary-100 p-2 mr-4">
            <Package2 className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Materials Used</p>
            <h4 className="text-xl font-semibold">{data.materialsUsed}</h4>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100">
          {data.lowStockCount > 0 ? (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-error mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="text-xs text-error">{data.lowStockCount} items low in stock</span>
            </div>
          ) : (
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-success mr-1" />
              <span className="text-xs text-success">All items in stock</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
