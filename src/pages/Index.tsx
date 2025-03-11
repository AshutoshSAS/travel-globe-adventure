
import React from 'react';
import { TravelProvider, useTravelContext } from '../context/TravelContext';
import LocationInput from '../components/LocationInput';
import TravelGlobe from '../components/TravelGlobe';
import VideoControls from '../components/VideoControls';
import { TravelStage } from '../types';
import { Separator } from '@/components/ui/separator';

const TravelApp: React.FC = () => {
  const { currentStage } = useTravelContext();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="py-6 px-6 border-b">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-medium tracking-tight">Journey Visualizer</h1>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentStage === TravelStage.INPUT && (
          <LocationInput />
        )}
        
        {currentStage === TravelStage.VISUALIZATION && (
          <div className="space-y-6">
            <div className="text-center space-y-3 mb-8">
              <h2 className="text-3xl font-medium tracking-tight">Your Travel Journey</h2>
              <p className="text-muted-foreground">
                Explore your journey on the interactive globe
              </p>
            </div>
            <TravelGlobe />
          </div>
        )}
        
        {currentStage === TravelStage.PREVIEW && (
          <div className="space-y-6">
            <div className="text-center space-y-3 mb-8">
              <h2 className="text-3xl font-medium tracking-tight">Journey Video</h2>
              <p className="text-muted-foreground">
                Preview and download your travel journey video
              </p>
            </div>
            <VideoControls />
          </div>
        )}
      </main>
      
      <footer className="py-6 px-6 border-t mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Journey Visualizer. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <TravelProvider>
      <TravelApp />
    </TravelProvider>
  );
};

export default Index;
