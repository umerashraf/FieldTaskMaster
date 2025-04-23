import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ServiceSheet as ServiceSheetType } from "@shared/schema";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, FileCheck, FilePenLine } from "lucide-react";
import SignaturePad from "@/components/common/SignaturePad";
import { saveTaskPDF } from "@/lib/utils/pdf-generator";

type ServiceSheetProps = {
  taskId: number;
};

type ChecklistItem = {
  id: number;
  name: string;
  completed: boolean;
};

// Service types
const serviceTypes = [
  { value: "maintenance", label: "Regular Maintenance" },
  { value: "repair", label: "Repair" },
  { value: "installation", label: "Installation" },
  { value: "inspection", label: "Inspection" },
];

// Equipment types
const equipmentTypes = [
  { value: "hvac", label: "HVAC System" },
  { value: "electrical", label: "Electrical Panel" },
  { value: "plumbing", label: "Plumbing System" },
  { value: "security", label: "Security System" },
  { value: "kitchen", label: "Kitchen Equipment" },
];

// Default checklist items
const defaultChecklist: ChecklistItem[] = [
  { id: 1, name: "Inspect equipment", completed: false },
  { id: 2, name: "Test functionality", completed: false },
  { id: 3, name: "Clean components", completed: false },
  { id: 4, name: "Replace parts as needed", completed: false },
];

export default function ServiceSheet({ taskId }: ServiceSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [serviceType, setServiceType] = useState("maintenance");
  const [equipmentType, setEquipmentType] = useState("hvac");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist);
  const [techSignature, setTechSignature] = useState<string | null>(null);
  const [custSignature, setCustSignature] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSignatures, setShowSignatures] = useState(false);

  // Get existing service sheet if available
  const { data: serviceSheet, isLoading } = useQuery<ServiceSheetType>({
    queryKey: [`/api/tasks/${taskId}/service-sheet`]
  });
  
  // Use effect to populate form data when service sheet is loaded
  React.useEffect(() => {
    if (serviceSheet) {
      setServiceType(serviceSheet.serviceType);
      setEquipmentType(serviceSheet.equipmentType);
      setChecklist(serviceSheet.checklist as ChecklistItem[]);
      if (serviceSheet.technicianSignature) {
        setTechSignature(serviceSheet.technicianSignature);
      }
      if (serviceSheet.customerSignature) {
        setCustSignature(serviceSheet.customerSignature);
      }
      if (serviceSheet.customerName) {
        setCustomerName(serviceSheet.customerName);
      }
    }
  }, [serviceSheet]);

  // Create service sheet
  const createServiceSheet = useMutation({
    mutationFn: async (data: { taskId: number; serviceType: string; equipmentType: string; checklist: ChecklistItem[] }) => {
      const response = await apiRequest('POST', '/api/service-sheets', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/service-sheet`] });
      toast({
        title: "Service sheet created",
        description: "The service sheet has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service sheet.",
        variant: "destructive",
      });
    },
  });

  // Update service sheet
  const updateServiceSheet = useMutation({
    mutationFn: async (data: { id: number; serviceType: string; equipmentType: string; checklist: ChecklistItem[] }) => {
      const response = await apiRequest('PATCH', `/api/service-sheets/${data.id}`, {
        serviceType: data.serviceType,
        equipmentType: data.equipmentType,
        checklist: data.checklist,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/service-sheet`] });
      toast({
        title: "Service sheet updated",
        description: "The service sheet has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service sheet.",
        variant: "destructive",
      });
    },
  });

  // Handle saving the service sheet
  const handleSaveServiceSheet = () => {
    if (serviceSheet) {
      updateServiceSheet.mutate({
        id: serviceSheet.id,
        serviceType,
        equipmentType,
        checklist,
      });
    } else {
      createServiceSheet.mutate({
        taskId,
        serviceType,
        equipmentType,
        checklist,
      });
    }
  };

  // Handle checklist item toggle
  const toggleChecklistItem = (itemId: number) => {
    setChecklist(checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  // Save signatures
  const updateSignatures = useMutation({
    mutationFn: async (data: { 
      id: number;
      technicianSignature?: string | null;
      customerSignature?: string | null;
      customerName?: string | null;
    }) => {
      const response = await apiRequest('PATCH', `/api/service-sheets/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/service-sheet`] });
      toast({
        title: "Signatures saved",
        description: "The signatures have been saved successfully.",
      });
      setShowSignatures(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save signatures.",
        variant: "destructive",
      });
    },
  });

  // Handle signature save
  const handleSaveSignatures = () => {
    if (serviceSheet) {
      updateSignatures.mutate({
        id: serviceSheet.id,
        technicianSignature: techSignature,
        customerSignature: custSignature,
        customerName: customerName || null
      });
    } else {
      toast({
        title: "Error",
        description: "Please save the service sheet first before adding signatures.",
        variant: "destructive",
      });
    }
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    if (!serviceSheet) {
      toast({
        title: "Error",
        description: "Please save the service sheet first before generating a PDF.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Get task details
      const taskRes = await fetch(`/api/tasks/${taskId}`);
      if (!taskRes.ok) throw new Error("Failed to fetch task details");
      
      const task = await taskRes.json();
      
      // Add service sheet to task
      task.serviceSheet = {
        ...serviceSheet,
        checklist: checklist,
      };
      
      // Generate PDF
      saveTaskPDF(task);
      
      toast({
        title: "PDF Generated",
        description: "The service report has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF.",
        variant: "destructive",
      });
    }
  };

  const isPending = createServiceSheet.isPending || updateServiceSheet.isPending || updateSignatures.isPending;

  if (isLoading) {
    return (
      <div>
        <h3 className="text-lg font-medium text-neutral-800 mb-3">Service Sheet</h3>
        <Card>
          <CardContent className="p-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-800 mb-3">Service Sheet</h3>
      <Card>
        <CardContent className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Service Type</label>
            <Select
              value={serviceType}
              onValueChange={setServiceType}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Equipment</label>
            <Select
              value={equipmentType}
              onValueChange={setEquipmentType}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Checklist</label>
            <div className="space-y-2 border border-neutral-200 rounded-md p-3">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center">
                  <Checkbox
                    id={`check-${item.id}`}
                    checked={item.completed}
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                    disabled={isPending}
                  />
                  <label
                    htmlFor={`check-${item.id}`}
                    className="ml-2 block text-sm text-neutral-700 cursor-pointer"
                  >
                    {item.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={handleSaveServiceSheet}
              disabled={isPending}
              className="sm:w-auto"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {serviceSheet ? "Update Service Sheet" : "Create Service Sheet"}
            </Button>
            
            {serviceSheet && (
              <>
                <Button
                  onClick={() => setShowSignatures(!showSignatures)}
                  variant="outline"
                  className="sm:w-auto flex items-center"
                  type="button"
                >
                  <FilePenLine className="h-4 w-4 mr-2" />
                  {techSignature || custSignature ? "Edit Signatures" : "Add Signatures"}
                </Button>
                
                <Button
                  onClick={handleGeneratePDF}
                  variant="outline"
                  className="sm:w-auto flex items-center"
                  type="button"
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Generate PDF
                </Button>
              </>
            )}
          </div>
          
          {showSignatures && serviceSheet && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-4">Signatures</h4>
              
              <div className="space-y-6">
                <div>
                  <h5 className="text-sm font-medium text-neutral-700 mb-2">Technician Signature</h5>
                  <SignaturePad
                    onSave={(signature) => setTechSignature(signature)}
                    width={400}
                    height={150}
                  />
                  {techSignature && (
                    <div className="mt-2">
                      <img 
                        src={techSignature} 
                        alt="Technician Signature" 
                        className="border border-gray-300 rounded-md max-h-24"
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-neutral-700 mb-2">Customer Information</h5>
                  <div className="mb-4">
                    <label htmlFor="customerName" className="block text-sm text-neutral-600 mb-1">
                      Customer Name
                    </label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  
                  <h5 className="text-sm font-medium text-neutral-700 mb-2">Customer Signature</h5>
                  <SignaturePad
                    onSave={(signature) => setCustSignature(signature)}
                    width={400}
                    height={150}
                  />
                  {custSignature && (
                    <div className="mt-2">
                      <img 
                        src={custSignature} 
                        alt="Customer Signature" 
                        className="border border-gray-300 rounded-md max-h-24"
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <Button
                    onClick={handleSaveSignatures}
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateSignatures.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Signatures
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
