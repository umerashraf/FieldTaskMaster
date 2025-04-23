import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { insertTaskSchema } from "@shared/schema";
import { getStatusOptions } from "@/lib/utils/status";
import { getPriorityOptions } from "@/lib/utils/priority";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Plus } from "lucide-react";

import ServiceSheet from "./ServiceSheet";
import ProductsTable from "./ProductsTable";
import PhotoUpload from "./PhotoUpload";
import TaskTimer from "./TaskTimer";

// Extended schema for the form
const taskFormSchema = insertTaskSchema
  .extend({
    scheduledDate: z.date(),
    scheduledTime: z.string(),
    assignedUserIds: z.array(z.number()).optional(),
  })
  .omit({ clientId: true });

type TaskFormValues = z.infer<typeof taskFormSchema>;

type TaskFormProps = {
  taskId?: number;
  defaultValues?: Partial<TaskFormValues>;
  isEditing?: boolean;
};

export default function TaskForm({ taskId, defaultValues, isEditing = false }: TaskFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedTechnicians, setSelectedTechnicians] = useState<{ id: number; name: string }[]>([]);

  // Get users for assignment
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: true,
  });

  // Get clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
    enabled: true,
  });

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest('POST', '/api/tasks', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Task created",
        description: "The task has been created successfully.",
      });
      navigate("/tasks");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      toast({
        title: "Task updated",
        description: "The task has been updated successfully.",
      });
      navigate(`/tasks/${taskId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // If editing, fetch task data
  const { data: taskData } = useQuery({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: !!taskId && isEditing,
  });

  // Prepare form with default values
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      locationName: "",
      locationAddress: "",
      scheduledDate: new Date(),
      scheduledTime: "09:00",
      status: "scheduled",
      priority: "medium",
      progress: 0,
      assignedUserIds: [],
      ...defaultValues,
    },
  });

  // Update form when task data is fetched for editing
  useEffect(() => {
    if (taskData && isEditing) {
      const scheduledDate = new Date(taskData.scheduledDate);
      const scheduledTime = format(scheduledDate, "HH:mm");

      form.reset({
        title: taskData.title,
        description: taskData.description || "",
        locationName: taskData.locationName,
        locationAddress: taskData.locationAddress,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        status: taskData.status,
        priority: taskData.priority,
        progress: taskData.progress || 0,
        assignedUserIds: taskData.assignedUsers?.map(user => user.id) || [],
      });

      // Set selected technicians
      if (taskData.assignedUsers) {
        setSelectedTechnicians(
          taskData.assignedUsers.map(user => ({
            id: user.id,
            name: user.name,
          }))
        );
      }
    }
  }, [taskData, isEditing, form]);

  // Handle form submission
  const onSubmit = (data: TaskFormValues) => {
    // Combine date and time
    const scheduledDateTime = new Date(data.scheduledDate);
    const [hours, minutes] = data.scheduledTime.split(':').map(Number);
    scheduledDateTime.setHours(hours, minutes);

    const formData = {
      ...data,
      scheduledDate: scheduledDateTime.toISOString(),
      assignedUserIds: selectedTechnicians.map(tech => tech.id),
    };

    // Remove fields not in API schema
    delete formData.scheduledTime;

    if (isEditing && taskId) {
      updateTask.mutate(formData);
    } else {
      createTask.mutate(formData);
    }
  };

  // Handle adding a technician
  const handleAddTechnician = (userId: number) => {
    if (!users) return;
    
    const user = users.find(u => u.id === Number(userId));
    if (!user) return;
    
    // Check if user is already selected
    if (selectedTechnicians.some(tech => tech.id === user.id)) return;
    
    setSelectedTechnicians([...selectedTechnicians, { id: user.id, name: user.name }]);
    
    // Update form value
    const currentIds = form.getValues("assignedUserIds") || [];
    form.setValue("assignedUserIds", [...currentIds, user.id]);
  };

  // Handle removing a technician
  const handleRemoveTechnician = (userId: number) => {
    setSelectedTechnicians(selectedTechnicians.filter(tech => tech.id !== userId));
    
    // Update form value
    const currentIds = form.getValues("assignedUserIds") || [];
    form.setValue("assignedUserIds", currentIds.filter(id => id !== userId));
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="scheduledTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getStatusOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getPriorityOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="locationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Client Office, Site A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="locationAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description"
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <FormItem>
              <FormLabel>Assigned Technicians</FormLabel>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTechnicians.map((tech) => (
                  <div 
                    key={tech.id} 
                    className="flex items-center bg-primary-50 px-3 py-1.5 rounded-full"
                  >
                    <span className="text-sm text-primary-700">{tech.name}</span>
                    <button 
                      type="button"
                      className="ml-2 text-primary-500 hover:text-primary-700"
                      onClick={() => handleRemoveTechnician(tech.id)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {users && users.length > 0 && (
                  <Select onValueChange={handleAddTechnician}>
                    <SelectTrigger className="px-3 py-1.5 h-auto border border-dashed border-neutral-300 rounded-full text-sm text-neutral-600 hover:bg-neutral-50 inline-flex w-auto">
                      <div className="flex items-center">
                        <Plus className="h-4 w-4 mr-1" />
                        <span>Add Technician</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </FormItem>
          </div>

          {/* Service Sheet Section */}
          {(isEditing && taskId) ? (
            <div className="col-span-1 md:col-span-2 mt-4">
              <ServiceSheet taskId={taskId} />
            </div>
          ) : (
            <div className="col-span-1 md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-neutral-800 mb-3">Service Sheet</h3>
              <Card>
                <CardContent className="p-4">
                  <p className="text-neutral-500 text-sm">
                    Service sheet will be available after task creation.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products Section */}
          {(isEditing && taskId) ? (
            <div className="col-span-1 md:col-span-2 mt-4">
              <ProductsTable taskId={taskId} />
            </div>
          ) : (
            <div className="col-span-1 md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-neutral-800 mb-3">Products</h3>
              <Card>
                <CardContent className="p-4">
                  <p className="text-neutral-500 text-sm">
                    Product selection will be available after task creation.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notes and Timer Section */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <h3 className="text-lg font-medium text-neutral-800 mb-3">Notes</h3>
              <Card>
                <CardContent className="p-4">
                  {isEditing && taskId ? (
                    <div className="space-y-4">
                      <Textarea
                        rows={4}
                        placeholder="Add notes here..."
                        className="w-full resize-none"
                      />
                      <Button type="button" size="sm">Add Note</Button>
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-sm">
                      Notes will be available after task creation.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-medium text-neutral-800 mb-3">Timer</h3>
              {isEditing && taskId ? (
                <TaskTimer taskId={taskId} />
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-neutral-500 text-sm">
                      Timer will be available after task creation.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Photo Upload Section */}
          {isEditing && taskId ? (
            <div className="col-span-1 md:col-span-2 mt-4">
              <PhotoUpload taskId={taskId} />
            </div>
          ) : (
            <div className="col-span-1 md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-neutral-800 mb-3">Photos</h3>
              <Card>
                <CardContent className="p-4">
                  <p className="text-neutral-500 text-sm">
                    Photo uploads will be available after task creation.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/tasks")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
