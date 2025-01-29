import React, { useState, useMemo } from 'react';
import { Marker, Popup } from 'react-map-gl';
import { Package } from 'lucide-react';
import _ from 'lodash';

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
  zoom: number;
}

interface GroupedOrders {
  latitude: number;
  longitude: number;
  orders: Order[];
  count: number;
}

const ZOOM_THRESHOLD = 10;

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

const PlotAllOrders: React.FC<OrderMarkersProps> = ({ orders = [], zoom }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>();
  const [selectedGroup, setSelectedGroup] = useState<GroupedOrders | null>(null);

  const ordersData = useMemo(() => {
    // Group orders by location
    const grouped = _.chain(orders)
      .groupBy(order => `${order.shipped_to_latitude},${order.shipped_to_longitude}`)
      .map((groupOrders, key): GroupedOrders => {
        const [lat, lng] = key.split(',').map(Number);
        return {
          latitude: lat,
          longitude: lng,
          orders: groupOrders,
          count: groupOrders.length
        };
      })
      .value();

    // Separate single orders and groups
    const singles = grouped.filter(g => g.count === 1).map(g => g.orders[0]);
    const groups = grouped.filter(g => g.count > 1);

    return { singles, groups };
  }, [orders]);

  // Calculate circle size based on count and zoom
  const getCircleSize = (count: number) => {
    const baseSize = Math.max(35, Math.min(60, 25 + Math.log2(count) * 10));
    const zoomFactor = Math.max(1, zoom / 8);
    return Math.round(baseSize * zoomFactor);
  };

  // Calculate offset for individual orders within a group
  const getOrderOffset = (index: number, total: number) => {
    const RADIUS = 0.0003; // Base radius for the circle
    const angle = (2 * Math.PI * index) / total;
    return {
      lat: RADIUS * Math.sin(angle),
      lng: RADIUS * Math.cos(angle)
    };
  };

  return (
    <>
      {/* Render individual orders */}
      {ordersData.singles.map((order, index) => (
        <Marker
          key={`single-${index}`}
          longitude={order.shipped_to_longitude}
          latitude={order.shipped_to_latitude}
          anchor="top"
        >
          <div
            className={`p-2 rounded-lg shadow-lg transition-colors cursor-pointer ${getStatusColor(order.order_status)}`}
            onClick={() => setSelectedOrder(order)}
          >
            <Package className="h-4 w-4 text-black-400" />
          </div>
          {/* Single order popup */}
          {selectedOrder === order && (
            <Popup
              latitude={order.shipped_to_latitude}
              longitude={order.shipped_to_longitude}
              anchor="bottom"
              onClose={() => setSelectedOrder(null)}
              closeButton={false}
              closeOnClick={false}
              closeOnMove={true}
              className="rounded-xl shadow-2xl z-30"
            >
              <div className="p-4 bg-white rounded-xl">
                {/* Existing popup content */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{order.ship_city}</h3>
                    <p className="text-gray-500 text-sm">{order.ship_postal_code}</p>
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

      {/* Render grouped markers */}
      {ordersData.groups.map((group, groupIndex) => (
        <>
          {zoom < ZOOM_THRESHOLD ? (
            // Show group marker when zoomed out
            <Marker
              key={`group-${groupIndex}`}
              longitude={group.longitude}
              latitude={group.latitude}
              anchor="center"
            >
              <div
                className="bg-blue-500 text-white rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg flex items-center justify-center"
                style={{
                  width: `${getCircleSize(group.count)}px`,
                  height: `${getCircleSize(group.count)}px`,
                }}
                onClick={() => setSelectedGroup(group)}
              >
                <span className="font-bold">{group.count}</span>
              </div>
              {selectedGroup === group && (
                <Popup
                  latitude={group.latitude}
                  longitude={group.longitude}
                  anchor="bottom"
                  onClose={() => setSelectedGroup(null)}
                  closeButton={false}
                  closeOnClick={false}
                  closeOnMove={true}
                  className="rounded-xl shadow-2xl z-30"
                >
                  <div className="p-4 bg-white rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Order Group</h3>
                    <p className="text-gray-600 mb-2">Total Orders: {group.count}</p>
                    <div className="max-h-48 overflow-y-auto">
                      {group.orders.map((order, idx) => (
                        <div key={idx} className="border-t py-2 first:border-t-0">
                          <p className="font-medium">{order.product_name}</p>
                          <p className="text-sm text-gray-500">
                            Status: {order.order_status} | Qty: {order.quantity}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          ) : (
            // Show individual orders within group when zoomed in
            group.orders.map((order, orderIndex) => {
              const offset = getOrderOffset(orderIndex, group.orders.length);
              return (
                <Marker
                  key={`group-${groupIndex}-order-${orderIndex}`}
                  longitude={group.longitude + offset.lng}
                  latitude={group.latitude + offset.lat}
                  anchor="top"
                >
                  <div
                    className={`p-2 rounded-lg shadow-lg transition-colors cursor-pointer ${getStatusColor(order.order_status)}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Package className="h-4 w-4 text-black-400" />
                  </div>
                  {/* Individual order popup */}

                  {selectedOrder === order && (
                    <Popup
                      latitude={group.latitude + offset.lat}
                      longitude={group.longitude + offset.lng}
                      anchor="bottom"
                      onClose={() => setSelectedOrder(null)}
                      closeButton={false}
                      closeOnClick={false}
                      closeOnMove={true}
                      className="rounded-xl shadow-2xl z-30"
                    >
                      {/* Same popup content as single orders */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900">{order.ship_city}</h3>
                          <p className="text-gray-500 text-sm">{order.ship_postal_code}</p>
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
                    </Popup>
                  )}
                </Marker>
              );
            })
          )}
        </>
      ))}
    </>
  );
};

export default React.memo(PlotAllOrders);