export interface StatusResponse {
  monitoring: boolean;
  recording: boolean;
  session_duration: string;
  faces_detected: number;
}

export interface RecordingItem {
  filename: string;
  timestamp: string;
  size: number;
  duration?: string;
}

export interface RecordingsResponse {
  recordings: RecordingItem[];
  total_count: number;
  total_size: string;
}

export interface WebSocketMessage {
  type: 'status' | 'pong';
  monitoring?: boolean;
  recording?: boolean;
  face_detected?: boolean;
  face_count?: number;
}

export interface CameraSettings {
  width: number;
  height: number;
  frameRate: number;
}