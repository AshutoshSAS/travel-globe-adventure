
import { TravelJourney, VideoConfig } from '../types';

export class VideoService {
  private journey: TravelJourney;
  private config: VideoConfig;
  
  constructor(journey: TravelJourney, config: VideoConfig = {
    width: 1280,
    height: 720,
    fps: 30,
    duration: 5 // seconds per location
  }) {
    this.journey = journey;
    this.config = config;
  }
  
  async generateVideo(): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        // Set canvas dimensions
        canvas.width = this.config.width;
        canvas.height = this.config.height;
        
        // Create a media stream from the canvas
        let mediaStream: MediaStream;
        try {
          mediaStream = canvas.captureStream(this.config.fps);
        } catch (error) {
          console.error('Error capturing canvas stream:', error);
          throw new Error('Your browser does not support canvas.captureStream()');
        }
        
        // Check if we have video tracks
        if (mediaStream.getVideoTracks().length === 0) {
          throw new Error('No video tracks were created');
        }
        
        // Create a media recorder
        let mediaRecorder: MediaRecorder;
        try {
          // Try with preferred codec first
          mediaRecorder = new MediaRecorder(mediaStream, {
            mimeType: 'video/webm;codecs=vp9'
          });
        } catch (e) {
          // Fallback to a more compatible format
          try {
            mediaRecorder = new MediaRecorder(mediaStream, {
              mimeType: 'video/webm'
            });
          } catch (error) {
            console.error('MediaRecorder is not supported:', error);
            throw new Error('Video recording is not supported in your browser');
          }
        }
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          if (chunks.length === 0) {
            reject(new Error('No video data was recorded'));
            return;
          }
          
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
        
        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          reject(new Error('Error recording video'));
        };
        
        // Start recording
        mediaRecorder.start();
        
        // Draw and animate the journey
        await this.drawJourneyFrames(ctx, canvas, mediaRecorder);
      } catch (error) {
        console.error('Error in generateVideo:', error);
        reject(error);
      }
    });
  }
  
  private async drawJourneyFrames(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement,
    mediaRecorder: MediaRecorder
  ): Promise<void> {
    // For each location in the journey
    for (let i = 0; i < this.journey.locations.length; i++) {
      const location = this.journey.locations[i];
      
      // Skip if no photos
      if (!location.photos || location.photos.length === 0) {
        continue;
      }
      
      // For each photo in the location
      for (let j = 0; j < location.photos.length; j++) {
        const photo = location.photos[j];
        
        // Draw black background first
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw location name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(location.name, canvas.width / 2, 60);
        
        // Draw the photo
        await this.drawPhotoWithTransition(ctx, photo.url, canvas.width, canvas.height);
        
        // Wait for the duration per photo
        await this.delay(this.config.duration * 1000 / location.photos.length);
      }
    }
    
    // Stop recording after all frames
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }
  
  private async drawPhotoWithTransition(
    ctx: CanvasRenderingContext2D, 
    url: string,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Calculate aspect ratio to fit image within canvas
        const scale = Math.min(
          canvasWidth / img.width,
          canvasHeight / img.height
        );
        
        const width = img.width * scale;
        const height = img.height * scale;
        
        // Center the image on canvas
        const x = (canvasWidth - width) / 2;
        const y = (canvasHeight - height) / 2;
        
        // Draw the image
        ctx.drawImage(img, x, y, width, height);
        resolve();
      };
      
      img.onerror = (error) => {
        console.error('Error loading image:', url, error);
        // Still resolve to continue with other images
        resolve();
      };
      
      img.src = url;
    });
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static createDownloadLink(blob: Blob, filename: string): string {
    const url = URL.createObjectURL(blob);
    return url;
  }
}
