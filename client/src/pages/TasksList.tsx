import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTitle } from "@/lib/hooks/useTitle";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import { Task } from "@shared/schema";
import { Button } from "@/components/ui/button";
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskCard from "@/components/tasks/TaskCard";
import Pagination from "@/components/common/Pagination";
import { Skeleton } from "@/components/ui/skeleton";

type TaskWithAssignedUsers = Task & {
  assignedUsers: {
    id: number;
    name: string;
    username: string;
  }[];
};

export default function TasksList() {
  useTitle("Tasks | FieldServe Pro");
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "today",
    priority: "all",
    search: "",
    sort: "date_desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Fetch tasks
  const { data: allTasks, isLoading, error } = useQuery<TaskWithAssignedUsers[]>({
    queryKey: ['/api/tasks'],
  });

  // Handle filter changes
  const handleFilterChange = (newFilters: {
    status?: string;
    dateRange?: string;
    priority?: string;
    search?: string;
    sort?: string;
  }) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Apply filters to tasks
  const filteredTasks = allTasks
    ? allTasks.filter((task) => {
        // Status filter
        if (filters.status !== "all" && task.status !== filters.status) {
          return false;
        }

        // Priority filter
        if (filters.priority !== "all" && task.priority !== filters.priority) {
          return false;
        }

        // Date range filter
        if (filters.dateRange !== "all") {
          const taskDate = new Date(task.scheduledDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          
          const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
          
          if (filters.dateRange === "today") {
            if (taskDate < today || taskDate >= tomorrow) return false;
          } else if (filters.dateRange === "this_week") {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            if (taskDate < weekStart || taskDate >= weekEnd) return false;
          } else if (filters.dateRange === "this_month") {
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            if (taskDate < monthStart || taskDate > monthEnd) return false;
          } else if (filters.dateRange === "last_month") {
            if (taskDate < lastMonthStart || taskDate > lastMonthEnd) return false;
          }
        }

        // Search filter
        if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }

        return true;
      })
    : [];

  // Sort filtered tasks
  const sortedTasks = filteredTasks.length
    ? [...filteredTasks].sort((a, b) => {
        if (filters.sort === "date_desc") {
          return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
        } else if (filters.sort === "date_asc") {
          return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        } else if (filters.sort === "priority") {
          const priorityValues = { high: 3, medium: 2, low: 1 };
          return (
            priorityValues[b.priority as keyof typeof priorityValues] -
            priorityValues[a.priority as keyof typeof priorityValues]
          );
        } else if (filters.sort === "status") {
          const statusValues = { in_progress: 3, scheduled: 2, completed: 1, cancelled: 0 };
          return (
            statusValues[b.status as keyof typeof statusValues] -
            statusValues[a.status as keyof typeof statusValues]
          );
        }
        return 0;
      })
    : [];

  // Pagination
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = sortedTasks.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">Tasks</h2>
          <p className="text-neutral-500 mt-1">Manage and track your service tasks</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => navigate("/tasks/new")} className="flex items-center">
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </div>
      </div>

      <TaskFilters onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-800">
            Error loading tasks. Please try again later.
          </p>
        </div>
      ) : (
        <>
          {paginatedTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-neutral-600 mb-4">No tasks match your filters.</p>
              <Button onClick={() => handleFilterChange({ status: "all", priority: "all", search: "" })}>
                Clear Filters
              </Button>
            </div>
          )}

          {sortedTasks.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedTasks.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  );
}
