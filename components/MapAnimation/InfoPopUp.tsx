import React, { useState } from 'react';
import { Info, Mouse, Compass } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MapControlsInfo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-[55%] right-[1%]">
      <button
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition-colors shadow-lg"
      >
        <span className="text-white font-bold text-2xl">?</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="fixed w-[90vw] sm:w-[440px] rounded-2xl bg-gradient-to-br from-pink-100 to-blue-50 p-0 border-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-semibold text-center bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">
              Map Navigation Guide
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="bg-white/80 rounded-xl p-4 shadow-sm space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-blue-600">Basic Controls:</span>
                    <span className="text-gray-600"> Essential map navigation:</span>
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-2 ml-4">
                    <li className="flex items-center gap-2">
                      <Mouse className="w-4 h-4" /> Scroll to zoom in/out
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m-8 5h8m-8 5h8" />
                      </svg>
                      Click and drag to pan
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="text-sm">
                    <span className="font-medium text-blue-600">Advanced Navigation:</span>
                    <span className="text-gray-600"> Using keyboard controls:</span>
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-2 ml-4">
                    <li className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl</kbd> + Mouse: Change pitch & bearing
                    </li>
                    <li className="flex items-center gap-2">
                      <Compass className="w-4 h-4" /> Double-click to reset orientation
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50/50 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-600">Pro Tips 💫</p>
                <ul className="mt-1 text-gray-600 space-y-1">
                  <li>• Hold Shift while scrolling for faster zoom</li>
                  <li>• Use two fingers on trackpad to tilt the view</li>
                  <li>• Press ESC to exit any active tool</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapControlsInfo;