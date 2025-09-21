import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Square, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraPreviewProps {
  isDetectionActive: boolean;
  isRecording: boolean;
  onDetectionToggle: () => void;
  onRecordingToggle: () => void;
  detectedFaces: number;
}

export function CameraPreview({
  isDetectionActive,
  isRecording,
  onDetectionToggle,
  onRecordingToggle,
  detectedFaces
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isDetectionActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isDetectionActive]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setHasPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  return (
    <Card className="relative overflow-hidden bg-black">
      <div className="aspect-video relative">
        {isDetectionActive && hasPermission ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {detectedFaces > 0 && (
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className="bg-detection-active/20 backdrop-blur-md rounded-lg px-3 py-2 border border-detection-active/30">
                    <div className="flex items-center gap-2 text-detection-active">
                      <div className="w-2 h-2 bg-detection-active rounded-full animate-pulse" />
                      <span className="text-sm font-medium">
                        {detectedFaces} Face{detectedFaces !== 1 ? 's' : ''} Detected
                      </span>
                    </div>
                  </div>
                  
                  {isRecording && (
                    <div className="bg-recording-active/20 backdrop-blur-md rounded-lg px-3 py-2 border border-recording-active/30">
                      <div className="flex items-center gap-2 text-recording-active">
                        <Circle className="w-3 h-3 fill-current animate-pulse" />
                        <span className="text-sm font-medium">Recording</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Face Detection Boxes (simulated) */}
              {detectedFaces > 0 && (
                <div className="absolute inset-0">
                  <div 
                    className="absolute border-2 border-detection-box rounded-lg"
                    style={{
                      left: '35%',
                      top: '25%',
                      width: '30%',
                      height: '40%',
                    }}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/20">
            <div className="text-center">
              <CameraOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {hasPermission === false 
                  ? 'Camera access denied' 
                  : 'Camera inactive'
                }
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
        <Button
          variant={isDetectionActive ? "detection" : "secondary"}
          size="lg"
          onClick={onDetectionToggle}
          className={cn(
            "transition-all duration-300",
            isDetectionActive && "shadow-lg shadow-primary/25"
          )}
        >
          {isDetectionActive ? (
            <>
              <Camera className="w-5 h-5" />
              Stop Detection
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Start Detection
            </>
          )}
        </Button>
        
        <Button
          variant={isRecording ? "recording" : "glass"}
          size="lg"
          onClick={onRecordingToggle}
          disabled={!isDetectionActive}
          className={cn(
            "transition-all duration-300",
            isRecording && "shadow-lg shadow-recording-active/25"
          )}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5" />
              Stop Recording
            </>
          ) : (
            <>
              <Circle className="w-5 h-5" />
              Manual Record
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}