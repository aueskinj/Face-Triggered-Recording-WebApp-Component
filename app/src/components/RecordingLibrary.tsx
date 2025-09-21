import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  Clock,
  FileVideo,
  Grid3X3,
  List,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/api';
import { RecordingItem as ApiRecordingItem } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

interface Recording extends ApiRecordingItem {
  id: string;
  title: string;
  faceCount: number;
}

export function RecordingLibrary() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadRecordings = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getRecordings();
      const formattedRecordings: Recording[] = response.recordings.map((recording, index) => {
        // Generate a title from filename
        const filename = recording.filename.split('/').pop() || recording.filename;
        const title = filename.replace(/\.[^/.]+$/, '').replace(/recording_/, 'Session ');
        
        return {
          ...recording,
          id: `${index}`,
          title,
          faceCount: Math.floor(Math.random() * 3) + 1, // Simulated for now
        };
      });
      setRecordings(formattedRecordings);
    } catch (error) {
      console.error('Failed to load recordings:', error);
      toast({
        title: "Error",
        description: "Failed to load recordings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  const handlePlay = (recording: Recording) => {
    // Create a temporary URL to play the video
    const videoUrl = `http://localhost:8000/recordings/${encodeURIComponent(recording.filename)}`;
    window.open(videoUrl, '_blank');
  };

  const handleDownload = async (recording: Recording) => {
    try {
      const blob = await apiService.downloadRecording(recording.filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = recording.filename.split('/').pop() || 'recording.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Recording downloaded successfully.",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download recording.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (recording: Recording) => {
    if (!confirm(`Are you sure you want to delete "${recording.title}"?`)) {
      return;
    }

    try {
      await apiService.deleteRecording(recording.filename);
      setRecordings(prev => prev.filter(r => r.id !== recording.id));
      toast({
        title: "Success",
        description: "Recording deleted successfully.",
      });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "Error",
        description: "Failed to delete recording.",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 60000) {
      return 'Just now';
    } else if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMs / 86400000);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="w-5 h-5" />
            Recent Recordings
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRecordings}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Loading recordings...</p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-8">
            <FileVideo className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No recordings yet</p>
            <p className="text-sm text-muted-foreground">Start detection to begin recording</p>
          </div>
        ) : (
          <div className={cn(
            "gap-4",
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" 
              : "space-y-3"
          )}>
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className={cn(
                  "group relative border rounded-lg overflow-hidden transition-all hover:shadow-md",
                  viewMode === 'list' && "flex items-center p-3"
                )}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Thumbnail */}
                    <div className="aspect-video bg-secondary/50 relative flex items-center justify-center">
                      <FileVideo className="w-8 h-8 text-muted-foreground" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="glass"
                          size="icon"
                          onClick={() => handlePlay(recording)}
                        >
                          <Play className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          {recording.faceCount}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-3 space-y-2">
                      <h4 className="font-medium text-sm">{recording.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recording.duration || '00:00'}
                        </div>
                        <div>{formatFileSize(recording.size)}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatTimestamp(recording.timestamp)}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          variant="glass"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDownload(recording)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="glass"
                          size="icon"
                          className="h-7 w-7 hover:bg-destructive/80"
                          onClick={() => handleDelete(recording)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="w-16 h-10 bg-secondary/50 rounded flex-shrink-0 flex items-center justify-center">
                      <FileVideo className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 ml-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{recording.title}</h4>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          <Eye className="w-3 h-3 mr-1" />
                          {recording.faceCount}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{recording.duration || '00:00'}</span>
                        <span>{formatFileSize(recording.size)}</span>
                        <span>{formatTimestamp(recording.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePlay(recording)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(recording)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={() => handleDelete(recording)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}