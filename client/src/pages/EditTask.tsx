import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTitle } from "@/lib/hooks/useTitle";
import TaskForm from "@/components/tasks/TaskForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditTask() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const taskId = parseInt(id);
  
  const { data: task, isLoading, error } = useQuery({
    queryKey: [`/api/tasks/${taskId}`],
  });

  useTitle(task ? `Edit ${task.title} | FieldServe Pro` : "Edit Task");

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate(`/tasks/${taskId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate("/tasks")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold text-neutral-800">Task Not Found</h2>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-800">
            The task you're trying to edit doesn't exist or you don't have permission to edit it.
          </p>
          <Button className="mt-4" onClick={() => navigate("/tasks")}>
            Return to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => navigate(`/tasks/${taskId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">Edit Task</h2>
          <p className="text-neutral-500 mt-1">{task.title}</p>
        </div>
      </div>
      
      <TaskForm taskId={taskId} isEditing={true} />
    </div>
  );
}
