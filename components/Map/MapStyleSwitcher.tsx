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
    imageSrc: string;
}

interface MapStyleSwitcherProps {
    currentStyle: 'satellite' | 'light' | 'dark';
    onStyleChange: (style: 'satellite' | 'light' | 'dark') => void;
}

const styles: MapStyleOption[] = [
    {
        id: 'satellite',
        imageSrc: '/mapstylesatellite.png',
    },
    {
        id: 'light',
        imageSrc: '/mapstylelight.png',
    },
    {
        id: 'dark',
        imageSrc: '/mapstyledark.png',
    },
];

const MapStyleSwitcher: React.FC<MapStyleSwitcherProps> = ({
    currentStyle,
    onStyleChange,
}) => {
    return (
        <div className="absolute sm:top-10 sm:right-4 top-[10%] right-2 z-15">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white/100 transition-colors"
                        title="Change map style"
                    >
                        <MapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    //   className="p-2 w-[80px]"
                    className="min-w-0 w-26 p-1"
                >
                    <div className="grid grid-cols-1 gap-2">
                        {styles.map((style) => (
                            <DropdownMenuItem
                                key={style.id}
                                className={`
                  p-0 cursor-pointer overflow-hidden rounded-lg h-16 w-16
                  ${currentStyle === style.id ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-300'}
                  transition-all duration-200
                `}
                                onClick={() => onStyleChange(style.id)}
                            >
                                <div className="relative w-full h-full">
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                    <Image
                                        src={style.imageSrc}
                                        alt={`${style.id} map style`}
                                        fill
                                        className="object-cover transition-opacity duration-200"
                                        sizes="64px"
                                        onLoad={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.opacity = '1';
                                        }}
                                        style={{ opacity: 0 }}
                                    />
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