import React from 'react';
import { Info, Mouse, Compass } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MapSettingsProps {
  showLabels: boolean;
  setShowLabels: (value: boolean) => void;
  showFog: boolean;
  setShowFog: (value: boolean) => void;
  showPath: boolean;
  setShowPath: (value: boolean) => void;
}

const MapSettings: React.FC<MapSettingsProps> = ({
  showLabels,
  setShowLabels,
  showFog,
  setShowFog,
  showPath,
  setShowPath
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  interface TogglePillProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const TogglePill: React.FC<TogglePillProps> = ({ label, value, onChange }) => (
    <div
      className="relative h-[38px] rounded-full bg-gray-800 border border-gray-700
                 flex items-center w-full cursor-pointer select-none"
      onClick={() => onChange(!value)}
    >
      {/* Labels Container */}
      <div className="absolute inset-0 flex justify-between items-center z-10">
        <div className="flex-1 flex justify-center items-center gap-1.5">
          <span className={`text-sm font-medium transition-colors duration-150 
                          ${value ? 'text-white' : 'text-gray-500'}`}>
            Show
          </span>
        </div>
        <div className="flex-1 flex justify-center items-center gap-1.5">
          <span className={`text-sm font-medium transition-colors duration-150 
                          ${!value ? 'text-white' : 'text-gray-500'}`}>
            Hide
          </span>
        </div>
      </div>

      {/* Sliding Background */}
      <div
        className={`absolute h-[34px] w-[49%] mx-[2px] rounded-full
                    bg-gradient-to-r from-blue-400 to-blue-600
                    transition-transform duration-150 ease-in-out shadow-md
                    ${!value ? 'translate-x-[100%]' : 'translate-x-0'}`}
      />
    </div>
  );

  return (
    <div className="absolute top-20 right-2">
      <button
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800/90 hover:bg-gray-800 transition-colors shadow-lg border border-gray-700"
      >
        <span className="text-blue-400 font-bold text-xl">⚙️</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="fixed w-[90vw] sm:w-[400px] max-h-[75vh] rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 overflow-hidden flex flex-col">
          <DialogHeader className="p-0">
            <DialogTitle className="text-lg font-semibold text-center bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Settings
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-2">
              {/* Toggles Section */}
              <div className="bg-gray-800/80 rounded-lg p-3 shadow-sm space-y-3 border border-gray-700">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-400">Map Labels (eg. city, road names)</label>
                    <TogglePill
                      label="Labels"
                      value={showLabels}
                      onChange={setShowLabels}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-400">Fog Effect</label>
                    <TogglePill
                      label="Fog"
                      value={showFog}
                      onChange={setShowFog}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-400">Flight Path</label>
                    <TogglePill
                      label="Path"
                      value={showPath}
                      onChange={setShowPath}
                    />
                  </div>
                </div>
              </div>


            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapSettings;