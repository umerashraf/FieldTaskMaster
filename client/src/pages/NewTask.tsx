import { useTitle } from "@/lib/hooks/useTitle";
import TaskForm from "@/components/tasks/TaskForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NewTask() {
  useTitle("New Task | FieldServe Pro");
  const [, navigate] = useLocation();

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
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">New Task</h2>
          <p className="text-neutral-500 mt-1">Create a new service task</p>
        </div>
      </div>
      
      <TaskForm />
    </div>
  );
}
