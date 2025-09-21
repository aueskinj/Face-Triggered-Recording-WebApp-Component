"""
Face-Triggered Recording WebApp Component
FastAPI backend service for face detection and video recording management
"""

import os
import cv2
import base64
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# Initialize FastAPI app
app = FastAPI(
    title="Face-Triggered Recording API",
    description="API for face detection and automatic video recording",
    version="1.0.0"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create recordings directory
RECORDINGS_DIR = Path("recordings")
RECORDINGS_DIR.mkdir(exist_ok=True)

# Initialize face detector with fallback paths
face_cascade = None
cascade_paths = [
    '/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml',
    '/usr/share/opencv/haarcascades/haarcascade_frontalface_default.xml',
    'haarcascade_frontalface_default.xml'
]

for path in cascade_paths:
    if os.path.exists(path):
        face_cascade = cv2.CascadeClassifier(path)
        break

if face_cascade is None or face_cascade.empty():
    print("Warning: Could not load face cascade classifier")

# Models for API requests
class FaceDetectionRequest(BaseModel):
    image_data: str  # Base64 encoded image


class FaceDetectionResponse(BaseModel):
    faces_detected: int
    face_detected: bool
    timestamp: str
    bounding_boxes: list = []


@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page"""
    try:
        with open("static/index.html", "r") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(
            content="""
            <html>
                <body>
                    <h1>Face-Triggered Recording WebApp</h1>
                    <p>Frontend files not found. Please ensure static/index.html exists.</p>
                    <p>API is running at <a href="/docs">/docs</a></p>
                </body>
            </html>
            """
        )


@app.post("/api/detect-face", response_model=FaceDetectionResponse)
async def detect_face(request: FaceDetectionRequest):
    """
    Detect faces in the provided image data
    """
    try:
        # Decode base64 image
        image_data = request.image_data.split(",")[1] if "," in request.image_data else request.image_data
        image_bytes = base64.b64decode(image_data)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        # Convert bounding boxes to list format
        bounding_boxes = []
        for (x, y, w, h) in faces:
            bounding_boxes.append({
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h)
            })
        
        return FaceDetectionResponse(
            faces_detected=len(faces),
            face_detected=len(faces) > 0,
            timestamp=datetime.now().isoformat(),
            bounding_boxes=bounding_boxes
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face detection failed: {str(e)}")


@app.post("/api/upload-recording")
async def upload_recording(file: UploadFile = File(...)):
    """
    Upload and save a video recording
    """
    try:
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"recording_{timestamp}.webm"
        file_path = RECORDINGS_DIR / filename
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        return {
            "message": "Recording uploaded successfully",
            "filename": filename,
            "file_size": len(content),
            "timestamp": timestamp
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/api/recordings")
async def list_recordings():
    """
    List all available recordings
    """
    try:
        recordings = []
        for file_path in RECORDINGS_DIR.glob("*.webm"):
            stat = file_path.stat()
            recordings.append({
                "filename": file_path.name,
                "size": stat.st_size,
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "download_url": f"/api/download/{file_path.name}"
            })
        
        return {"recordings": recordings}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list recordings: {str(e)}")


@app.get("/api/download/{filename}")
async def download_recording(filename: str):
    """
    Download a specific recording file
    """
    file_path = RECORDINGS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Recording not found")
    
    if not file_path.is_file():
        raise HTTPException(status_code=400, detail="Invalid file")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="video/webm"
    )


@app.delete("/api/recordings/{filename}")
async def delete_recording(filename: str):
    """
    Delete a specific recording file
    """
    file_path = RECORDINGS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Recording not found")
    
    try:
        file_path.unlink()
        return {"message": f"Recording {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete recording: {str(e)}")


@app.get("/api/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "face_detector_loaded": face_cascade is not None
    }


# Mount static files
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
except RuntimeError:
    # Static directory doesn't exist yet, we'll create it later
    pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)