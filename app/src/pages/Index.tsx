import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { CameraPreview } from '@/components/CameraPreview';
import { StatusPanel } from '@/components/StatusPanel';
import { RecordingLibrary } from '@/components/RecordingLibrary';
import { apiService } from '@/services/api';
import { webSocketService } from '@/services/websocket';
import { StatusResponse, WebSocketMessage } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('00:00:00');
  const [detectedFaces, setDetectedFaces] = useState(0);
  const [recordingCount, setRecordingCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Load initial status and recordings
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [status, recordings] = await Promise.all([
          apiService.getStatus(),
          apiService.getRecordings()
        ]);
        
        setIsDetectionActive(status.monitoring);
        setIsRecording(status.recording);
        setSessionDuration(status.session_duration);
        setDetectedFaces(status.faces_detected);
        setRecordingCount(recordings.total_count);
        setStorageUsed(recordings.total_size);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to the backend server. Please ensure it's running.",
          variant: "destructive",
        });
      }
    };

    loadInitialData();
  }, [toast]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'status') {
      setIsDetectionActive(message.monitoring || false);
      setIsRecording(message.recording || false);
      setDetectedFaces(message.face_count || 0);
    }
  }, []);

  // WebSocket connection handler
  const handleWebSocketConnection = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      toast({
        title: "Connection Lost",
        description: "Lost connection to the server. Attempting to reconnect...",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connected",
        description: "Successfully connected to the server.",
      });
    }
  }, [toast]);

  // Set up WebSocket connection
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await webSocketService.connect();
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    };

    connectWebSocket();

    const unsubscribeMessage = webSocketService.onMessage(handleWebSocketMessage);
    const unsubscribeConnection = webSocketService.onConnection(handleWebSocketConnection);

    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
      webSocketService.disconnect();
    };
  }, [handleWebSocketMessage, handleWebSocketConnection]);

  // Periodic status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [status, recordings] = await Promise.all([
          apiService.getStatus(),
          apiService.getRecordings()
        ]);
        
        setSessionDuration(status.session_duration);
        setRecordingCount(recordings.total_count);
        setStorageUsed(recordings.total_size);
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleDetectionToggle = async () => {
    try {
      if (isDetectionActive) {
        await apiService.stopMonitoring();
      } else {
        await apiService.startMonitoring();
      }
    } catch (error) {
      console.error('Failed to toggle detection:', error);
      toast({
        title: "Error",
        description: `Failed to ${isDetectionActive ? 'stop' : 'start'} detection.`,
        variant: "destructive",
      });
    }
  };

  const handleRecordingToggle = () => {
    // Manual recording toggle - this would need to be implemented in the backend
    toast({
      title: "Info",
      description: "Recording is automatically triggered by face detection.",
    });
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
