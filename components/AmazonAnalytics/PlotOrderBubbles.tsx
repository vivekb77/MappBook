import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Marker } from 'react-map-gl';
import { PieChart, Pie, Cell, Legend, Tooltip, TooltipProps } from 'recharts';
import _ from 'lodash';

type Order = {
  ship_postal_code: string;
  shipped_to_latitude: number;
  shipped_to_longitude: number;
  order_status: string;
  sales_channel: string;
};

type Location = {
  latitude: number;
  longitude: number;
  size: number;
  totalOrders: number;
  zipCode: string;
  statusData: ChartData[];
  channelData: ChartData[];
};

type ChartData = {
  name: string;
  value: number;
  count: number;
  type: 'status' | 'channel';
};

type OrderVisualizationProps = {
  orders?: Order[];
};

const COLORS_STATUS = ['#F06292', '#F44336', '#EF5350', '#FF5722', '#FF8A65','#4FC3F7', '#2196F3', '#1976D2', '#9C27B0', '#BA68C8', '#E91E63']; 
const COLORS_CHANNEL = ['#4FC3F7', '#2196F3', '#1976D2', '#9C27B0', '#BA68C8', '#E91E63', '#F06292', '#F44336', '#EF5350', '#FF5722', '#FF8A65']; 

const OrderVisualization: React.FC<OrderVisualizationProps> = ({ orders = [] }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
      setSelectedLocation(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const ordersByZip = useMemo(() => {
    return _.chain(orders)
      .groupBy('ship_postal_code')
      .map((groupOrders) => {
        const totalOrders = groupOrders.length;
        const baseSize = Math.log2(totalOrders + 1) * 30;
        const size = Math.max(60, Math.min(200, baseSize));
        
        const location: Location = {
          latitude: groupOrders[0].shipped_to_latitude,
          longitude: groupOrders[0].shipped_to_longitude,
          size,
          totalOrders,
          zipCode: groupOrders[0].ship_postal_code,
          statusData: _.chain(groupOrders)
            .groupBy('order_status')
            .map((orders, status) => ({
              name: status,
              value: (orders.length / totalOrders) * 100,
              count: orders.length,
              type: 'status' as const
            }))
            .value(),
          channelData: _.chain(groupOrders)
            .groupBy('sales_channel')
            .map((orders, channel) => ({
              name: channel,
              value: (orders.length / totalOrders) * 100,
              count: orders.length,
              type: 'channel' as const
            }))
            .value()
        };
        
        return location;
      })
      .value();
  }, [orders]);

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload as ChartData;
    return (
      <div className="bg-white p-4 rounded shadow-lg border border-gray-200 min-w-[200px] z-50">
        <p className="font-semibold">{data.type === 'status' ? 'Order Status' : 'Sales Channel'}: {data.name}</p>
        <p>{data.count} orders ({data.value.toFixed(1)}%)</p>
      </div>
    );
  };

  const InfoPanel: React.FC<{ location: Location | null }> = ({ location }) => {
    if (!location) return null;
    
    return (
      <div 
        ref={panelRef}
        className="absolute top-2 right-2 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm z-50"
      >
        <h3 className="font-bold mb-2">Zip Code: {location.zipCode}</h3>
        <p className="mb-4">Total Orders: {location.totalOrders}</p>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Order Status</h4>
            <div className="grid grid-cols-2 gap-2">
              {location.statusData.map((status, idx) => (
                <div key={idx} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS_STATUS[idx % COLORS_STATUS.length] }}
                  />
                  <span className="text-sm">
                    {status.name}: {status.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Sales Channels</h4>
            <div className="grid grid-cols-2 gap-2">
              {location.channelData.map((channel, idx) => (
                <div key={idx} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS_CHANNEL[idx % COLORS_CHANNEL.length] }}
                  />
                  <span className="text-sm">
                    {channel.name}: {channel.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {ordersByZip.map((location, index) => (
        <Marker
          key={index}
          longitude={location.longitude}
          latitude={location.latitude}
          anchor="center"
        >
          <div 
            className="cursor-pointer transform hover:scale-110 transition-transform"
            onClick={() => setSelectedLocation(location)}
          >
            <PieChart width={location.size} height={location.size} className="relative z-10">
              <Tooltip content={<CustomTooltip />} position={{ y: -90 }} wrapperStyle={{ zIndex: 50 }} />
              <Pie className="relative z-10"
                data={location.statusData}
                cx="50%"
                cy="50%"
                outerRadius={location.size * 0.3}
                dataKey="value"
              >
                {location.statusData.map((entry, index) => (
                  <Cell key={index} fill={COLORS_STATUS[index % COLORS_STATUS.length]} stroke="white" />
                ))}
              </Pie>
              <Pie className="relative z-10"
                data={location.channelData}
                cx="50%"
                cy="50%"
                innerRadius={location.size * 0.35}
                outerRadius={location.size * 0.5}
                dataKey="value"
              >
                {location.channelData.map((entry, index) => (
                  <Cell key={index} fill={COLORS_CHANNEL[index % COLORS_CHANNEL.length]} stroke="white" />
                ))}
              </Pie>
            </PieChart>
          </div>
        </Marker>
      ))}
      
      <InfoPanel location={selectedLocation} />
    </>
  );
};

export default React.memo(OrderVisualization);