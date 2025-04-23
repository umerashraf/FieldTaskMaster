import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTitle } from "@/lib/hooks/useTitle";
import { format } from "date-fns";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Tag, 
  Users,
  ArrowLeft,
  Edit,
  Navigation,
  Phone,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Task, Note, Photo, ProductUsage, Timesheet, ServiceSheet } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import TaskStatus from "@/components/common/TaskStatus";
import ServiceSheetComponent from "@/components/tasks/ServiceSheet";
import ProductsTable from "@/components/tasks/ProductsTable";
import PhotoUpload from "@/components/tasks/PhotoUpload";
import TaskTimer from "@/components/tasks/TaskTimer";
import { Skeleton } from "@/components/ui/skeleton";

type User = {
  id: number;
  name: string;
  username: string;
};

type TaskWithDetails = Task & {
  assignedUsers: User[];
  serviceSheet?: ServiceSheet;
  notes: Note[];
  photos: (Photo & { url: string })[];
  productUsage: (ProductUsage & { product: { id: number; name: string; unitPrice: number } })[];
  timesheets: Timesheet[];
  client?: { id: number; name: string } | null;
};

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const taskId = parseInt(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch task details
  const { data: task, isLoading, error } = useQuery<TaskWithDetails>({
    queryKey: [`/api/tasks/${taskId}`],
  });

  // Update task status mutation
  const updateTaskStatus = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Task updated",
        description: "The task status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task status.",
        variant: "destructive",
      });
    },
  });

  // Handle status change
  const handleStatusChange = (status: string) => {
    updateTaskStatus.mutate(status);
  };

  useTitle(task ? `${task.title} | Task Details` : "Task Details");

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50';
      case 'medium':
        return 'text-amber-500 bg-amber-50';
      case 'low':
      default:
        return 'text-green-500 bg-green-50';
    }
  };

  if (isLoading) {
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
        <Card>
          <CardContent className="p-6">
            <p className="text-neutral-600">
              The task you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button className="mt-4" onClick={() => navigate("/tasks")}>
              Return to Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate("/tasks")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-neutral-800">{task.title}</h2>
            <p className="text-neutral-500">Task #{task.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TaskStatus status={task.status} />
          <Button
            variant="outline"
            onClick={() => navigate(`/tasks/${task.id}/edit`)}
            className="flex items-center"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-medium text-neutral-800 mb-4">Task Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-neutral-500 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Scheduled Date</p>
                        <p className="text-sm text-neutral-600">
                          {format(new Date(task.scheduledDate), "PPP")}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {format(new Date(task.scheduledDate), "h:mm a")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-neutral-500 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-neutral-600">{task.locationName}</p>
                        <p className="text-sm text-neutral-600">{task.locationAddress}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 flex items-center text-primary-600"
                          onClick={() => {
                            // Encode the address for Google Maps URL
                            const encodedAddress = encodeURIComponent(task.locationAddress);
                            // Open Google Maps with the location
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                          }}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          Navigate
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Tag className="h-5 w-5 text-neutral-500 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Priority</p>
                        <Badge variant="outline" className={`${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-neutral-500 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Progress</p>
                        <div className="w-full mt-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              task.status === 'completed' 
                                ? 'bg-green-500' 
                                : task.status === 'in_progress' 
                                  ? 'bg-amber-500' 
                                  : 'bg-neutral-300'
                            }`}
                            style={{ width: `${task.progress || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">{task.progress || 0}% complete</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-neutral-800 mb-4">Assignment</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-neutral-500 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Assigned Technicians</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {task.assignedUsers && task.assignedUsers.length > 0 ? (
                            task.assignedUsers.map((user) => (
                              <div key={user.id} className="flex items-center bg-neutral-100 px-3 py-1.5 rounded-full">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className="text-xs">
                                    {user.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{user.name}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-neutral-500">No technicians assigned</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {task.client && (
                      <div className="flex items-start">
                        <div className="h-5 w-5 text-neutral-500 mt-0.5 mr-2 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Client</p>
                          <p className="text-sm text-neutral-600">{task.client.name}</p>
                          
                          {/* Fetch client details to get the phone */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 flex items-center text-primary-600"
                            onClick={async () => {
                              try {
                                // Fetch client details including phone number
                                const res = await fetch(`/api/clients/${task.client?.id}`);
                                if (!res.ok) throw new Error("Failed to get client details");
                                
                                const client = await res.json();
                                if (client && client.phone) {
                                  // Use tel: protocol to initiate a phone call
                                  window.open(`tel:${client.phone}`, '_self');
                                } else {
                                  alert("No phone number available for this client");
                                }
                              } catch (error) {
                                console.error("Error fetching client details:", error);
                                alert("Could not retrieve client phone information");
                              }
                            }}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call Client
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <div className="h-5 w-5 text-neutral-500 mt-0.5 mr-2 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-neutral-600">
                          {format(new Date(task.createdAt), "PPP")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-5 w-5 text-neutral-500 mt-0.5 mr-2 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-sm text-neutral-600">
                          {format(new Date(task.updatedAt), "PPP")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="font-medium text-neutral-800 mb-2">Description</h3>
                <p className="text-neutral-600 whitespace-pre-line">
                  {task.description || "No description provided."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="service-sheet">
            <TabsList className="mb-4">
              <TabsTrigger value="service-sheet">Service Sheet</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="service-sheet">
              <ServiceSheetComponent taskId={taskId} />
            </TabsContent>
            
            <TabsContent value="products">
              <ProductsTable taskId={taskId} />
            </TabsContent>
            
            <TabsContent value="photos">
              <PhotoUpload taskId={taskId} />
            </TabsContent>
            
            <TabsContent value="notes">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium text-neutral-800 mb-3">Notes</h3>
                  
                  {task.notes && task.notes.length > 0 ? (
                    <div className="space-y-3">
                      {task.notes.map((note) => (
                        <div key={note.id} className="bg-neutral-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback className="text-xs">
                                  {task.assignedUsers.find(u => u.id === note.userId)?.name.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {task.assignedUsers.find(u => u.id === note.userId)?.name || 'Unknown User'}
                              </span>
                            </div>
                            <span className="text-xs text-neutral-500">
                              {format(new Date(note.createdAt), "PP p")}
                            </span>
                          </div>
                          <p className="text-neutral-700 text-sm whitespace-pre-line">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-sm">No notes have been added yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <TaskTimer taskId={taskId} />
          
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-neutral-800 mb-3">Task Timeline</h3>
              
              <ol className="relative border-l border-neutral-200 ml-3">
                <li className="mb-6 ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-primary-100 rounded-full -left-3 ring-8 ring-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  <h3 className="flex items-center mb-1 text-sm font-semibold text-neutral-900">
                    Task Created
                  </h3>
                  <time className="block mb-2 text-xs font-normal leading-none text-neutral-500">
                    {format(new Date(task.createdAt), "PPP p")}
                  </time>
                </li>
                
                {task.status === 'in_progress' && (
                  <li className="mb-6 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-amber-100 rounded-full -left-3 ring-8 ring-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <h3 className="flex items-center mb-1 text-sm font-semibold text-neutral-900">
                      Task Started
                    </h3>
                    <time className="block mb-2 text-xs font-normal leading-none text-neutral-500">
                      {format(new Date(task.updatedAt), "PPP p")}
                    </time>
                  </li>
                )}
                
                {task.status === 'completed' && (
                  <li className="mb-6 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3 ring-8 ring-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <h3 className="flex items-center mb-1 text-sm font-semibold text-neutral-900">
                      Task Completed
                    </h3>
                    <time className="block mb-2 text-xs font-normal leading-none text-neutral-500">
                      {format(new Date(task.updatedAt), "PPP p")}
                    </time>
                  </li>
                )}
                
                {task.timesheets && task.timesheets.map((timesheet) => (
                  <li key={timesheet.id} className="mb-6 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <h3 className="flex items-center mb-1 text-sm font-semibold text-neutral-900">
                      Time Entry: {timesheet.durationMinutes} minutes
                    </h3>
                    <time className="block mb-2 text-xs font-normal leading-none text-neutral-500">
                      {format(new Date(timesheet.startTime), "PPP p")}
                    </time>
                    {timesheet.notes && (
                      <p className="text-xs text-neutral-600">{timesheet.notes}</p>
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
