import React from 'react';
import Image from 'next/image';
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
        <div className="absolute right-3 bottom-24 z-5">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className="p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white/100 transition-colors"
                        title="Change map style"
                    >
                        <div className="relative w-10 h-10 rounded-md overflow-hidden">
                            <Image
                                src={styles.find(style => style.id === currentStyle)?.imageSrc || styles[0].imageSrc}
                                alt="Current map style"
                                fill
                                className="object-cover"
                                sizes="40px"
                            />
                        </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    side="left"
                    className="min-w-0 p-2 mr-2 bg-white/95 backdrop-blur-sm"
                >
                    <div className="flex flex-col gap-2">
                        {styles.map((style) => (
                            <DropdownMenuItem
                                key={style.id}
                                className={`
                                    p-0 cursor-pointer overflow-hidden rounded-lg w-12 h-12
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
                                        sizes="48px"
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