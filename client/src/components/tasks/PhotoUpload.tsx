import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "@/lib/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/lib/hooks/useUpload";
import { Photo } from "@shared/schema";
import { Camera, Image, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PhotoUploadProps = {
  taskId: number;
};

export default function PhotoUpload({ taskId }: PhotoUploadProps) {
  const { user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMethod, setUploadingMethod] = useState<'camera' | 'gallery' | null>(null);
  
  const { 
    uploadFile, 
    isUploading, 
    takePicture, 
    isCameraAvailable, 
    requestCameraPermission 
  } = useUpload();

  // Get photos for this task
  const { data: photos, isLoading } = useQuery<(Photo & { url: string })[]>({
    queryKey: [`/api/tasks/${taskId}/photos`],
  });

  // Delete photo
  const deletePhoto = useMutation({
    mutationFn: async (photoId: number) => {
      await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/photos`] });
      toast({
        title: "Photo deleted",
        description: "The photo has been removed from the task.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle file selection from input
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // We're just handling one file at a time for simplicity
    const file = files[0];
    
    try {
      await uploadPhoto(file);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your photo.",
        variant: "destructive",
      });
    } finally {
      setUploadingMethod(null);
    }
  };

  // Handle camera photo capture
  const handleTakePhoto = async () => {
    setUploadingMethod('camera');
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        toast({
          title: "Camera access denied",
          description: "Please allow camera access to take photos.",
          variant: "destructive",
        });
        setUploadingMethod(null);
        return;
      }
      
      const file = await takePicture();
      if (file) {
        await uploadPhoto(file);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Camera error",
        description: "There was a problem accessing your camera.",
        variant: "destructive",
      });
    } finally {
      setUploadingMethod(null);
    }
  };

  // Handle gallery photo selection
  const handleSelectFromGallery = () => {
    setUploadingMethod('gallery');
    fileInputRef.current?.click();
  };

  // Upload the photo to the server
  const uploadPhoto = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to upload photos.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('taskId', taskId.toString());
    formData.append('userId', user.id.toString());
    
    try {
      await uploadFile('/api/photos/upload', formData);
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/photos`] });
      toast({
        title: "Photo uploaded",
        description: "Your photo has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  // Handle photo deletion
  const handleDeletePhoto = (photoId: number) => {
    deletePhoto.mutate(photoId);
  };

  const isProcessing = isUploading || deletePhoto.isPending;

  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-800 mb-3">Photos</h3>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : photos && photos.length > 0 ? (
              <>
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                    <img 
                      src={photo.url} 
                      alt="Task photo" 
                      className="w-full h-full object-cover rounded-lg" 
                    />
                    <button 
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      disabled={isProcessing}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-neutral-100"
                    >
                      <X className="h-4 w-4 text-neutral-700" />
                    </button>
                  </div>
                ))}
                <div className="aspect-square bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50">
                  <Image className="h-10 w-10 text-neutral-400" />
                  <span className="mt-2 text-sm text-neutral-500">Add Photo</span>
                </div>
              </>
            ) : (
              <div className="aspect-square bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 col-span-full md:col-span-1">
                <Image className="h-10 w-10 text-neutral-400" />
                <span className="mt-2 text-sm text-neutral-500">Add Photo</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTakePhoto}
              disabled={isProcessing || !isCameraAvailable}
              className="flex items-center"
            >
              {uploadingMethod === 'camera' && isProcessing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-1" />
              )}
              Take Photo
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleSelectFromGallery}
              disabled={isProcessing}
              className="flex items-center"
            >
              {uploadingMethod === 'gallery' && isProcessing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              Upload from Gallery
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept="image/*"
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
