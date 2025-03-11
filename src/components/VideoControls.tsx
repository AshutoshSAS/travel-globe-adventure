
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Download, 
  RefreshCw, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  Film
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useTravelContext } from '../context/TravelContext';
import { TravelStage } from '../types';
import { VideoService } from '../utils/videoService';

const VideoControls: React.FC = () => {
  const { currentJourney, setCurrentStage, isGeneratingVideo } = useTravelContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const updateProgress = () => {
      if (videoElement.duration) {
        setProgress((videoElement.currentTime / videoElement.duration) * 100);
      }
    };
    
    const updateDuration = () => {
      setDuration(videoElement.duration);
    };
    
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      videoElement.currentTime = 0;
    };
    
    videoElement.addEventListener('timeupdate', updateProgress);
    videoElement.addEventListener('loadedmetadata', updateDuration);
    videoElement.addEventListener('ended', onEnded);
    
    return () => {
      videoElement.removeEventListener('timeupdate', updateProgress);
      videoElement.removeEventListener('loadedmetadata', updateDuration);
      videoElement.removeEventListener('ended', onEnded);
    };
  }, []);
  
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleProgressChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newProgress = value[0];
    setProgress(newProgress);
    video.currentTime = (newProgress / 100) * video.duration;
  };
  
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = value[0];
    setVolume(newVolume);
    video.volume = newVolume / 100;
  };
  
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleDownload = async () => {
    if (!currentJourney) return;
    
    toast({
      title: 'Generating video',
      description: 'Please wait while we create your journey video...'
    });
    
    try {
      const videoService = new VideoService(currentJourney);
      const videoBlob = await videoService.generateVideo();
      const url = VideoService.createDownloadLink(videoBlob, 'journey.webm');
      
      setVideoUrl(url);
      
      if (videoRef.current) {
        videoRef.current.src = url;
      }
      
      toast({
        title: 'Video ready',
        description: 'Your journey video has been created successfully!'
      });
    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate video. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  const handleBackToJourney = () => {
    setCurrentStage(TravelStage.VISUALIZATION);
  };
  
  if (!currentJourney) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No video available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden shadow-lg"
      >
        <video
          ref={videoRef}
          className="w-full aspect-video"
          controls={false}
          preload="metadata"
          src={videoUrl || undefined}
        >
          Your browser does not support the video tag.
        </video>
        
        {!videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white p-6 text-center">
            <div className="max-w-md space-y-3">
              <h3 className="text-xl font-medium">Generate Your Journey Video</h3>
              <p>
                Click the generate button below to create a video of your journey with all your photos and transitions.
              </p>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity">
          <div className="mb-4">
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={handleProgressChange}
              className="cursor-pointer"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <div className="text-xs text-white/90 min-w-[80px]">
                {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-24 cursor-pointer"
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStage(TravelStage.VISUALIZATION)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Back to Journey
        </Button>
        
        <Button onClick={handleDownload} disabled={isGeneratingVideo}>
          {videoUrl ? (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download Video
            </>
          ) : (
            <>
              <Film className="h-4 w-4 mr-2" />
              Generate Video
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VideoControls;
