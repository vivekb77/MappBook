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

const OFFSET_AMOUNT = 0.0001; // Approximately 11 meters at the equator

const PlotAllOrders: React.FC<OrderMarkersProps> = ({ orders = [] }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const adjustedOrders = useMemo(() => {
    const locationMap = new Map<string, number>();
    
    return orders.map(order => {
      const key = `${order.shipped_to_latitude},${order.shipped_to_longitude}`;
      const count = locationMap.get(key) || 0;
      locationMap.set(key, count + 1);
      
      if (count > 0) {
        // Create a circular pattern around the original point
        const angle = (2 * Math.PI * count) / 8;
        return {
          ...order,
          shipped_to_latitude: order.shipped_to_latitude + OFFSET_AMOUNT * Math.sin(angle),
          shipped_to_longitude: order.shipped_to_longitude + OFFSET_AMOUNT * Math.cos(angle)
        };
      }
      
      return order;
    });
  }, [orders]);

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
            className="bg-blue-950/90 p-2 rounded-lg shadow-lg hover:bg-blue-950 transition-colors border border-blue-900 cursor-pointer"
            onClick={() => setSelectedOrder(order)}
          >
            <Package className="text-cyan-400 h-4 w-4" />
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
                <h3 className="font-bold text-sm text-gray-800 mb-1">
                  City: {order.ship_city}
                </h3>
                <p className="text-sm text-gray-600 mb-3">Zip Code: {order.ship_postal_code}</p>
                <div className="border-t pt-2">
                  <p className="font-medium text-sm">Product: {order.product_name}</p>
                  <p className="text-gray-500 text-sm">
                    Quantity: {order.quantity}
                  </p>
                  <p className="text-gray-500 text-sm">
                    OrderId: {order.amazon_order_id}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Price: {order.item_price.toFixed(2)} {order.currency}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Order Date: {new Date(order.purchase_date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Order Status: {order.order_status}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Order Channel: {order.order_channel}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Sales Channel: {order.sales_channel}
                  </p>
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