import os
import cv2
import numpy as np
from datetime import datetime
from typing import List
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from face_detection import FaceDetector, VideoRecorder
from pathlib import Path

from face_detection import FaceDetector, VideoRecorder

# Initialize FastAPI app
app = FastAPI(title="Face-Triggered Recording WebApp")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Initialize recording directory
RECORDINGS_DIR = Path("recordings")
RECORDINGS_DIR.mkdir(exist_ok=True)

# Initialize face detector and video recorder
face_detector = FaceDetector(min_detection_confidence=0.5)
video_recorder = VideoRecorder(output_dir=str(RECORDINGS_DIR))

# Global state
monitoring = False
recording = False
no_face_frames = 0
MAX_NO_FACE_FRAMES = 75  # 5 seconds at 15 fps

@app.get("/")
async def home(request: Request):
    """Serve the main application page."""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/start")
async def start_monitoring():
    """Start face monitoring session."""
    global monitoring
    monitoring = True
    return {"status": "success", "monitoring": monitoring}

@app.post("/stop")
async def stop_monitoring():
    """Stop face monitoring session."""
    global monitoring, recording
    monitoring = False
    recording = False
    return {"status": "success", "monitoring": monitoring}

@app.get("/status")
async def get_status():
    """Get current monitoring and recording status."""
    return {
        "monitoring": monitoring,
        "recording": recording
    }

@app.get("/recordings")
async def list_recordings():
    """List all available recordings."""
    recordings = []
    for recording_file in RECORDINGS_DIR.glob("**/*.mp4"):
        rel_path = recording_file.relative_to(RECORDINGS_DIR)
        recordings.append({
            "filename": str(rel_path),
            "timestamp": datetime.fromtimestamp(recording_file.stat().st_mtime).isoformat(),
            "size": recording_file.stat().st_size
        })
    return {"recordings": recordings}

@app.get("/recordings/{filename:path}")
async def get_recording(filename: str):
    """Download a specific recording."""
    file_path = RECORDINGS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Recording not found")
    return FileResponse(file_path)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket connection for video stream processing."""
    global monitoring, recording, no_face_frames
    
    await websocket.accept()
    try:
        while monitoring:
            # Process incoming video frames
            data = await websocket.receive_bytes()
            
            # Decode image
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                continue
                
            # Run face detection
            face_detected, annotated_frame = face_detector.detect_faces(frame)
            
            if face_detected:
                no_face_frames = 0
                if not recording:
                    # Start recording
                    recording = True
                    video_recorder.start_recording(frame.shape)
            else:
                if recording:
                    no_face_frames += 1
                    if no_face_frames >= MAX_NO_FACE_FRAMES:
                        # Stop recording after timeout
                        recording = False
                        video_recorder.stop_recording()
                        no_face_frames = 0
            
            # Write frame if recording
            if recording:
                video_recorder.write_frame(annotated_frame)
            
            # Send status update to client
            await websocket.send_json({
                "recording": recording,
                "face_detected": face_detected
            })
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if recording:
            video_recorder.stop_recording()
            recording = False
        await websocket.close()