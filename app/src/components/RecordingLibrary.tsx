import React, { useState } from 'react';
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
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recording {
  id: string;
  title: string;
  duration: string;
  size: string;
  timestamp: string;
  thumbnail: string;
  faceCount: number;
}

// Mock data
const mockRecordings: Recording[] = [
  {
    id: '1',
    title: 'Session 1',
    duration: '00:05:23',
    size: '45.2 MB',
    timestamp: '2 hours ago',
    thumbnail: '/placeholder.svg',
    faceCount: 1
  },
  {
    id: '2',
    title: 'Session 2',
    duration: '00:03:17',
    size: '28.9 MB',
    timestamp: '5 hours ago',
    thumbnail: '/placeholder.svg',
    faceCount: 2
  },
  {
    id: '3',
    title: 'Session 3',
    duration: '00:08:45',
    size: '67.3 MB',
    timestamp: '1 day ago',
    thumbnail: '/placeholder.svg',
    faceCount: 1
  },
  {
    id: '4',
    title: 'Session 4',
    duration: '00:02:11',
    size: '19.1 MB',
    timestamp: '2 days ago',
    thumbnail: '/placeholder.svg',
    faceCount: 3
  }
];

export function RecordingLibrary() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [recordings] = useState<Recording[]>(mockRecordings);

  const handlePlay = (id: string) => {
    console.log('Playing recording:', id);
  };

  const handleDownload = (id: string) => {
    console.log('Downloading recording:', id);
  };

  const handleDelete = (id: string) => {
    console.log('Deleting recording:', id);
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
        {recordings.length === 0 ? (
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
                    <div className="aspect-video bg-secondary/50 relative">
                      <img
                        src={recording.thumbnail}
                        alt={recording.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="glass"
                          size="icon"
                          onClick={() => handlePlay(recording.id)}
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
                          {recording.duration}
                        </div>
                        <div>{recording.size}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {recording.timestamp}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          variant="glass"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDownload(recording.id)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="glass"
                          size="icon"
                          className="h-7 w-7 hover:bg-destructive/80"
                          onClick={() => handleDelete(recording.id)}
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
                        <span>{recording.duration}</span>
                        <span>{recording.size}</span>
                        <span>{recording.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePlay(recording.id)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(recording.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={() => handleDelete(recording.id)}
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
        
        {recordings.length > 0 && (
          <div className="mt-6 text-center">
            <Button variant="outline">
              View All Recordings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}