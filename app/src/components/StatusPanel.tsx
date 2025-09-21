import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Video, 
  Clock, 
  Files, 
  HardDrive,
  Activity,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusPanelProps {
  isDetectionActive: boolean;
  isRecording: boolean;
  sessionDuration: string;
  recordingCount: number;
  storageUsed: string;
  detectedFaces: number;
}

export function StatusPanel({
  isDetectionActive,
  isRecording,
  sessionDuration,
  recordingCount,
  storageUsed,
  detectedFaces
}: StatusPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Detection Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Detection</span>
            </div>
            <Badge 
              variant={isDetectionActive ? "default" : "secondary"}
              className={cn(
                "transition-colors",
                isDetectionActive && "bg-detection-active text-white"
              )}
            >
              {isDetectionActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          {isDetectionActive && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{detectedFaces} face{detectedFaces !== 1 ? 's' : ''} detected</span>
            </div>
          )}
        </div>

        {/* Recording Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span className="text-sm font-medium">Recording</span>
            </div>
            <Badge 
              variant={isRecording ? "destructive" : "secondary"}
              className={cn(
                "transition-colors",
                isRecording && "bg-recording-active text-white animate-pulse"
              )}
            >
              {isRecording ? 'Recording' : 'Stopped'}
            </Badge>
          </div>
        </div>

        {/* Session Info */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Session Duration</span>
            </div>
            <span className="text-sm font-mono">{sessionDuration}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Files className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Recordings</span>
            </div>
            <span className="text-sm font-medium">{recordingCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Storage Used</span>
            </div>
            <span className="text-sm font-medium">{storageUsed}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{recordingCount}</div>
            <div className="text-xs text-muted-foreground">Total Files</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{storageUsed}</div>
            <div className="text-xs text-muted-foreground">Storage</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}