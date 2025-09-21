/**
 * Face-Triggered Recording WebApp - Frontend JavaScript
 * Handles webcam access, face detection communication, and video recording
 */

class FaceRecordingApp {
    constructor() {
        // DOM elements
        this.webcamVideo = document.getElementById('webcam');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Controls
        this.startCameraBtn = document.getElementById('start-camera');
        this.stopCameraBtn = document.getElementById('stop-camera');
        this.manualRecordBtn = document.getElementById('manual-record');
        this.refreshRecordingsBtn = document.getElementById('refresh-recordings');
        this.clearAllBtn = document.getElementById('clear-all');
        this.clearLogsBtn = document.getElementById('clear-logs');
        
        // Status elements
        this.faceStatus = document.getElementById('face-status');
        this.faceIndicator = document.getElementById('face-indicator');
        this.cameraStatus = document.getElementById('camera-status');
        this.recordingStatus = document.getElementById('recording-status');
        this.detectionStatus = document.getElementById('detection-status');
        
        // Settings
        this.detectionInterval = document.getElementById('detection-interval');
        this.intervalValue = document.getElementById('interval-value');
        this.autoRecord = document.getElementById('auto-record');
        this.recordDuration = document.getElementById('record-duration');
        this.durationValue = document.getElementById('duration-value');
        
        // Lists
        this.recordingsList = document.getElementById('recordings-list');
        this.logContainer = document.getElementById('log-container');
        
        // State
        this.stream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.faceDetectionActive = false;
        this.detectionTimer = null;
        this.recordingTimer = null;
        this.lastFaceDetected = false;
        
        this.initializeEventListeners();
        this.loadRecordings();
        this.log('Application initialized', 'info');
    }
    
    initializeEventListeners() {
        // Camera controls
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.stopCameraBtn.addEventListener('click', () => this.stopCamera());
        this.manualRecordBtn.addEventListener('click', () => this.toggleManualRecording());
        
        // Recording controls
        this.refreshRecordingsBtn.addEventListener('click', () => this.loadRecordings());
        this.clearAllBtn.addEventListener('click', () => this.clearAllRecordings());
        this.clearLogsBtn.addEventListener('click', () => this.clearLogs());
        
        // Settings
        this.detectionInterval.addEventListener('input', (e) => {
            this.intervalValue.textContent = `${e.target.value}ms`;
            this.restartFaceDetection();
        });
        
        this.recordDuration.addEventListener('input', (e) => {
            this.durationValue.textContent = `${e.target.value}s`;
        });
        
        this.autoRecord.addEventListener('change', (e) => {
            this.log(`Auto-recording ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });
    }
    
    async startCamera() {
        try {
            this.log('Starting camera...', 'info');
            
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: true
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.webcamVideo.srcObject = this.stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.webcamVideo.onloadedmetadata = resolve;
            });
            
            // Set canvas dimensions
            this.canvas.width = this.webcamVideo.videoWidth;
            this.canvas.height = this.webcamVideo.videoHeight;
            
            // Update UI
            this.updateCameraStatus('active');
            this.startCameraBtn.disabled = true;
            this.stopCameraBtn.disabled = false;
            this.manualRecordBtn.disabled = false;
            
            // Start face detection
            this.startFaceDetection();
            
            this.log('Camera started successfully', 'success');
            
        } catch (error) {
            this.log(`Failed to start camera: ${error.message}`, 'error');
            this.updateCameraStatus('error');
        }
    }
    
    stopCamera() {
        this.log('Stopping camera...', 'info');
        
        // Stop face detection
        this.stopFaceDetection();
        
        // Stop recording if active
        if (this.isRecording) {
            this.stopRecording();
        }
        
        // Stop camera stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.webcamVideo.srcObject = null;
        
        // Update UI
        this.updateCameraStatus('inactive');
        this.updateFaceStatus(false);
        this.startCameraBtn.disabled = false;
        this.stopCameraBtn.disabled = true;
        this.manualRecordBtn.disabled = true;
        
        this.log('Camera stopped', 'info');
    }
    
    startFaceDetection() {
        if (this.faceDetectionActive) return;
        
        this.faceDetectionActive = true;
        this.updateDetectionStatus('active');
        this.log('Face detection started', 'info');
        
        this.detectFace();
    }
    
    stopFaceDetection() {
        this.faceDetectionActive = false;
        if (this.detectionTimer) {
            clearTimeout(this.detectionTimer);
            this.detectionTimer = null;
        }
        this.updateDetectionStatus('inactive');
        this.updateFaceStatus(false);
        this.log('Face detection stopped', 'info');
    }
    
    restartFaceDetection() {
        if (this.faceDetectionActive) {
            this.stopFaceDetection();
            setTimeout(() => this.startFaceDetection(), 100);
        }
    }
    
    async detectFace() {
        if (!this.faceDetectionActive || !this.stream) return;
        
        try {
            // Capture frame from video
            this.ctx.drawImage(this.webcamVideo, 0, 0, this.canvas.width, this.canvas.height);
            const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
            
            // Send to backend for face detection
            const response = await fetch('/api/detect-face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image_data: imageData })
            });
            
            if (response.ok) {
                const result = await response.json();
                const faceDetected = result.face_detected;
                
                this.updateFaceStatus(faceDetected);
                
                // Handle auto-recording
                if (this.autoRecord.checked && faceDetected && !this.lastFaceDetected && !this.isRecording) {
                    this.startAutoRecording();
                }
                
                this.lastFaceDetected = faceDetected;
                
            } else {
                this.log('Face detection request failed', 'warning');
            }
            
        } catch (error) {
            this.log(`Face detection error: ${error.message}`, 'error');
        }
        
        // Schedule next detection
        const interval = parseInt(this.detectionInterval.value);
        this.detectionTimer = setTimeout(() => this.detectFace(), interval);
    }
    
    startAutoRecording() {
        this.log('Auto-recording triggered by face detection', 'info');
        this.startRecording();
        
        // Auto-stop after configured duration
        const duration = parseInt(this.recordDuration.value) * 1000;
        this.recordingTimer = setTimeout(() => {
            if (this.isRecording) {
                this.stopRecording();
                this.log('Auto-recording stopped after timeout', 'info');
            }
        }, duration);
    }
    
    toggleManualRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    startRecording() {
        if (!this.stream || this.isRecording) return;
        
        try {
            this.recordedChunks = [];
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'video/webm;codecs=vp9'
            });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.saveRecording();
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Update UI
            this.updateRecordingStatus('recording');
            this.manualRecordBtn.textContent = 'Stop Recording';
            this.manualRecordBtn.classList.add('recording');
            
            this.log('Recording started', 'success');
            
        } catch (error) {
            this.log(`Failed to start recording: ${error.message}`, 'error');
        }
    }
    
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        // Clear auto-recording timer
        if (this.recordingTimer) {
            clearTimeout(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        this.mediaRecorder.stop();
        this.isRecording = false;
        
        // Update UI
        this.updateRecordingStatus('inactive');
        this.manualRecordBtn.textContent = 'Manual Record';
        this.manualRecordBtn.classList.remove('recording');
        
        this.log('Recording stopped', 'info');
    }
    
    async saveRecording() {
        if (this.recordedChunks.length === 0) return;
        
        try {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('file', blob, 'recording.webm');
            
            this.log('Uploading recording...', 'info');
            
            const response = await fetch('/api/upload-recording', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                this.log(`Recording saved: ${result.filename}`, 'success');
                this.loadRecordings(); // Refresh the list
            } else {
                this.log('Failed to upload recording', 'error');
            }
            
        } catch (error) {
            this.log(`Failed to save recording: ${error.message}`, 'error');
        }
    }
    
    async loadRecordings() {
        try {
            const response = await fetch('/api/recordings');
            if (response.ok) {
                const data = await response.json();
                this.displayRecordings(data.recordings);
            } else {
                this.log('Failed to load recordings', 'error');
            }
        } catch (error) {
            this.log(`Failed to load recordings: ${error.message}`, 'error');
        }
    }
    
    displayRecordings(recordings) {
        if (recordings.length === 0) {
            this.recordingsList.innerHTML = '<p class="no-recordings">No recordings available</p>';
            return;
        }
        
        this.recordingsList.innerHTML = recordings.map(recording => `
            <div class="recording-item">
                <div class="recording-info">
                    <div class="recording-filename">${recording.filename}</div>
                    <div class="recording-meta">
                        Size: ${this.formatFileSize(recording.size)} | 
                        Created: ${new Date(recording.created).toLocaleString()}
                    </div>
                </div>
                <div class="recording-actions">
                    <a href="${recording.download_url}" class="btn btn-success btn-small" download>Download</a>
                    <button class="btn btn-danger btn-small" onclick="app.deleteRecording('${recording.filename}')">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    async deleteRecording(filename) {
        if (!confirm(`Delete recording ${filename}?`)) return;
        
        try {
            const response = await fetch(`/api/recordings/${filename}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.log(`Recording ${filename} deleted`, 'info');
                this.loadRecordings();
            } else {
                this.log(`Failed to delete recording ${filename}`, 'error');
            }
        } catch (error) {
            this.log(`Failed to delete recording: ${error.message}`, 'error');
        }
    }
    
    async clearAllRecordings() {
        if (!confirm('Delete all recordings? This cannot be undone.')) return;
        
        try {
            const response = await fetch('/api/recordings');
            if (response.ok) {
                const data = await response.json();
                
                for (const recording of data.recordings) {
                    await fetch(`/api/recordings/${recording.filename}`, {
                        method: 'DELETE'
                    });
                }
                
                this.log('All recordings cleared', 'info');
                this.loadRecordings();
            }
        } catch (error) {
            this.log(`Failed to clear recordings: ${error.message}`, 'error');
        }
    }
    
    updateCameraStatus(status) {
        this.cameraStatus.className = status === 'active' ? 'status-active' : 'status-inactive';
        this.cameraStatus.textContent = status === 'active' ? 'Active' : 
                                       status === 'error' ? 'Error' : 'Inactive';
    }
    
    updateRecordingStatus(status) {
        this.recordingStatus.className = status === 'recording' ? 'status-recording' : 'status-inactive';
        this.recordingStatus.textContent = status === 'recording' ? 'Recording' : 'Not Recording';
    }
    
    updateDetectionStatus(status) {
        this.detectionStatus.className = status === 'active' ? 'status-active' : 'status-inactive';
        this.detectionStatus.textContent = status === 'active' ? 'Active' : 'Inactive';
    }
    
    updateFaceStatus(detected) {
        this.faceStatus.textContent = detected ? 'Face detected' : 'No face detected';
        this.faceIndicator.className = `face-indicator ${detected ? 'detected' : 'not-detected'}`;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-level-${level}">[${level.toUpperCase()}]</span>
            ${message}
        `;
        
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
        
        // Keep only last 100 log entries
        while (this.logContainer.children.length > 100) {
            this.logContainer.removeChild(this.logContainer.firstChild);
        }
    }
    
    clearLogs() {
        this.logContainer.innerHTML = '';
        this.log('Logs cleared', 'info');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FaceRecordingApp();
});