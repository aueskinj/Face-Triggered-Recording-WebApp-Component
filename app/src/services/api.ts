import { StatusResponse, RecordingsResponse } from '../types/api';

const API_BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000';

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async startMonitoring(): Promise<{ status: string; monitoring: boolean }> {
    const response = await fetch(`${this.baseUrl}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to start monitoring');
    }
    
    return response.json();
  }

  async stopMonitoring(): Promise<{ status: string; monitoring: boolean }> {
    const response = await fetch(`${this.baseUrl}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to stop monitoring');
    }
    
    return response.json();
  }

  async getStatus(): Promise<StatusResponse> {
    const response = await fetch(`${this.baseUrl}/status`);
    
    if (!response.ok) {
      throw new Error('Failed to get status');
    }
    
    return response.json();
  }

  async getRecordings(): Promise<RecordingsResponse> {
    const response = await fetch(`${this.baseUrl}/recordings`);
    
    if (!response.ok) {
      throw new Error('Failed to get recordings');
    }
    
    return response.json();
  }

  async downloadRecording(filename: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/recordings/${encodeURIComponent(filename)}`);
    
    if (!response.ok) {
      throw new Error('Failed to download recording');
    }
    
    return response.blob();
  }

  async deleteRecording(filename: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/recordings/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete recording');
    }
    
    return response.json();
  }

  createWebSocket(): WebSocket {
    return new WebSocket(`${WS_BASE_URL}/ws`);
  }
}

export const apiService = new ApiService();