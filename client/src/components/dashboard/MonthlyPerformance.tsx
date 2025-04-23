import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type PerformanceStats = {
  taskCompletionRate: number;
  customerSatisfaction: number;
  firstTimeFixRate: number;
};

export default function MonthlyPerformance() {
  const { data, isLoading } = useQuery<PerformanceStats>({
    queryKey: ['/api/dashboard/stats'],
    select: (data) => ({
      taskCompletionRate: data.taskCompletionRate,
      customerSatisfaction: data.customerSatisfaction,
      firstTimeFixRate: data.firstTimeFixRate,
    }),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm mt-4">
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-semibold">Monthly Performance</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm mt-4">
      <div className="p-4 border-b border-neutral-100">
        <h3 className="font-semibold">Monthly Performance</h3>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm text-neutral-600">Task Completion Rate</p>
              <p className="text-sm font-medium">{data?.taskCompletionRate || 0}%</p>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full">
              <div 
                className="h-full bg-success rounded-full" 
                style={{ width: `${data?.taskCompletionRate || 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm text-neutral-600">Customer Satisfaction</p>
              <p className="text-sm font-medium">{data?.customerSatisfaction || 0}%</p>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full">
              <div 
                className="h-full bg-primary-600 rounded-full" 
                style={{ width: `${data?.customerSatisfaction || 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm text-neutral-600">First-time Fix Rate</p>
              <p className="text-sm font-medium">{data?.firstTimeFixRate || 0}%</p>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full">
              <div 
                className="h-full bg-warning rounded-full" 
                style={{ width: `${data?.firstTimeFixRate || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
