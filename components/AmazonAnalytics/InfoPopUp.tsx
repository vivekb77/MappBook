import React, { useState } from 'react';
import { Info, MapPin, DollarSign, Globe, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const GeotargetingInfo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-40 right-2">
      <button
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50"
      >
        <Info className="w-6 h-6 text-blue-600" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-md rounded-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Why Location Analytics Matter
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4 overflow-y-auto">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Revenue Optimization
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Identify and double down on your highest-performing regions</li>
                <li>• Discover untapped markets with similar characteristics</li>
                <li>• Optimize inventory distribution based on regional demand</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Cost Reduction
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Track and analyze return rates by region to identify issues</li>
                <li>• Optimize inventory placement to reduce shipping costs</li>
                <li>• Prevent overstocking through regional demand forecasting</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Marketing Efficiency
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Target PPC advertising based on geographic performance</li>
                <li>• Customize marketing messages for different regions</li>
                <li>• Make data-driven expansion decisions</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Competitive Advantage
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Get insights beyond Amazon's native analytics</li>
                <li>• Make strategic decisions based on real data</li>
                <li>• Optimize customer service for different regions</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeotargetingInfo;