import React, { useState, useEffect, SetStateAction, Dispatch } from 'react';
import { useReportContext } from '@/context/ReportContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Checkbox } from '@/components/ui/checkbox';
import OrderSankeyStats from './OrderSankeyStats';

interface Order {
  purchase_date: string;
  product_name: string;
  item_price: number;
  currency: string;
  order_status: string;
  sales_channel: string;
}

interface ReportData {
  orders: Order[];
  [key: string]: any;
}


interface OrderStats {
  count: number;
  totals: { [key: string]: number };
  statusCounts: { [key: string]: number };
  statusTotals: { [status: string]: { [currency: string]: number } };
}
interface ReportContextType {
  reportData: any | null;
  setReportData: Dispatch<SetStateAction<any | null>>;
}

interface DateStats {
  count: number;
  total: number;
}

const OrderFilters: React.FC = () => {
  const { reportData, setReportData } = useReportContext() as ReportContextType;
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string[]>([]);
  const [originalData, setOriginalData] = useState<ReportData | null>(null);
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [ordersByDate, setOrdersByDate] = useState<{ [key: string]: DateStats }>({});

  useEffect(() => {
    if (reportData && !originalData) {
      setOriginalData(reportData);
      calculateOrdersByDate(reportData.orders);
    }
  }, [reportData]);

  useEffect(() => {
    const handleReset = (event: CustomEvent) => {
      setOriginalData(null);
      setReportData(null);
      setSelectedStatus([]);
      setSelectedChannel([]);

      const newReportData = event.detail;
      if (newReportData) {
        setOriginalData(newReportData);
        setReportData(newReportData);
        calculateOrdersByDate(newReportData.orders);
      }

      setDateRange({ from: undefined, to: undefined });
      setSelectedProducts([]);
    };

    window.addEventListener('resetOrderFilters', handleReset as EventListener);
    return () => window.removeEventListener('resetOrderFilters', handleReset as EventListener);
  }, []);

  const getUniqueValues = (field: keyof Order): string[] => {
    if (!originalData?.orders) return [];
    return Array.from(new Set(originalData.orders.map(order => order[field] as string))).filter(Boolean);
  };

  const calculateOrdersByDate = (orders: Order[]) => {
    const orderStats: { [key: string]: DateStats } = {};
    orders.forEach(order => {
      const dateKey = format(new Date(order.purchase_date), 'yyyy-MM-dd');
      if (!orderStats[dateKey]) {
        orderStats[dateKey] = { count: 0, total: 0 };
      }
      orderStats[dateKey].count += 1;
      orderStats[dateKey].total += (order.item_price || 0);
    });
    setOrdersByDate(orderStats);
  };

  const getFilteredProducts = (): string[] => {
    if (!originalData?.orders) return [];

    let filteredOrders = [...originalData.orders];
    if (dateRange?.from && dateRange?.to) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.purchase_date);
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to!);
        toDate.setHours(23, 59, 59, 999);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    if (selectedStatus.length > 0) {
      filteredOrders = filteredOrders.filter(order =>
        selectedStatus.includes(order.order_status)
      );
    }

    if (selectedChannel.length > 0) {
      filteredOrders = filteredOrders.filter(order =>
        selectedChannel.includes(order.sales_channel)
      );
    }

    return filteredOrders
      .map(order => order.product_name)
      .filter((value, index, self) => self.indexOf(value) === index);
  };


  
  const getFilteredOrdersStats = (): OrderStats => {
      if (!originalData?.orders) {
        return {
          count: 0,
          totals: {},
          statusCounts: {},
          statusTotals: {}
        };
      }
  
      let filteredOrders = [...originalData.orders];
  
      // Apply filters
      if (dateRange?.from && dateRange?.to) {
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        
        filteredOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.purchase_date);
          return orderDate >= fromDate && orderDate <= toDate;
        });
      }
  
      if (selectedStatus.length > 0) {
        filteredOrders = filteredOrders.filter(order => 
          selectedStatus.includes(order.order_status)
        );
      }
  
      if (selectedChannel.length > 0) {
        filteredOrders = filteredOrders.filter(order => 
          selectedChannel.includes(order.sales_channel)
        );
      }
  
      if (selectedProducts.length > 0) {
        filteredOrders = filteredOrders.filter(order => 
          selectedProducts.includes(order.product_name)
        );
      }
  
      // Calculate all statistics in a single pass
      const stats = filteredOrders.reduce((acc, order) => {
        const status = order.order_status || 'Unknown';
        const currency = order.currency || '?';
        const price = Number(order.item_price) || 0;
  
        // Update overall totals by currency
        acc.totals[currency] = (acc.totals[currency] || 0) + price;
  
        // Update status counts
        acc.statusCounts[status] = (acc.statusCounts[status] || 0) + 1;
  
        // Update status totals by currency
        if (!acc.statusTotals[status]) {
          acc.statusTotals[status] = {};
        }
        if (!acc.statusTotals[status][currency]) {
          acc.statusTotals[status][currency] = 0;
        }
        acc.statusTotals[status][currency] += price;
  
        return acc;
      }, {
        totals: {} as { [key: string]: number },
        statusCounts: {} as { [key: string]: number },
        statusTotals: {} as { [status: string]: { [currency: string]: number } }
      });
  
      return {
        count: filteredOrders.length,
        totals: stats.totals,
        statusCounts: stats.statusCounts,
        statusTotals: stats.statusTotals
      };
    };

  const filterData = (): void => {
    if (!originalData) return;

    let filteredOrders = [...originalData.orders];

    if (dateRange?.from && dateRange?.to) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.purchase_date);
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to!);
        toDate.setHours(23, 59, 59, 999);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    if (selectedStatus.length > 0) {
      filteredOrders = filteredOrders.filter(order =>
        selectedStatus.includes(order.order_status)
      );
    }

    if (selectedChannel.length > 0) {
      filteredOrders = filteredOrders.filter(order =>
        selectedChannel.includes(order.sales_channel)
      );
    }

    if (selectedProducts.length > 0) {
      filteredOrders = filteredOrders.filter(order =>
        selectedProducts.includes(order.product_name)
      );
    }

    setReportData({
      ...originalData,
      orders: filteredOrders
    });
  };

  useEffect(() => {
    filterData();
    const availableProducts = getFilteredProducts();
    setSelectedProducts(prev => prev.filter(p => availableProducts.includes(p)));
  }, [dateRange, selectedStatus, selectedChannel]);

  useEffect(() => {
    filterData();
  }, [selectedProducts]);

  const handleReset = (): void => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedProducts([]);
    setSelectedStatus([]);
    setSelectedChannel([]);
    if (originalData) {
      setReportData(originalData);
    }
  };

  const handleSelectAllProducts = (): void => {
    setSelectedProducts(getFilteredProducts());
  };

  const handleDeselectAllProducts = (): void => {
    setSelectedProducts([]);
  };

  const handleSelectAllStatus = () => {
    setSelectedStatus(uniqueStatuses);
  };

  const handleDeselectAllStatus = () => {
    setSelectedStatus([]);
  };

  const handleSelectAllChannels = () => {
    setSelectedChannel(uniqueChannels);
  };

  const handleDeselectAllChannels = () => {
    setSelectedChannel([]);
  };

  const uniqueProducts = getFilteredProducts();
  const orderStats = getFilteredOrdersStats();
  const uniqueStatuses = getUniqueValues('order_status');
  const uniqueChannels = getUniqueValues('sales_channel');

  return (
    <>
      <div className={`absolute bottom-[7%] left-0 right-0 flex justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-[90%] bg-white shadow-lg rounded-lg p-6">
          {/* {((dateRange?.from && dateRange?.to) || selectedProducts.length > 0 || selectedStatus.length > 0 || selectedChannel.length > 0) && (
           
          )} */}
          <div className="w-full">
          <OrderSankeyStats orderStats={getFilteredOrdersStats()} />
          </div>

          <div className="flex flex-wrap gap-6 items-start">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Select date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range: DateRange | undefined) => setDateRange(range)}
                    numberOfMonths={1}
                    modifiers={{
                      'high-orders': (date: Date) => {
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const stats = ordersByDate[dateKey];
                        return stats?.count > 10;
                      },
                      'medium-orders': (date: Date) => {
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const stats = ordersByDate[dateKey];
                        return stats?.count > 5 && stats?.count <= 10;
                      },
                      'low-orders': (date: Date) => {
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const stats = ordersByDate[dateKey];
                        return stats?.count > 0 && stats?.count <= 5;
                      }
                    }}
                    modifiersStyles={{
                      'high-orders': { backgroundColor: '#93C5FD' },  // bg-blue-300
                      'medium-orders': { backgroundColor: '#BFDBFE' }, // bg-blue-200
                      'low-orders': { backgroundColor: '#DBEAFE' }    // bg-blue-100
                    }}
                    classNames={{
                      day: 'relative h-14 w-14 p-0 font-normal aria-selected:opacity-100 rounded-lg',
                      day_selected: 'bg-blue-500/20 text-blue-900 border-2 border-blue-500 rounded-lg',
                      day_today: 'font-bold',
                      day_outside: 'text-gray-500 opacity-50',
                      day_disabled: 'text-gray-500',
                      day_hidden: 'invisible',
                      day_range_start: 'border-2 border-blue-500 rounded-l-lg',
                      day_range_end: 'border-2 border-blue-500 rounded-r-lg',
                      day_range_middle: 'border-t-2 border-b-2 border-blue-500'
                    }}
                    formatters={{
                      formatCaption: (date: Date) => format(date, 'MMMM yyyy'),
                      formatDay: (date: Date) => {
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const stats = ordersByDate[dateKey];
                        return (
                          <>
                            <div>{format(date, 'd')}</div>
                            {stats?.count > 0 && (
                              <div className="text-xs text-blue-600">({stats.count})</div>
                            )}
                          </>
                        );
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700">Products</label>
              <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {selectedProducts.length > 0 ? (
                      `${selectedProducts.length} selected`
                    ) : (
                      <span>Select products</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="flex justify-between pb-2 border-b">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAllProducts}
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeselectAllProducts}
                        className="text-xs"
                      >
                        Deselect All
                      </Button>
                    </div>
                    <div className="grid gap-2 max-h-60 overflow-y-auto px-1">
                      {uniqueProducts.map((product) => {
                        const productId = `product-${product.replace(/\s+/g, '-').toLowerCase()}`;
                        return (
                          <div key={productId} className="flex items-center space-x-2">
                            <Checkbox
                              id={productId}
                              checked={selectedProducts.includes(product)}
                              onCheckedChange={(checked) => {
                                if (checked === true) {
                                  setSelectedProducts(prev => [...prev, product]);
                                } else if (checked === false) {
                                  setSelectedProducts(prev =>
                                    prev.filter(p => p !== product)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={productId}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {product}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>


            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700">Order Status</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {selectedStatus.length > 0 ? (
                      `${selectedStatus.length} selected`
                    ) : (
                      <span>Select status</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="flex justify-between pb-2 border-b">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAllStatus}
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeselectAllStatus}
                        className="text-xs"
                      >
                        Deselect All
                      </Button>
                    </div>
                    <div className="grid gap-2 max-h-60 overflow-y-auto px-1">
                      {uniqueStatuses.map((status) => {
                        const statusId = `status-${status.replace(/\s+/g, '-').toLowerCase()}`;
                        return (
                          <div key={statusId} className="flex items-center space-x-2">
                            <Checkbox
                              id={statusId}
                              checked={selectedStatus.includes(status)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedStatus(prev => [...prev, status]);
                                } else {
                                  setSelectedStatus(prev => prev.filter(s => s !== status));
                                }
                              }}
                            />
                            <label
                              htmlFor={statusId}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {status}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700">Sales Channel</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {selectedChannel.length > 0 ? (
                      `${selectedChannel.length} selected`
                    ) : (
                      <span>Select channel</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="flex justify-between pb-2 border-b">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAllChannels}
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeselectAllChannels}
                        className="text-xs"
                      >
                        Deselect All
                      </Button>
                    </div>
                    <div className="grid gap-2 max-h-60 overflow-y-auto px-1">
                      {uniqueChannels.map((channel) => {
                        const channelId = `channel-${channel.replace(/\s+/g, '-').toLowerCase()}`;
                        return (
                          <div key={channelId} className="flex items-center space-x-2">
                            <Checkbox
                              id={channelId}
                              checked={selectedChannel.includes(channel)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedChannel(prev => [...prev, channel]);
                                } else {
                                  setSelectedChannel(prev => prev.filter(c => c !== channel));
                                }
                              }}
                            />
                            <label
                              htmlFor={channelId}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {channel}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

            </div>

          </div>

          {((dateRange?.from && dateRange?.to) || selectedProducts.length > 0 || selectedStatus.length > 0 || selectedChannel.length > 0) && (
            <div className="mt-4 flex items-end">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute bottom-10 right-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
      >
        {isVisible ? <EyeOff className="h-7 w-7" /> : <Eye className="h-7 w-7" />}
      </button>
    </>
  );
};

export default OrderFilters;