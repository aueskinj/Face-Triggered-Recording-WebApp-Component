import cv2
import mediapipe as mp
import numpy as np
from datetime import datetime
import os
from pathlib import Path
from typing import Optional, Tuple

class FaceDetector:
    def __init__(self, min_detection_confidence: float = 0.5):
        """Initialize the MediaPipe face detection pipeline."""
        self.mp_face_detection = mp.solutions.face_detection
        self.face_detection = self.mp_face_detection.FaceDetection(
            min_detection_confidence=min_detection_confidence
        )
        
    def detect_faces(self, frame: np.ndarray) -> Tuple[bool, np.ndarray]:
        """
        Detect faces in the given frame.
        
        Args:
            frame: RGB image as numpy array
            
        Returns:
            Tuple of (face_detected: bool, annotated_frame: np.ndarray)
        """
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the frame
        results = self.face_detection.process(rgb_frame)
        
        # Convert back to BGR for OpenCV
        frame = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
        
        face_detected = False
        
        if results.detections:
            face_detected = True
            for detection in results.detections:
                # Get bounding box coordinates
                bbox = detection.location_data.relative_bounding_box
                h, w, _ = frame.shape
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                width = int(bbox.width * w)
                height = int(bbox.height * h)
                
                # Draw bounding box
                cv2.rectangle(frame, (x, y), (x + width, y + height), (0, 255, 0), 2)
                
                # Add confidence score
                confidence = f"{int(detection.score[0] * 100)}%"
                cv2.putText(frame, confidence, (x, y - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        return face_detected, frame

class VideoRecorder:
    def __init__(self, output_dir: str = "recordings"):
        """Initialize the video recorder."""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.writer: Optional[cv2.VideoWriter] = None
        self.current_file: Optional[Path] = None
        
    def start_recording(self, frame_shape: Tuple[int, int]) -> None:
        """
        Start a new recording.
        
        Args:
            frame_shape: Tuple of (height, width) for the video frames
        """
        if self.writer is not None:
            return
            
        # Create date-based subdirectory
        date_dir = self.output_dir / datetime.now().strftime("%Y-%m-%d")
        date_dir.mkdir(exist_ok=True)
        
        # Create timestamp-based filename
        timestamp = datetime.now().strftime("%H-%M-%S")
        self.current_file = date_dir / f"recording_{timestamp}.mp4"
        
        # Initialize video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        self.writer = cv2.VideoWriter(
            str(self.current_file),
            fourcc,
            15.0,  # FPS
            (frame_shape[1], frame_shape[0])  # width, height
        )
        
    def write_frame(self, frame: np.ndarray) -> None:
        """Write a frame to the video file."""
        if self.writer is not None:
            self.writer.write(frame)
            
    def stop_recording(self) -> Optional[str]:
        """
        Stop the current recording and return the file path.
        
        Returns:
            Optional[str]: Path to the recorded video file, or None if no recording was active
        """
        if self.writer is None:
            return None
            
        self.writer.release()
        self.writer = None
        
        if self.current_file is not None:
            result = str(self.current_file)
            self.current_file = None
            return result
        return None