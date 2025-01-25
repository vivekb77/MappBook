import React, { useMemo, useState } from 'react';
import { Marker } from 'react-map-gl';
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import _ from 'lodash';

const COLORS_STATUS = ['#87CEEB', '#4682B4', '#0000CD', '#191970'];
const COLORS_CHANNEL = ['#82ca9d', '#8884d8', '#ffc658', '#ff7300'];

const OrderVisualization = ({ orders = [] }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const ordersByZip = useMemo(() => {
    return _.chain(orders)
      .groupBy('ship_postal_code')
      .map((groupOrders) => {
        const totalOrders = groupOrders.length;
        // Logarithmic scaling for better visualization of varied order volumes
        const baseSize = Math.log2(totalOrders + 1) * 30;
        const size = Math.max(60, Math.min(200, baseSize));
        
        const location = {
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
               type: 'status'
            }))
            .value(),
          channelData: _.chain(groupOrders)
            .groupBy('sales_channel')
            .map((orders, channel) => ({
              name: channel,
              value: (orders.length / totalOrders) * 100,
              count: orders.length
            }))
            .value()
        };
        
        return location;
      })
      .value();
  }, [orders]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    console.log(payload)
    const data = payload[0].payload;
    const type = payload[0].name;
    const label = type === "statusData" ? "Order Status" : "Sales Channel";
    return (
      <div className="bg-white p-4 rounded shadow-lg border border-gray-200 min-w-[200px]">
        <p className="font-semibold">{label}: {data.name}</p>
        <p>{data.count} orders ({data.value.toFixed(1)}%)</p>
      </div>
    );
  };


  const InfoPanel = ({ location }) => {
    if (!location) return null;

    return (
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
        {/* <h3 className="font-bold mb-2">Country: {location.}</h3> */}
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
            <PieChart width={location.size} height={location.size}>
            <Tooltip content={<CustomTooltip />} position={{ y: -90 }} />
              <Pie
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
              <Pie
                data={location.channelData}
                cx="50%"
                cy="50%"
                innerRadius={location.size * 0.35}
                outerRadius={location.size * 0.45}
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