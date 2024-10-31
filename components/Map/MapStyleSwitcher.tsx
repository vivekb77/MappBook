import React from 'react';
import Image from 'next/image';
import { Map as MapIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MapStyleOption {
  id: 'satellite' | 'light' | 'dark';
  label: string;
  imageSrc: string;
}

interface MapStyleSwitcherProps {
  currentStyle: 'satellite' | 'light' | 'dark';
  onStyleChange: (style: 'satellite' | 'light' | 'dark') => void;
}

const styles: MapStyleOption[] = [
  {
    id: 'satellite',
    label: 'Satellite',
    imageSrc: '/mapstylesatellite.png'
  },
  {
    id: 'light',
    label: 'Light',
    imageSrc: '/api/placeholder/120/80'
  },
  {
    id: 'dark',
    label: 'Dark',
    imageSrc: '/api/placeholder/120/80'
  },
];

const MapStyleSwitcher: React.FC<MapStyleSwitcherProps> = ({
  currentStyle,
  onStyleChange,
}) => {
  return (
    <div className="absolute top-11 right-4 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white/100 transition-colors"
            title="Change map style"
          >
            <MapIcon className="w-5 h-5 text-gray-700" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[250px] p-2">
          <div className="grid gap-2">
            {styles.map((style) => (
              <DropdownMenuItem
                key={style.id}
                className={`
                  flex flex-col items-start gap-2 p-2 cursor-pointer
                  ${currentStyle === style.id ? 'bg-blue-50/80 backdrop-blur-sm' : 'hover:bg-gray-50/80'}
                  transition-colors duration-200
                `}
                onClick={() => onStyleChange(style.id)}
              >
                <div className="relative w-full h-20 overflow-hidden rounded-md">
                  <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                  <Image
                    src={style.imageSrc}
                    alt={``}
                    fill
                    className="object-cover transition-opacity duration-200"
                    sizes="(max-width: 250px) 100vw, 250px"
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.opacity = '1';
                    }}
                    style={{ opacity: 0 }}
                  />
                </div>
                <div className="space-y-1">
                  <span className={`text-sm font-medium ${
                    currentStyle === style.id ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {style.label}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MapStyleSwitcher;