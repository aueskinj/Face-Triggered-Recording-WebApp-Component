import os
import cv2
import numpy as np
import base64
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from face_detection import FaceDetector, VideoRecorder

# Initialize FastAPI app
app = FastAPI(title="Face-Triggered Recording WebApp")

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize recording directory
RECORDINGS_DIR = Path("recordings")
RECORDINGS_DIR.mkdir(exist_ok=True)

# Initialize face detector and video recorder
face_detector = FaceDetector(min_detection_confidence=0.5)
video_recorder = VideoRecorder(output_dir=str(RECORDINGS_DIR))

# Global state for session management
class SessionState:
    def __init__(self):
        self.monitoring = False
        self.recording = False
        self.no_face_frames = 0
        self.session_start_time = None
        self.last_detection_time = None
        self.total_faces_detected = 0

session_state = SessionState()

# Configuration
MAX_NO_FACE_FRAMES = 75  # 5 seconds at 15 fps

# Response models
class StatusResponse(BaseModel):
    monitoring: bool
    recording: bool
    session_duration: str = "00:00:00"
    faces_detected: int = 0

class RecordingItem(BaseModel):
    filename: str
    timestamp: str
    size: int
    duration: str = "00:00"

class RecordingsResponse(BaseModel):
    recordings: List[RecordingItem]
    total_count: int
    total_size: str

# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Face-Triggered Recording WebApp API", "status": "running"}

@app.post("/start")
async def start_monitoring():
    """Start face monitoring session."""
    session_state.monitoring = True
    session_state.session_start_time = datetime.now()
    session_state.total_faces_detected = 0
    return {"status": "success", "monitoring": session_state.monitoring}

@app.post("/stop")
async def stop_monitoring():
    """Stop face monitoring session."""
    session_state.monitoring = False
    if session_state.recording:
        video_recorder.stop_recording()
        session_state.recording = False
    session_state.session_start_time = None
    session_state.no_face_frames = 0
    return {"status": "success", "monitoring": session_state.monitoring}

@app.get("/status", response_model=StatusResponse)
async def get_status():
    """Get current monitoring and recording status."""
    session_duration = "00:00:00"
    if session_state.session_start_time:
        elapsed = datetime.now() - session_state.session_start_time
        hours = int(elapsed.total_seconds() // 3600)
        minutes = int((elapsed.total_seconds() % 3600) // 60)
        seconds = int(elapsed.total_seconds() % 60)
        session_duration = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    
    return StatusResponse(
        monitoring=session_state.monitoring,
        recording=session_state.recording,
        session_duration=session_duration,
        faces_detected=session_state.total_faces_detected
    )

@app.get("/recordings", response_model=RecordingsResponse)
async def list_recordings():
    """List all available recordings."""
    recordings = []
    total_size_bytes = 0
    
    for recording_file in RECORDINGS_DIR.glob("**/*.mp4"):
        if recording_file.is_file():
            rel_path = recording_file.relative_to(RECORDINGS_DIR)
            file_size = recording_file.stat().st_size
            total_size_bytes += file_size
            
            # Get file modification time
            timestamp = datetime.fromtimestamp(recording_file.stat().st_mtime)
            
            recordings.append(RecordingItem(
                filename=str(rel_path),
                timestamp=timestamp.isoformat(),
                size=file_size
            ))
    
    # Sort by timestamp (newest first)
    recordings.sort(key=lambda x: x.timestamp, reverse=True)
    
    # Format total size
    if total_size_bytes < 1024 * 1024:
        total_size = f"{total_size_bytes / 1024:.1f} KB"
    else:
        total_size = f"{total_size_bytes / (1024 * 1024):.1f} MB"
    
    return RecordingsResponse(
        recordings=recordings,
        total_count=len(recordings),
        total_size=total_size
    )

@app.get("/recordings/{filename:path}")
async def get_recording(filename: str):
    """Download a specific recording."""
    file_path = RECORDINGS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Recording not found")
    return FileResponse(file_path, media_type="video/mp4")

@app.delete("/recordings/{filename:path}")
async def delete_recording(filename: str):
    """Delete a specific recording."""
    file_path = RECORDINGS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Recording not found")
    
    try:
        file_path.unlink()
        return {"status": "success", "message": f"Recording {filename} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete recording: {str(e)}")

# WebSocket endpoint for real-time video processing
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket connection for video stream processing."""
    await websocket.accept()
    
    try:
        while True:
            # Check if monitoring is active
            if not session_state.monitoring:
                await websocket.send_json({
                    "type": "status",
                    "monitoring": False,
                    "recording": False,
                    "face_detected": False,
                    "face_count": 0
                })
                await asyncio.sleep(0.1)
                continue
            
            try:
                # Receive frame data from client
                data = await asyncio.wait_for(websocket.receive(), timeout=1.0)
                
                if data["type"] == "bytes":
                    # Decode base64 image data
                    image_data = data["bytes"]
                    
                    # Convert bytes to numpy array
                    nparr = np.frombuffer(image_data, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    if frame is None:
                        continue
                    
                    # Run face detection
                    face_detected, annotated_frame, face_count = face_detector.detect_faces(frame)
                    
                    if face_detected:
                        session_state.no_face_frames = 0
                        session_state.last_detection_time = datetime.now()
                        session_state.total_faces_detected = max(session_state.total_faces_detected, face_count)
                        
                        if not session_state.recording:
                            # Start recording
                            session_state.recording = True
                            video_recorder.start_recording(frame.shape)
                    else:
                        if session_state.recording:
                            session_state.no_face_frames += 1
                            if session_state.no_face_frames >= MAX_NO_FACE_FRAMES:
                                # Stop recording after timeout
                                session_state.recording = False
                                recorded_file = video_recorder.stop_recording()
                                session_state.no_face_frames = 0
                    
                    # Write frame if recording
                    if session_state.recording:
                        video_recorder.write_frame(annotated_frame)
                    
                    # Send status update to client
                    await websocket.send_json({
                        "type": "status",
                        "monitoring": session_state.monitoring,
                        "recording": session_state.recording,
                        "face_detected": face_detected,
                        "face_count": face_count
                    })
                    
                elif data["type"] == "text":
                    # Handle text messages (e.g., commands)
                    message = json.loads(data["text"])
                    if message.get("command") == "ping":
                        await websocket.send_json({"type": "pong"})
                        
            except asyncio.TimeoutError:
                # Send periodic status update even without frames
                await websocket.send_json({
                    "type": "status",
                    "monitoring": session_state.monitoring,
                    "recording": session_state.recording,
                    "face_detected": False,
                    "face_count": 0
                })
                
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Cleanup on disconnect
        if session_state.recording:
            video_recorder.stop_recording()
            session_state.recording = False

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)