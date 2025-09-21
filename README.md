# Face-Triggered Recording WebApp Component

A web-based application component that automatically records video when a face is detected in the webcam feed. Built with FastAPI, MediaPipe, and WebRTC.

## Features

- Real-time face detection using MediaPipe
- Automatic video recording when faces are detected
- WebSocket-based communication for low latency
- Minimal, responsive UI
- RESTful API for integration with other applications

## Requirements

- Python 3.9+
- OpenCV
- MediaPipe
- FastAPI
- WebSocket support
- Modern web browser with WebRTC support

## Quick Start

### Using Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Face-Triggered-Recording-WebApp-Component.git
   cd Face-Triggered-Recording-WebApp-Component
   ```

2. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Open your browser and navigate to `http://localhost:8000`

### Manual Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Face-Triggered-Recording-WebApp-Component.git
   cd Face-Triggered-Recording-WebApp-Component
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

5. Open your browser and navigate to `http://localhost:8000`

## API Endpoints

- `POST /start` - Start face monitoring
- `POST /stop` - Stop monitoring/recording
- `GET /status` - Get current monitoring/recording status
- `GET /recordings` - List all recordings
- `GET /recordings/{filename}` - Download a specific recording

## Usage

1. Grant camera access when prompted
2. Click "Start Monitoring" to begin face detection
3. The app will automatically start recording when a face is detected
4. Recording stops after 5 seconds without a face in view
5. Use the recordings list to download your videos

## Project Structure

```
.
├── app/
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css
│   │   └── js/
│   │       └── app.js
│   ├── templates/
│   │   └── index.html
│   ├── face_detection.py
│   └── main.py
├── recordings/
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

## Configuration

Key settings can be adjusted in the following files:
- `app/face_detection.py`: Detection confidence threshold
- `app/main.py`: Recording timeout duration
- `app/static/js/app.js`: Frame capture settings

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request