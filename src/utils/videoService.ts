
import { TravelJourney, VideoConfig } from '../types';

export class VideoService {
  private journey: TravelJourney;
  private config: VideoConfig;
  
  constructor(journey: TravelJourney, config: VideoConfig = {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 5 // seconds per location
  }) {
    this.journey = journey;
    this.config = config;
  }
  
  async generateVideo(): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    canvas.width = this.config.width;
    canvas.height = this.config.height;
    
    const mediaStream = canvas.captureStream(this.config.fps);
    const mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: 'video/webm;codecs=vp9'
    });
    
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };
      
      mediaRecorder.start();
      
      // Draw each location's sequence
      this.animateJourney(ctx, mediaRecorder);
    });
  }
  
  private async animateJourney(ctx: CanvasRenderingContext2D, mediaRecorder: MediaRecorder) {
    const totalDuration = this.journey.locations.length * this.config.duration * 1000;
    const startTime = Date.now();
    
    const animate = async () => {
      const currentTime = Date.now() - startTime;
      const progress = currentTime / totalDuration;
      
      if (progress >= 1) {
        mediaRecorder.stop();
        return;
      }
      
      // Calculate current location index
      const locationIndex = Math.floor(progress * this.journey.locations.length);
      const location = this.journey.locations[locationIndex];
      
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      // Draw current location's photo
      if (location.photos.length > 0) {
        const photoIndex = Math.floor((currentTime % (this.config.duration * 1000)) / 1000 * location.photos.length / this.config.duration);
        const photo = location.photos[photoIndex];
        
        await this.drawPhoto(ctx, photo.url);
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  private async drawPhoto(ctx: CanvasRenderingContext2D, url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const scale = Math.max(this.config.width / img.width, this.config.height / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (this.config.width - width) / 2;
        const y = (this.config.height - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
        resolve();
      };
      img.src = url;
    });
  }
  
  static createDownloadLink(blob: Blob, filename: string): string {
    return URL.createObjectURL(blob);
  }
}
