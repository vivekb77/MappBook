import React, { useState } from 'react';
import { Marker, Popup } from 'react-map-gl';
import { Package } from 'lucide-react';

interface Order {
  shipped_to_latitude: number;
  shipped_to_longitude: number;
  ship_city: string;
  ship_state: string;
  ship_postal_code: string;
  item_price: number;
  product_name: string;
  purchase_date: string;
}

interface OrderMarkersProps {
  orders: Order[];
}

const PlotAllOrders: React.FC<OrderMarkersProps> = ({ orders = [] }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <>
      {orders.map((order, index) => (
        <Marker
          key={index}
          longitude={order.shipped_to_longitude}
          latitude={order.shipped_to_latitude}
          anchor="top"
        >
          <div 
            className="bg-red-800/90 p-2 rounded-lg shadow-lg hover:bg-red-800 transition-colors border border-red-700 cursor-pointer"
            onClick={() => setSelectedOrder(order)}
          >
            <Package className="text-blue-400 h-4 w-4" />
          </div>

          {selectedOrder === order && (
            <Popup
              latitude={selectedOrder.shipped_to_latitude}
              longitude={selectedOrder.shipped_to_longitude}
              anchor="top"
              onClose={() => setSelectedOrder(null)}
              closeButton={true}
              closeOnClick={false}
              className="rounded-xl shadow-2xl z-30"
            >
              <div className="p-4 bg-white rounded-xl">
                <h3 className="font-bold text-sm text-gray-800 mb-1">
                  {order.ship_city}, {order.ship_state}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{order.ship_postal_code}</p>
                <div className="border-t pt-2">
                  <p className="font-medium text-sm">{order.product_name}</p>
                  <p className="text-gray-500 text-sm">
                    ${order.item_price.toFixed(2)} - {new Date(order.purchase_date).toLocaleDateString()}
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