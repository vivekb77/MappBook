import React, { useState, useMemo } from 'react';
import { Marker, Popup } from 'react-map-gl';
import { Package } from 'lucide-react';



interface Order {
  currency: string;
  shipped_to_latitude: number;
  shipped_to_longitude: number;
  ship_city: string;
  ship_state: string;
  ship_postal_code: string;
  item_price: number;
  product_name: string;
  purchase_date: string;
  amazon_order_id: string;
  order_status: string;
  order_channel: string;
  sales_channel: string;
  quantity: number;
}

interface OrderMarkersProps {
  orders: Order[];
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Shipped': 'bg-blue-600 hover:bg-blue-700 border-blue-500',
    'Pending': 'bg-yellow-600 hover:bg-yellow-700 border-yellow-500',
    'Cancelled': 'bg-red-600 hover:bg-red-700 border-red-500',
    'Processing': 'bg-orange-600 hover:bg-orange-700 border-orange-500',
    'Delivered': 'bg-green-600 hover:bg-green-700 border-green-500',
    'Returned': 'bg-red-600 hover:bg-red-700 border-red-500'
  };
  return colors[status] || 'bg-gray-600/90 hover:bg-gray-600 border-gray-500';
};

const getIconColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Shipped': 'text-black-400',
    'Pending': 'text-black-400',
    'Cancelled': 'text-black-400',
    'Processing': 'text-black-400',
    'Delivered': 'text-black-400',
    'Returned': 'text-black-400',
  };
  return colors[status] || 'text-black-400';
};

const PlotAllOrders: React.FC<OrderMarkersProps> = ({ orders = [] }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const ORDERS_PER_CIRCLE = 12;
  const BASE_OFFSET = 0.003;
  const locationMap = new Map<string, number>();

  const adjustedOrders = orders.map(order => {
    const key = `${order.shipped_to_latitude},${order.shipped_to_longitude}`;
    const count = locationMap.get(key) || 0;
    locationMap.set(key, count + 1);

    if (count > 0) {
      const circle = Math.floor(count / ORDERS_PER_CIRCLE);
      const position = count % ORDERS_PER_CIRCLE;
      const angle = (2 * Math.PI * position) / ORDERS_PER_CIRCLE;
      const offset = BASE_OFFSET * (circle + 1);

      return {
        ...order,
        shipped_to_latitude: order.shipped_to_latitude + offset * Math.sin(angle),
        shipped_to_longitude: order.shipped_to_longitude + offset * Math.cos(angle)
      };
    }
    return order;
  });

  return (
    <>
      {adjustedOrders.map((order, index) => (
        <Marker
          key={index}
          longitude={order.shipped_to_longitude}
          latitude={order.shipped_to_latitude}
          anchor="top"
        >
          <div
            className={`p-2 rounded-lg shadow-lg transition-colors cursor-pointer ${getStatusColor(order.order_status)}`}
            onClick={() => setSelectedOrder(order)}
          >
            <Package className={`h-4 w-4 ${getIconColor(order.order_status)}`} />
          </div>

          {selectedOrder === order && (
            <Popup
              latitude={selectedOrder.shipped_to_latitude}
              longitude={selectedOrder.shipped_to_longitude}
              anchor="bottom"
              onClose={() => setSelectedOrder(null)}
              closeButton={false}
              closeOnClick={false}
              closeOnMove={true}
              className="rounded-xl shadow-2xl z-30"
            >
              <div className="p-4 bg-white rounded-xl">

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {order.ship_city}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {order.ship_postal_code}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.order_status === 'Shipped' ? 'bg-green-100 text-green-800' :
                      order.order_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {order.order_status}
                  </span>
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{order.product_name}</h4>
                    <div className="mt-1 flex items-center gap-4">
                      <span className="text-sm text-gray-500">Qty: {order.quantity}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {order.item_price.toFixed(2)} {order.currency}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Order ID</p>
                      <p className="font-medium text-gray-900">{order.amazon_order_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Order Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(order.purchase_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Order Channel</p>
                      <p className="font-medium text-gray-900">{order.order_channel}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Sales Channel</p>
                      <p className="font-medium text-gray-900">{order.sales_channel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </>
  );
};

export default React.memo(PlotAllOrders);