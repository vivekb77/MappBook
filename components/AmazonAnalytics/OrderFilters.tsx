import React, { useState, useEffect, SetStateAction, Dispatch } from 'react';
import { useReportContext } from '@/context/ReportContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange, DayProps } from 'react-day-picker';
import { Checkbox } from '@/components/ui/checkbox';

interface Order {
  purchase_date: string;
  product_name: string;
  item_price: number;
  currency: string;
}

interface ReportData {
  orders: Order[];
  [key: string]: any;
}

interface OrderStats {
  count: number;
  totals: { [key: string]: number };
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

  const DayWithOrders = (props: DayProps) => {
    const dateKey = format(props.date, 'yyyy-MM-dd');
    const dayStats = ordersByDate[dateKey] || { count: 0, total: 0 };
    
    return (
      <div className={`flex flex-col items-center p-1.5 rounded-md ${dayStats.count > 0 ? 'bg-gray-50' : ''} hover:opacity-75`}>
        <div className="text-sm font-medium">{format(props.date, 'd')}</div>
        {dayStats.count > 0 && (
          <div className="text-xs text-gray-500">
            ({dayStats.count})
          </div>
        )}
      </div>
    );
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
    return filteredOrders
      .map(order => order.product_name)
      .filter((value, index, self) => self.indexOf(value) === index);
  };

  const getFilteredOrdersStats = (): OrderStats => {
    if (!originalData?.orders) return { count: 0, totals: {} };

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

    if (selectedProducts.length > 0) {
      filteredOrders = filteredOrders.filter(order => 
        selectedProducts.includes(order.product_name)
      );
    }

    const totals = filteredOrders.reduce((acc: { [key: string]: number }, order) => {
      const currency = order.currency || '?';
      acc[currency] = (acc[currency] || 0) + (order.item_price || 0);
      return acc;
    }, {});

    return {
      count: filteredOrders.length,
      totals: totals
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
  }, [dateRange]);

  useEffect(() => {
    filterData();
  }, [selectedProducts]);

  const handleReset = (): void => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedProducts([]);
    if (originalData) {
      setReportData(originalData);
    }
  };

  const handleSelectAll = (): void => {
    setSelectedProducts(getFilteredProducts());
  };

  const handleDeselectAll = (): void => {
    setSelectedProducts([]);
  };

  const uniqueProducts = getFilteredProducts();
  const orderStats = getFilteredOrdersStats();

  return (
    <>
      <div className={`absolute bottom-[7%] left-0 right-0 flex justify-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-[80%] bg-white shadow-lg rounded-lg p-6">
          {((dateRange?.from && dateRange?.to) || selectedProducts.length > 0) && (
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm font-medium text-gray-700">
                Total Orders: {orderStats.count}
              </div>
              <div className="text-sm font-medium text-gray-700">
                {Object.entries(orderStats.totals).map(([currency, amount]) => {
                  const formattedAmount = currency !== '?'
                    ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currency
                    }).format(amount)
                    : `${amount}`;

                  return (
                    <div key={currency} className="py-1">
                      {currency}: {formattedAmount}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => setDateRange(range || undefined)}
                    numberOfMonths={2}
                    components={{
                      Day: DayWithOrders
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
                        onClick={handleSelectAll}
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeselectAll}
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
          </div>

          {((dateRange?.from && dateRange?.to) || selectedProducts.length > 0) && (
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