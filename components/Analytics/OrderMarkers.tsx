import React from 'react';
import { Marker } from 'react-map-gl';
import { PieChart, Pie, Cell } from 'recharts';
import _ from 'lodash';

const COLORS_STATUS = ['#87CEEB', '#4682B4', '#0000CD', '#191970'];
const COLORS_CHANNEL = ['#82ca9d', '#8884d8', '#ffc658', '#ff7300'];

const OrderVisualization = ({ orders = [] }) => {
  const ordersByZip = _.chain(orders)
    .groupBy('ship_postal_code')
    .map((groupOrders) => {
      const totalOrders = groupOrders.length;
      const baseSize = Math.sqrt(totalOrders) * 10;  // Scale based on square root of total orders
      const size = Math.max(60, Math.min(200, baseSize)); // Min 60px, max 200px
      
      return {
        latitude: groupOrders[0].shipped_to_latitude,
        longitude: groupOrders[0].shipped_to_longitude,
        size,
        totalOrders,
        statusData: _.chain(groupOrders)
          .groupBy('order_status')
          .map((orders, status) => ({
            name: status,
            value: (orders.length / totalOrders) * 100  // Convert to percentage
          }))
          .value(),
        channelData: _.chain(groupOrders)
          .groupBy('sales_channel')
          .map((orders, channel) => ({
            name: channel,
            value: (orders.length / totalOrders) * 100  // Convert to percentage
          }))
          .value()
      };
    })
    .value();
console.log(ordersByZip)
  return (
    <>
      {ordersByZip.map((location, index) => (
        <Marker
          key={index}
          longitude={location.longitude}
          latitude={location.latitude}
          anchor="center"
        >
          <div className="cursor-pointer transform hover:scale-110 transition-transform">
            <PieChart width={location.size} height={location.size}>
              <Pie
                data={location.statusData}
                cx="50%"
                cy="50%"
                outerRadius={location.size * 0.3}
                dataKey="value"
                label={({ value }) => `${value.toFixed(1)}%`}
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
                label={({ value }) => `${value.toFixed(1)}%`}
              >
                {location.channelData.map((entry, index) => (
                  <Cell key={index} fill={COLORS_CHANNEL[index % COLORS_CHANNEL.length]} stroke="white" />
                ))}
              </Pie>
            </PieChart>
          </div>
        </Marker>
      ))}
    </>
  );
};

export default React.memo(OrderVisualization);