class FaceRecorder {
    constructor() {
        this.videoElement = document.getElementById('videoElement');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.refreshRecordingsBtn = document.getElementById('refreshRecordingsBtn');
        this.recordingsList = document.getElementById('recordingsList');
        
        this.stream = null;
        this.websocket = null;
        this.isMonitoring = false;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.startMonitoring());
        this.stopBtn.addEventListener('click', () => this.stopMonitoring());
        this.refreshRecordingsBtn.addEventListener('click', () => this.loadRecordings());
    }

    async startMonitoring() {
        try {
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640,
                    height: 480,
                    frameRate: { ideal: 15, max: 30 }
                }
            });
            this.videoElement.srcObject = this.stream;

            // Start backend monitoring
            const response = await fetch('/start', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to start monitoring');

            // Setup WebSocket connection
            this.setupWebSocket();

            // Update UI
            this.isMonitoring = true;
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            
            // Start sending frames
            this.startFrameCapture();
        } catch (error) {
            console.error('Error starting monitoring:', error);
            alert('Failed to start monitoring. Please ensure camera access is granted.');
        }
    }

    async stopMonitoring() {
        try {
            // Stop backend monitoring
            await fetch('/stop', { method: 'POST' });

            // Cleanup
            if (this.websocket) {
                this.websocket.close();
                this.websocket = null;
            }
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            this.videoElement.srcObject = null;

            // Update UI
            this.isMonitoring = false;
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.recordingIndicator.classList.add('hidden');
        } catch (error) {
            console.error('Error stopping monitoring:', error);
        }
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.websocket = new WebSocket(`${protocol}//${window.location.host}/ws`);

        this.websocket.onopen = () => {
            console.log('WebSocket connection established');
        };

        this.websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.recording) {
                this.recordingIndicator.classList.remove('hidden');
            } else {
                this.recordingIndicator.classList.add('hidden');
            }
        };

        this.websocket.onclose = () => {
            console.log('WebSocket connection closed');
            if (this.isMonitoring) {
                this.stopMonitoring();
            }
        };

        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.stopMonitoring();
        };
    }

    async startFrameCapture() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 640;
        canvas.height = 480;

        const captureFrame = () => {
            if (!this.isMonitoring || !this.websocket) return;

            context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                    this.websocket.send(blob);
                }
            }, 'image/jpeg', 0.8);

            requestAnimationFrame(captureFrame);
        };

        captureFrame();
    }

    async loadRecordings() {
        try {
            const response = await fetch('/recordings');
            const data = await response.json();
            
            this.recordingsList.innerHTML = data.recordings.length > 0 
                ? data.recordings.map(recording => this.createRecordingElement(recording)).join('')
                : '<p>No recordings available</p>';
        } catch (error) {
            console.error('Error loading recordings:', error);
            this.recordingsList.innerHTML = '<p>Failed to load recordings</p>';
        }
    }

    createRecordingElement(recording) {
        const date = new Date(recording.timestamp).toLocaleString();
        const size = (recording.size / (1024 * 1024)).toFixed(2);
        return `
            <div class="recording-item">
                <div class="recording-info">
                    <div>${recording.filename}</div>
                    <div>Date: ${date}</div>
                    <div>Size: ${size} MB</div>
                </div>
                <a href="/recordings/${recording.filename}" 
                   class="recording-download" 
                   download>Download</a>
            </div>
        `;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FaceRecorder();
});