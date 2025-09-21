# Face-Triggered Recording WebApp Component

A web-based application component that automatically records video when a face is detected in the webcam feed. Built with FastAPI, MediaPipe, React, and WebRTC.

## Features

- **Real-time face detection** using MediaPipe
- **Automatic video recording** when faces are detected
- **WebSocket-based communication** for low latency
- **Modern, responsive UI** built with React and Tailwind CSS
- **RESTful API** for integration with other applications
- **Docker support** for easy deployment

## Requirements

- **Backend:**
  - Python 3.11+
  - OpenCV
  - MediaPipe
  - FastAPI
  - WebSocket support

- **Frontend:**
  - Node.js 18+
  - React 18+
  - TypeScript
  - Modern web browser with WebRTC support

## Quick Start

### Using Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aueskinj/Face-Triggered-Recording-WebApp-Component.git
   cd Face-Triggered-Recording-WebApp-Component
   ```

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Open your browser and navigate to:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`

### Manual Setup

#### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

#### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser to `http://localhost:3000`**

## Usage

1. **Grant camera access** when prompted by your browser
2. **Click "Start Detection"** to begin face monitoring
3. The app will **automatically start recording** when a face is detected
4. Recording **stops after 5 seconds** without a face in view
5. Use the **Recording Library** to view, download, or delete your videos

## API Endpoints

- `POST /start` - Start face monitoring
- `POST /stop` - Stop monitoring/recording
- `GET /status` - Get current monitoring/recording status
- `GET /recordings` - List all recordings
- `GET /recordings/{filename}` - Download a specific recording
- `DELETE /recordings/{filename}` - Delete a specific recording
- `WS /ws` - WebSocket endpoint for real-time video processing

## Project Structure

```
.
├── backend/                    # Python FastAPI backend
│   ├── main.py                # Main FastAPI application
│   ├── face_detection.py      # Face detection and recording logic
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile            # Backend Docker configuration
├── app/                       # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API and WebSocket services
│   │   ├── types/            # TypeScript type definitions
│   │   └── pages/            # Page components
│   ├── package.json          # Node.js dependencies
│   └── Dockerfile           # Frontend Docker configuration
├── recordings/               # Directory for stored recordings
├── docker-compose.yml       # Docker Compose configuration
└── README.md               # This file
```

## Configuration

### Backend Configuration

Key settings can be adjusted in `backend/main.py`:
- **Face detection confidence:** `min_detection_confidence` (default: 0.5)
- **Recording timeout:** `MAX_NO_FACE_FRAMES` (default: 75 frames / 5 seconds)
- **Video quality:** Frame rate and resolution settings

### Frontend Configuration

API endpoint can be configured in `app/src/services/api.ts`:
- **Backend URL:** `API_BASE_URL` (default: http://localhost:8000)

## Architecture

### Components

1. **Frontend (React/TypeScript)**
   - Modern UI with Tailwind CSS and shadcn/ui components
   - Real-time camera preview with detection overlays
   - Recording management interface
   - WebSocket communication for video streaming

2. **Backend (FastAPI)**
   - MediaPipe-based face detection
   - OpenCV video recording pipeline
   - WebSocket server for real-time processing
   - REST API for application control
   - File storage management

3. **Communication**
   - WebSocket for real-time video frame transmission
   - REST API for control operations and file management
   - CORS-enabled for cross-origin requests

### Data Flow

1. User grants camera access and starts detection
2. Frontend captures video frames and sends them via WebSocket to backend
3. Backend processes frames with MediaPipe face detection:
   - If face detected → Start/continue recording
   - If no face for 5 seconds → Stop recording
4. Backend stores videos in organized directory structure
5. Frontend displays real-time status and manages recordings

## Security Considerations

- **Camera permissions** are explicitly requested from the browser
- **No recording without user consent** - detection must be manually started
- **Local storage only** - videos are stored on the server filesystem
- **CORS protection** - configured for specific origins

## Performance

- **Real-time detection** target: <100ms per frame
- **Frame rate:** 15 FPS for optimal performance/quality balance
- **Video compression:** MP4 format with configurable quality
- **Lightweight models:** MediaPipe optimized for real-time processing

## Troubleshooting

### Common Issues

1. **Camera not working:**
   - Ensure browser has camera permissions
   - Check that no other application is using the camera
   - Try refreshing the page

2. **Backend connection issues:**
   - Verify backend is running on port 8000
   - Check firewall settings
   - Ensure WebSocket connections are allowed

3. **Recording issues:**
   - Check disk space for recordings directory
   - Verify write permissions for the backend process

### Development

For development, both frontend and backend support hot reloading:

```bash
# Backend with auto-reload
uvicorn main:app --reload

# Frontend with hot reloading
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for real-time face detection
- [FastAPI](https://fastapi.tiangolo.com/) for the high-performance backend
- [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/) for the modern frontend
- [OpenCV](https://opencv.org/) for video processing capabilities