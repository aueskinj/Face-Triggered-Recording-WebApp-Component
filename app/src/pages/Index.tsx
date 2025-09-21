import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { CameraPreview } from '@/components/CameraPreview';
import { StatusPanel } from '@/components/StatusPanel';
import { RecordingLibrary } from '@/components/RecordingLibrary';

const Index = () => {
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('00:00:00');
  const [detectedFaces, setDetectedFaces] = useState(0);
  const [recordingCount, setRecordingCount] = useState(4);
  const [storageUsed, setStorageUsed] = useState('160.5 MB');

  // Simulate face detection
  useEffect(() => {
    if (!isDetectionActive) {
      setDetectedFaces(0);
      return;
    }

    const interval = setInterval(() => {
      // Simulate random face detection
      const faceCount = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
      setDetectedFaces(faceCount);
      
      // Auto-start recording when faces detected
      if (faceCount > 0 && !isRecording) {
        setIsRecording(true);
      }
      // Auto-stop recording when no faces for a while
      else if (faceCount === 0 && isRecording) {
        setTimeout(() => {
          if (detectedFaces === 0) {
            setIsRecording(false);
          }
        }, 3000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDetectionActive, isRecording, detectedFaces]);

  // Session timer
  useEffect(() => {
    if (!isDetectionActive) {
      setSessionDuration('00:00:00');
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      setSessionDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isDetectionActive]);

  const handleDetectionToggle = () => {
    setIsDetectionActive(!isDetectionActive);
    if (isDetectionActive) {
      setIsRecording(false);
    }
  };

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Camera Preview - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <CameraPreview
              isDetectionActive={isDetectionActive}
              isRecording={isRecording}
              onDetectionToggle={handleDetectionToggle}
              onRecordingToggle={handleRecordingToggle}
              detectedFaces={detectedFaces}
            />
          </div>
          
          {/* Status Panel */}
          <div className="lg:col-span-1">
            <StatusPanel
              isDetectionActive={isDetectionActive}
              isRecording={isRecording}
              sessionDuration={sessionDuration}
              recordingCount={recordingCount}
              storageUsed={storageUsed}
              detectedFaces={detectedFaces}
            />
          </div>
        </div>

        {/* Recording Library */}
        <RecordingLibrary />
      </main>
    </div>
  );
};

export default Index;
