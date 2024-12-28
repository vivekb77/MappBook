import React, { useState } from 'react';
import { Info, Mouse, Compass } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MapControlsInfo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-[55%] right-[1%]">
      <button
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800/90 hover:bg-gray-800 transition-colors shadow-lg border border-gray-700"
      >
        <span className="text-blue-400 font-bold text-xl">?</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="fixed w-[90vw] sm:w-[400px] max-h-[75vh] rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 overflow-hidden flex flex-col">
          <DialogHeader className="p-0">
            <DialogTitle className="text-lg font-semibold text-center bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Guide
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-2">
              <div className="bg-gray-800/80 rounded-lg p-3 shadow-sm space-y-3 border border-gray-700">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-blue-400">Basic Controls:</span>
                      <span className="text-gray-300"> Essential map navigation:</span>
                    </p>
                    <ul className="text-sm text-gray-300 mt-1 space-y-1 ml-3">
                      <li className="flex items-center gap-2">
                        <Mouse className="w-4 h-4 text-blue-400" /> Scroll to zoom in/out
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m-8 5h8m-8 5h8" />
                        </svg>
                        Click and drag to pan
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-blue-400">Advanced Navigation:</span>
                      <span className="text-gray-300"> Using keyboard controls:</span>
                    </p>
                    <ul className="text-sm text-gray-300 mt-1 space-y-1 ml-3">
                      <li className="flex items-center gap-2">
                        <kbd className="px-1 py-0.5 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200">Ctrl</kbd> + Mouse: Change pitch & bearing
                      </li>
                      <li className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-blue-400" /> Click to reset orientation
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-2 text-sm border border-gray-700">
                  <p className="font-medium text-blue-400">Animating Awesome videos Tips 💫</p>
                  <ul className="mt-1 text-gray-300 space-y-1">
                    <li>• Vary point distances (closer for detailed areas, wider for transitions)</li>
                    <li>• Create smooth curved paths around landmarks for cinematic flow</li>
                    <li>• Use altitude changes strategically (rise for overview, descend for details)</li>
                    {/* <li>• Time your animations with speed variations (slow for emphasis, fast for transitions)</li>
                  <li>• Add hover points at key locations to create natural pauses</li>
                  <li>• Combine tilt and bearing changes for dynamic perspectives</li>
                  <li>• Layer multiple animation paths for complex sequences</li>
                  <li>• Sync camera movements with zoom levels for smooth transitions</li> */}
                  </ul>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-2 text-sm border border-gray-700">
                  <p className="font-medium text-blue-400">Performance & Export Tips 🎥</p>
                  <ul className="mt-1 text-gray-300 space-y-1">
                    <li>• Animation smoothness depends on internet connection and processor speed</li>
                    <li>• Run the animation twice - second run will use cached map data for better performance</li>
                    <li>• Exported videos are server-rendered for consistent high quality</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapControlsInfo;