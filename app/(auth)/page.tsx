"use client"
import React, { ReactNode, useState } from 'react';
import { Camera, Globe, Map, Video, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Player } from '@remotion/player';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

interface VideoThumbnailProps {
  title: string;
  thumbnail: string;
  videoUrl: string;
  onClick: () => void;
}

const VideoThumbnail = ({ title, thumbnail, onClick }: VideoThumbnailProps) => {
  return (
    <div
      className="cursor-pointer group relative"
      onClick={onClick}
    >
      <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="group-hover:scale-105 transition-transform duration-300 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <Video className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
    </div>
  );
};

const VideoGallery = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const videos = [
    {
      title: "Grassland Flyover",
      thumbnail: "/drone/landingpagevideo1cover.png",
      videoUrl: "https://ugjwmywvzxkfkohaxseg.supabase.co/storage/v1/object/public/map-animation-videos/landingpagevideo1.mov?t=2025-01-03T00%3A50%3A29.242Z"
    },
    {
      title: "Desert Flyover",
      thumbnail: "/drone/landingpagevideo2cover.png",
      videoUrl: "https://ugjwmywvzxkfkohaxseg.supabase.co/storage/v1/object/public/map-animation-videos/landingpagevideo2.mov?t=2025-01-03T00%3A50%3A57.801Z"
    }
     // {
    //   title: "New York City Flyover",
    //   thumbnail: "",
    //   videoUrl: ""
    // },
    // {
    //   title: "Grand Canyon Tour",
    //   thumbnail: "",
    //   videoUrl: ""
    // },
    // {
    //   title: "Tokyo Night Flight",
    //   thumbnail: "",
    //   videoUrl: ""
    // },
    // {
    //   // /render/2e73db7a-4dac-4764-b712-e1b325981192
    //   // render/e1019458-187d-47e1-86f4-731dd38765b0
    //   title: "Paris Landmarks",
    //   thumbnail: "",
    //   videoUrl: ""
    // }
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {videos.map((video, index) => (
          <VideoThumbnail
            key={index}
            {...video}
            onClick={() => setSelectedVideo(video.videoUrl)}
          />
        ))}
      </div>

      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="sm:max-w-[90vw] h-[80vh] p-0 bg-transparent border-0 rounded-xl">
            <div className="relative w-full h-full">
              <Player
                component={() => {
                  const videoRef = React.useRef<HTMLVideoElement>(null);

                  React.useEffect(() => {
                    if (videoRef.current) {
                      videoRef.current.addEventListener('loadedmetadata', () => {
                        if (videoRef.current) {
                          const width = videoRef.current.videoWidth;
                          const height = videoRef.current.videoHeight;
                          videoRef.current.style.width = `${width}px`;
                          videoRef.current.style.height = `${height}px`;
                        }
                      });
                    }
                  }, []);

                  return (
                    <div className="w-full h-full bg-black">
                      <video
                        ref={videoRef}
                        src={selectedVideo}
                        controls
                        autoPlay
                        className="w-full h-full rounded-lg"
                      />
                    </div>
                  );
                }}
                durationInFrames={1000}
                compositionWidth={1520}
                compositionHeight={1080}
                fps={30}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-gray-800/90 p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors border border-gray-700">
          <span className="font-bold text-xl text-blue-400">MappBook</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mt-8">
          <h1 className="text-4xl font-bold mb-6">
            Create Stunning Drone-Like Footage Using Maps
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Transform your map exploration into cinematic experiences. No drone required.
          </p>
          <Link href="/studio">
            <button className="px-8 py-4 bg-blue-500 rounded-lg text-lg font-semibold hover:bg-blue-600 transition">
              Start Creating
            </button>
          </Link>
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-3 py-26">
        <div className="bg-gray-800 rounded-xl p-2">
          <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="relative w-full h-full">
              <Image
                src="https://ugjwmywvzxkfkohaxseg.supabase.co/storage/v1/object/public/map-animation-videos/landingpagegif.gif"
                alt="Example flight over map"
                fill
                className="rounded-lg object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Video Gallery Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Featured Creations</h2>
        <VideoGallery />
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Globe className="w-12 h-12 text-blue-500" />}
            title="Global Coverage"
            description="Access detailed maps from anywhere in the world"
          />
          <FeatureCard
            icon={<Camera className="w-12 h-12 text-blue-500" />}
            title="Cinematic Paths"
            description="Design smooth camera movements and transitions"
          />
          <FeatureCard
            icon={<Video className="w-12 h-12 text-blue-500" />}
            title="Easy Export"
            description="Get high quality videos for your creations"
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl text-center">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

export default LandingPage;