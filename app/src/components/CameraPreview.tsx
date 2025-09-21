import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Square, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { webSocketService } from '@/services/websocket';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [frameCapture, setFrameCapture] = useState<NodeJS.Timeout | null>(null);

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
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 15 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          startFrameCapture();
        };
      }
      
      setStream(mediaStream);
      setHasPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (frameCapture) {
      clearInterval(frameCapture);
      setFrameCapture(null);
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startFrameCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const captureFrame = () => {
      if (!videoRef.current || !webSocketService.isConnected) return;

      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob and send via WebSocket
      canvas.toBlob((blob) => {
        if (blob && webSocketService.isConnected) {
          blob.arrayBuffer().then((buffer) => {
            webSocketService.sendFrame(buffer);
          });
        }
      }, 'image/jpeg', 0.8);
    };

    // Capture frames at 15 FPS
    const interval = setInterval(captureFrame, 1000 / 15);
    setFrameCapture(interval);
  };

  return (
    <Card className="relative overflow-hidden bg-black">
      <div className="aspect-video relative">
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />
        
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
              
              {/* Face Detection Boxes (simulated positions) */}
              {detectedFaces > 0 && (
                <div className="absolute inset-0">
                  {Array.from({ length: Math.min(detectedFaces, 3) }).map((_, index) => (
                    <div 
                      key={index}
                      className="absolute border-2 border-detection-box rounded-lg"
                      style={{
                        left: `${35 + (index * 15)}%`,
                        top: `${25 + (index * 10)}%`,
                        width: '25%',
                        height: '35%',
                      }}
                    />
                  ))}
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
              {hasPermission === false && (
                <p className="text-xs text-muted-foreground mt-2">
                  Please allow camera access and refresh the page
                </p>
              )}
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
              Recording Active
            </>
          ) : (
            <>
              <Circle className="w-5 h-5" />
              Auto Recording
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}