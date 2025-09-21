"""
Simplified Face-Triggered Recording WebApp Component
Using built-in Python libraries for testing purposes
"""

import os
import cv2
import base64
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Optional
import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver
import threading
import time


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


class FaceDetectionHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the face detection web app"""
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/':
            self.serve_file('static/index.html', 'text/html')
        elif self.path.startswith('/static/'):
            file_path = self.path[1:]  # Remove leading slash
            if file_path.endswith('.html'):
                self.serve_file(file_path, 'text/html')
            elif file_path.endswith('.css'):
                self.serve_file(file_path, 'text/css')
            elif file_path.endswith('.js'):
                self.serve_file(file_path, 'application/javascript')
            else:
                self.send_error(404)
        elif self.path == '/api/health':
            self.send_json_response({
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "face_detector_loaded": face_cascade is not None
            })
        elif self.path == '/api/recordings':
            self.list_recordings()
        elif self.path.startswith('/api/download/'):
            filename = self.path.split('/')[-1]
            self.download_recording(filename)
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        if self.path == '/api/detect-face':
            self.detect_face(post_data)
        elif self.path == '/api/upload-recording':
            self.upload_recording(post_data)
        else:
            self.send_error(404)
    
    def do_DELETE(self):
        """Handle DELETE requests"""
        if self.path.startswith('/api/recordings/'):
            filename = self.path.split('/')[-1]
            self.delete_recording(filename)
        else:
            self.send_error(404)
    
    def serve_file(self, file_path, content_type):
        """Serve a static file"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404)
    
    def send_json_response(self, data, status_code=200):
        """Send a JSON response"""
        response = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(response))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(response)
    
    def detect_face(self, post_data):
        """Handle face detection request"""
        try:
            # Parse JSON data
            data = json.loads(post_data.decode('utf-8'))
            image_data = data.get('image_data', '')
            
            # Decode base64 image
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            
            # Convert to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                self.send_json_response({"error": "Invalid image data"}, 400)
                return
            
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
            
            response_data = {
                "faces_detected": len(faces),
                "face_detected": len(faces) > 0,
                "timestamp": datetime.now().isoformat(),
                "bounding_boxes": bounding_boxes
            }
            
            self.send_json_response(response_data)
            
        except Exception as e:
            self.send_json_response({"error": f"Face detection failed: {str(e)}"}, 500)
    
    def upload_recording(self, post_data):
        """Handle recording upload"""
        try:
            # Simple multipart parsing (for demo purposes)
            # In production, use proper multipart parsing library
            
            # Generate unique filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"recording_{timestamp}.webm"
            file_path = RECORDINGS_DIR / filename
            
            # For demo, assume the entire post_data is the file content
            # In reality, we'd need to parse multipart form data properly
            boundary_start = post_data.find(b'\r\n\r\n')
            if boundary_start != -1:
                file_content = post_data[boundary_start + 4:]
                boundary_end = file_content.rfind(b'\r\n--')
                if boundary_end != -1:
                    file_content = file_content[:boundary_end]
                
                # Save uploaded file
                with open(file_path, "wb") as f:
                    f.write(file_content)
                
                response_data = {
                    "message": "Recording uploaded successfully",
                    "filename": filename,
                    "file_size": len(file_content),
                    "timestamp": timestamp
                }
                
                self.send_json_response(response_data)
            else:
                self.send_json_response({"error": "Invalid file data"}, 400)
                
        except Exception as e:
            self.send_json_response({"error": f"Upload failed: {str(e)}"}, 500)
    
    def list_recordings(self):
        """List all recordings"""
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
            
            self.send_json_response({"recordings": recordings})
            
        except Exception as e:
            self.send_json_response({"error": f"Failed to list recordings: {str(e)}"}, 500)
    
    def download_recording(self, filename):
        """Download a recording file"""
        file_path = RECORDINGS_DIR / filename
        
        if not file_path.exists() or not file_path.is_file():
            self.send_error(404)
            return
        
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', 'video/webm')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            self.send_error(500)
    
    def delete_recording(self, filename):
        """Delete a recording file"""
        file_path = RECORDINGS_DIR / filename
        
        if not file_path.exists():
            self.send_json_response({"error": "Recording not found"}, 404)
            return
        
        try:
            file_path.unlink()
            self.send_json_response({"message": f"Recording {filename} deleted successfully"})
        except Exception as e:
            self.send_json_response({"error": f"Failed to delete recording: {str(e)}"}, 500)


def run_server(port=8000):
    """Run the HTTP server"""
    handler = FaceDetectionHandler
    httpd = HTTPServer(('', port), handler)
    print(f"Server running on http://localhost:{port}")
    print("Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")
        httpd.server_close()


if __name__ == "__main__":
    run_server()