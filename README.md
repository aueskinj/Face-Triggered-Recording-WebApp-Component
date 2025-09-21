# Face-Triggered-Recording-WebApp-Component

A web-based application component that automatically detects faces via webcam and triggers video recording when a face is detected.

## Features

- **Real-time face detection** using OpenCV
- **Automatic video recording** when face movement is detected
- **Manual recording control** for testing purposes
- **WebRTC integration** for webcam access
- **File download functionality** for recorded videos
- **Minimal responsive UI** for easy testing and usage
- **Local storage** of recordings

## Technology Stack

### Backend
- **Python 3.9+** with OpenCV for face detection
- **HTTP server** for API endpoints (FastAPI alternative included)
- **Local disk storage** for recorded videos

### Frontend
- **HTML5** with responsive design
- **CSS3** with modern styling
- **Vanilla JavaScript** for webcam access and face detection
- **WebRTC API** for media capture
- **MediaRecorder API** for video recording

## Quick Start

### Prerequisites
- Python 3.9 or higher
- Webcam/camera access
- Modern web browser with WebRTC support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aueskinj/Face-Triggered-Recording-WebApp-Component.git
   cd Face-Triggered-Recording-WebApp-Component
   ```

2. **Install system dependencies (Ubuntu/Debian)**
   ```bash
   sudo apt update
   sudo apt install python3-opencv python3-numpy python3-pil
   ```

3. **Install Python dependencies (if FastAPI available)**
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

#### Option 1: FastAPI Server (Recommended)
```bash
python3 main.py
```

#### Option 2: Simple HTTP Server (Fallback)
```bash
python3 simple_server.py
```

The application will be available at `http://localhost:8000`

## Usage

1. **Start the Camera**: Click "Start Camera" to access your webcam
2. **Auto-Detection**: The app automatically detects faces and can trigger recording
3. **Manual Recording**: Use "Manual Record" button for manual control
4. **View Recordings**: Check the recordings list to download or manage files
5. **Settings**: Adjust detection interval, auto-record duration, and other preferences

## API Endpoints

### Face Detection
- `POST /api/detect-face` - Detects faces in uploaded image data
- `GET /api/health` - Health check endpoint

### Recording Management
- `POST /api/upload-recording` - Upload a recorded video
- `GET /api/recordings` - List all recordings
- `GET /api/download/{filename}` - Download a specific recording
- `DELETE /api/recordings/{filename}` - Delete a recording

### Static Files
- `GET /` - Main application interface
- `GET /static/*` - Static assets (CSS, JS, HTML)

## Configuration

The application supports several configurable options:

- **Detection Interval**: Time between face detection checks (100-2000ms)
- **Auto-Record**: Enable/disable automatic recording on face detection
- **Record Duration**: Duration for auto-recording (5-60 seconds)

## File Structure

```
Face-Triggered-Recording-WebApp-Component/
├── main.py                 # FastAPI server implementation
├── simple_server.py        # Simple HTTP server fallback
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── .gitignore            # Git ignore patterns
├── static/               # Frontend files
│   ├── index.html        # Main HTML interface
│   ├── style.css         # CSS styling
│   └── app.js           # JavaScript functionality
└── recordings/          # Directory for stored recordings (auto-created)
```

## Browser Compatibility

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: WebRTC support required
- **Edge**: Full support

## Security Considerations

- The app requires camera permissions in the browser
- Recordings are stored locally on the server
- No external data transmission (privacy-focused)
- CORS enabled for development (should be configured for production)

## Development

### Running in Development Mode
```bash
# With auto-reload (if uvicorn available)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Simple server
python3 simple_server.py
```

### Testing Face Detection
The application includes a health check endpoint to verify face detection functionality:
```bash
curl http://localhost:8000/api/health
```

## Troubleshooting

### Common Issues

1. **Camera Access Denied**: Ensure browser permissions allow camera access
2. **Face Detection Not Working**: Check if OpenCV is properly installed
3. **Recording Upload Fails**: Verify the recordings directory has write permissions
4. **Server Won't Start**: Check if port 8000 is available

### Debug Mode
Enable debug logging by setting the environment variable:
```bash
export DEBUG=1
python3 main.py
```

## License

This project is open source and available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues, questions, or contributions, please use the GitHub issue tracker.