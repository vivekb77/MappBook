import React, { useState } from 'react';
import { Info, MapPin, DollarSign, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const GeotargetingInfo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-30 right-4">
      <button
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50"
      >
        <Info className="w-6 h-6 text-blue-600" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Geotargeting Analytics
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Key Location Insights
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Top customer locations analysis</li>
                <li>• Revenue by country breakdown</li>
                <li>• Customer distribution across regions</li>
                <li>• Geographic density metrics</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Business Applications
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Targeted ad campaign optimization</li>
                <li>• Location-based email marketing</li>
                <li>• Regional discount strategies</li>
                <li>• Revenue-based market exclusion</li>
              </ul>
            </div>

            {/* <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Advanced Features
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Continent/Country/State/County filtering</li>
                <li>• Custom location grouping</li>
                <li>• Seasonal campaign planning</li>
                <li>• Geographic performance tracking</li>
              </ul>
            </div> */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeotargetingInfo;