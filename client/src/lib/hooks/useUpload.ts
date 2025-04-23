import { useState } from "react";

type UploadResult = {
  success: boolean;
  data?: any;
  error?: string;
};

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  
  /**
   * Check if the camera is available on the device
   */
  const isCameraAvailable = (): boolean => {
    return !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
  };
  
  /**
   * Request permission to use the camera
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    if (!isCameraAvailable()) {
      return false;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoStream(stream);
      return true;
    } catch (error) {
      console.error("Camera permission denied:", error);
      return false;
    }
  };
  
  /**
   * Take a picture using the device camera
   */
  const takePicture = async (): Promise<File | null> => {
    if (!videoStream) {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return null;
    }
    
    setIsCameraActive(true);
    
    return new Promise((resolve, reject) => {
      try {
        // Create a video element to display the stream
        const video = document.createElement('video');
        video.srcObject = videoStream!;
        video.play();
        
        // Wait for the video to be ready
        video.onloadedmetadata = () => {
          // Create a canvas to capture the image
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            stopCamera();
            reject(new Error("Could not get canvas context"));
            return;
          }
          
          // Draw the video frame to the canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert the canvas to a blob
          canvas.toBlob((blob) => {
            if (!blob) {
              stopCamera();
              reject(new Error("Could not create image blob"));
              return;
            }
            
            // Create a file from the blob
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            stopCamera();
            resolve(file);
          }, 'image/jpeg', 0.9);
        };
      } catch (error) {
        stopCamera();
        reject(error);
      }
    });
  };
  
  /**
   * Stop the camera stream
   */
  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsCameraActive(false);
  };
  
  /**
   * Upload a file to the server
   */
  const uploadFile = async (url: string, formData: FormData): Promise<UploadResult> => {
    setIsUploading(true);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Upload failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      setIsUploading(false);
      return { success: true, data };
    } catch (error) {
      setIsUploading(false);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred during upload'
      };
    }
  };
  
  return {
    uploadFile,
    isUploading,
    isCameraActive,
    isCameraAvailable,
    takePicture,
    requestCameraPermission,
    stopCamera,
  };
}
